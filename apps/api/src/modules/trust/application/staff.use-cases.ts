/**
 * Implémentation UNIQUE des ports staff ADMIN_MODERATION / ADMIN_TRUST (consommés par le
 * module admin de l'agent F). Rôles revérifiés ici, audit de chaque action (lecture de
 * dossier incluse), motif obligatoire, idempotence par commandId (CommandBus).
 * Décisions append-only (supersedesId) ; une correction ne réattribue aucun XP (claimExchange).
 * Une revue staff de vérification n'accorde JAMAIS IDENTITY_AGE (badge « selfie contrôlé »).
 */
import type {
  AdminModerationPort,
  AdminTrustPort,
  CaseStatus,
  CaseSubjectType,
  StaffActor,
  StaffAiJobView,
  StaffCaseView,
  StaffVerificationView,
} from '../../../shared/application/ports/admin-trust.port.js';
import type { AiTaskQueue } from '../../../shared/application/ports/ai.port.js';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import { decodeCursor, encodeCursor } from '../../../shared/application/pagination.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import type { ModerateMessageUseCase } from '../../conversations/application/moderate-message.use-case.js';
import type { SafetyStaffPort } from '../../../shared/application/ports/safety-staff.port.js';
import { staffCan, validReason, type StaffAction } from '../domain/staff.js';
import type { AiInvalidation, CaseRow, TrustRepository, VerificationRow } from './ports/trust.repository.js';

/** Effet d'une décision humaine sur un sujet non-message (médias / preuves), fourni par media. */
export interface SubjectDecisionPort {
  applyMediaDecision(mediaId: string, action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'WITHDRAW', staffUserId: string): Promise<void>;
  applyProofDecision(proofId: string, action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'WITHDRAW', staffUserId: string): Promise<void>;
}
export const SUBJECT_DECISION_PORT = Symbol.for('blowy.media.subjectDecision');

const STAFF_POLICY = 'staff-decision-2026.11.0';

function cursorAfter(cursor: string | undefined) {
  const c = decodeCursor(cursor);
  return c && typeof c[0] === 'number' && typeof c[1] === 'string' ? { createdAt: new Date(c[0]), id: c[1] } : null;
}
function pageOf<T extends { id: string }>(rows: T[], limit: number, date: (r: T) => Date) {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > limit && last ? encodeCursor([date(last).getTime(), last.id]) : null };
}

export class StaffGuard {
  constructor(private readonly repo: TrustRepository, private readonly clock: Clock) {}
  require(actor: StaffActor, action: StaffAction) {
    if (!actor?.staffUserId || !Array.isArray(actor.roles) || !staffCan(actor.roles, action)) throw Errors.forbidden('Rôle staff insuffisant');
  }
  reason(r: string | undefined) {
    if (!validReason(r)) throw Errors.precondition('REASON_REQUIRED');
  }
  audit(actor: StaffActor, action: string, targetType: string, targetId: string | null, reason: string | null, data?: Record<string, unknown>) {
    return this.repo.audit(null, { actorUserId: actor.staffUserId, actorRole: actor.roles.join(','), action, targetType, targetId, reason, ...(data ? { data } : {}), requestId: actor.requestId ?? null, at: this.clock.now() });
  }
}

export class AdminModerationService implements AdminModerationPort {
  constructor(
    private readonly repo: TrustRepository,
    private readonly bus: CommandBus,
    private readonly guard: StaffGuard,
    private readonly moderate: ModerateMessageUseCase,
    private readonly subjects: SubjectDecisionPort | null,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly safety: SafetyStaffPort | null = null,
  ) {}

  private async view(c: CaseRow): Promise<StaffCaseView> {
    const decisions = await this.repo.decisionsFor(c.subjectType, c.subjectId);
    const signals: Record<string, number> = {};
    for (const d of decisions) for (const [k, v] of Object.entries(d.signals ?? {})) if (typeof v === 'number') signals[k] = v;
    return {
      id: c.id,
      subjectType: c.subjectType,
      subjectId: c.subjectId,
      status: c.status,
      priority: c.priority,
      reasonCode: c.reasonCode,
      dueAt: c.dueAt.toISOString(),
      overdue: c.status !== 'RESOLVED' && c.dueAt < this.clock.now(),
      assignedToId: c.assignedToId,
      createdAt: c.createdAt.toISOString(),
      reportCategory: c.reportCategory,
      automaticSignals: c.restricted ? {} : signals,
      decisions: decisions.map((d) => ({ id: d.id, action: d.action, source: d.source, policyVersion: d.policyVersion, provider: d.provider, reasonCode: d.reasonCode, supersedesId: d.supersedesId, createdAt: d.createdAt.toISOString() })),
      restricted: c.restricted,
    };
  }

  async listCases(actor: StaffActor, q: { status?: CaseStatus; subjectType?: CaseSubjectType; priority?: number; cursor?: string; limit: number }) {
    this.guard.require(actor, 'cases.list');
    const rows = await this.repo.listCases({ ...q, after: cursorAfter(q.cursor), limit: q.limit + 1, includeRestricted: staffCan(actor.roles, 'cases.restricted') });
    const p = pageOf(rows, q.limit, (r) => r.createdAt);
    return { items: await Promise.all(p.items.map((c) => this.view(c))), nextCursor: p.nextCursor };
  }

  async getCase(actor: StaffActor, caseId: string, opts: { justification?: string } = {}) {
    this.guard.require(actor, 'cases.read');
    const c = await this.repo.loadCase(null, caseId);
    if (!c || (c.restricted && !staffCan(actor.roles, 'cases.restricted'))) throw Errors.notFound('Dossier');
    if ((c.subjectType === 'MEDIA' || c.subjectType === 'MISSION_SUBMISSION') && (!opts.justification || opts.justification.trim().length < 10)) throw Errors.precondition('JUSTIFICATION_REQUIRED');
    await this.guard.audit(actor, 'case.read', 'ModerationCase', c.id, opts.justification ?? null, { subjectType: c.subjectType });
    // Protection des mineurs : aucun contenu dans l'outil ordinaire, même pour le rôle habilité.
    const context = c.restricted ? { restricted: true, subject: null, neighbours: [] } : await this.contextOf(c);
    return {
      ...(await this.view(c)),
      context: {
        restricted: c.restricted,
        subject: context.subject ? { ...context.subject, createdAt: context.subject.createdAt.toISOString() } : null,
        neighbours: context.neighbours.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
      },
    };
  }

  /** Contexte V5 : alerte (résumé sans position) ; sinon contexte existant (messages voisins). */
  private async contextOf(c: CaseRow) {
    if (c.subjectType === 'SAFETY_ALERT' || c.subjectType === 'OUTING') {
      const text = (await this.safety?.caseSummary(c.subjectType, c.subjectId)) ?? (c.subjectType === 'OUTING' ? `Sortie · ${c.reasonCode}` : null);
      return { subject: { kind: c.subjectType, text, mediaVariant: null, createdAt: c.createdAt }, neighbours: [] };
    }
    return this.repo.caseContext(c);
  }

  async assign(actor: StaffActor, caseId: string, assigneeId: string | null) {
    this.guard.require(actor, 'cases.assign');
    const c = await this.repo.loadCase(null, caseId);
    if (!c) throw Errors.notFound('Dossier');
    await this.bus.execute({
      actorId: actor.staffUserId,
      operation: 'staff.case_assign',
      commandId: this.random.uuid(),
      payload: { caseId, assigneeId },
      handle: async (scope) => {
        await this.repo.updateCase(scope, caseId, { assignedToId: assigneeId, status: assigneeId ? 'ASSIGNED' : 'OPEN' });
        await this.repo.audit(scope, { actorUserId: actor.staffUserId, actorRole: actor.roles.join(','), action: 'case.assign', targetType: 'ModerationCase', targetId: caseId, reason: null, data: { assigneeId }, requestId: actor.requestId ?? null, at: scope.now });
      },
    });
    return this.view((await this.repo.loadCase(null, caseId))!);
  }

  async decide(actor: StaffActor, caseId: string, input: { action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'WITHDRAW'; reason: string; commandId: string }) {
    this.guard.require(actor, 'cases.decide');
    this.guard.reason(input.reason);
    const c = await this.repo.loadCase(null, caseId);
    if (!c || (c.restricted && !staffCan(actor.roles, 'cases.restricted'))) throw Errors.notFound('Dossier');
    const { replayed } = await this.bus.execute({
      actorId: actor.staffUserId,
      operation: 'staff.case_decide',
      commandId: input.commandId,
      payload: { caseId, action: input.action, reason: input.reason },
      handle: async (scope) => {
        await this.repo.updateCase(scope, caseId, { status: 'RESOLVED', resolvedAt: scope.now });
        await this.repo.audit(scope, { actorUserId: actor.staffUserId, actorRole: actor.roles.join(','), action: `case.decide.${input.action}`, targetType: 'ModerationCase', targetId: caseId, reason: input.reason, requestId: actor.requestId ?? null, at: scope.now });
        return { ok: true };
      },
    });
    if (!replayed) await this.applyToSubject(c, input.action, actor.staffUserId, input.reason);
    return this.view((await this.repo.loadCase(null, caseId))!);
  }

  private async applyToSubject(c: CaseRow, action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'WITHDRAW', staffUserId: string, reason: string) {
    if (c.subjectType === 'MESSAGE') {
      await this.moderate.applyHuman(c.subjectId, { action, reasonCode: `STAFF_${action}`, policyVersion: STAFF_POLICY, provider: 'staff', source: 'HUMAN' }, staffUserId);
    } else if (c.subjectType === 'MEDIA' && this.subjects) {
      await this.subjects.applyMediaDecision(c.subjectId, action, staffUserId);
    } else if (c.subjectType === 'MISSION_SUBMISSION' && this.subjects) {
      await this.subjects.applyProofDecision(c.subjectId, action, staffUserId);
    } else if (c.subjectType === 'SAFETY_ALERT' && this.safety) {
      // Dossier d'alerte décidé dans l'outil existant : l'alerte est prise en charge (HANDLED).
      await this.safety.onCaseDecided(c.subjectType, c.subjectId, staffUserId);
    }
    void reason;
  }

  async sanction(actor: StaffActor, input: { userId: string; kind: 'WARN' | 'RESTRICT' | 'SUSPEND' | 'BAN' | 'RESTORE'; reason: string; commandId: string }) {
    this.guard.require(actor, 'users.sanction');
    this.guard.reason(input.reason);
    const status = { WARN: null, RESTRICT: 'RESTRICTED', SUSPEND: 'SUSPENDED', BAN: 'BANNED', RESTORE: 'ACTIVE' }[input.kind] as 'RESTRICTED' | 'SUSPENDED' | 'BANNED' | 'ACTIVE' | null;
    const { result } = await this.bus.execute({
      actorId: actor.staffUserId,
      operation: 'staff.sanction',
      commandId: input.commandId,
      payload: input,
      handle: async (scope) => {
        await scope.lock.users([input.userId]);
        if (status) await this.repo.setUserStatus(scope, input.userId, status);
        if (status === 'SUSPENDED' || status === 'BANNED') {
          await this.repo.revokeSessions(scope, input.userId);
          await scope.outbox.emit({ topic: 'realtime.disconnect', aggregateType: 'User', aggregateId: input.userId, payload: {} });
        }
        await this.repo.audit(scope, { actorUserId: actor.staffUserId, actorRole: actor.roles.join(','), action: `user.sanction.${input.kind}`, targetType: 'User', targetId: input.userId, reason: input.reason, requestId: actor.requestId ?? null, at: scope.now });
        return { userId: input.userId, status: status ?? 'ACTIVE' };
      },
    });
    return result;
  }

  async listAppeals(actor: StaffActor, q: { status?: 'OPEN' | 'UPHELD' | 'OVERTURNED'; cursor?: string; limit: number }) {
    this.guard.require(actor, 'cases.list');
    const rows = await this.repo.listAppeals({ ...(q.status ? { status: q.status } : {}), after: cursorAfter(q.cursor), limit: q.limit + 1 });
    const p = pageOf(rows, q.limit, (r) => r.createdAt);
    return { items: p.items.map((a) => ({ id: a.id, caseId: a.caseId, status: a.status, createdAt: a.createdAt.toISOString() })), nextCursor: p.nextCursor };
  }

  async resolveAppeal(actor: StaffActor, appealId: string, input: { outcome: 'UPHELD' | 'OVERTURNED'; reason: string; commandId: string }) {
    this.guard.require(actor, 'appeals.resolve');
    this.guard.reason(input.reason);
    const a = await this.repo.loadAppeal(null, appealId);
    if (!a) throw Errors.notFound('Recours');
    const c = (await this.repo.loadCase(null, a.caseId))!;
    const { replayed } = await this.bus.execute({
      actorId: actor.staffUserId,
      operation: 'staff.appeal_resolve',
      commandId: input.commandId,
      payload: { appealId, ...input },
      handle: async (scope) => {
        const cur = await this.repo.loadAppeal(scope, appealId);
        if (cur?.status !== 'OPEN') throw Errors.precondition('APPEAL_NOT_OPEN');
        await this.repo.resolveAppeal(scope, appealId, input.outcome);
        await this.repo.audit(scope, { actorUserId: actor.staffUserId, actorRole: actor.roles.join(','), action: `appeal.${input.outcome}`, targetType: 'Appeal', targetId: appealId, reason: input.reason, requestId: actor.requestId ?? null, at: scope.now });
        return { ok: true };
      },
    });
    // Recours accepté : la décision est corrigée (publication), sans XP multiple.
    if (!replayed && input.outcome === 'OVERTURNED') await this.applyToSubject(c, 'ALLOW', actor.staffUserId, input.reason);
    return { id: appealId, status: input.outcome };
  }

  async stats(actor: StaffActor) {
    this.guard.require(actor, 'cases.list');
    return this.repo.caseStats(this.clock.now());
  }
}

const mask = (ref: string | null) => (ref ? `…${ref.slice(-4)}` : null);
const verView = (v: VerificationRow): StaffVerificationView => ({ id: v.id, userId: v.userId, kind: v.kind, provenance: v.provenance, status: v.status, providerRef: mask(v.providerRef), decisionCode: v.decisionCode, reasonCode: v.reasonCode, createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString(), expiresAt: v.expiresAt?.toISOString() ?? null });

/** Revérification d'autorisation avant un réessai de tâche IA (fournie par le module trust). */
export interface AiRetryAuthorizer {
  stillAuthorized(job: { kind: string; subjectType: string; subjectId: string; userId: string | null; contextId: string | null }): Promise<boolean>;
  /** Relance la tâche métier correspondante (file IA). */
  requeue(job: { kind: string; subjectType: string; subjectId: string }): Promise<void>;
}

export class AdminTrustService implements AdminTrustPort {
  constructor(
    private readonly repo: TrustRepository,
    private readonly ai: AiInvalidation,
    private readonly bus: CommandBus,
    private readonly uow: UnitOfWork,
    private readonly guard: StaffGuard,
    private readonly retry: AiRetryAuthorizer,
    private readonly random: RandomSource,
    _queue: AiTaskQueue | null,
    private readonly safety: SafetyStaffPort | null = null,
  ) {}

  private safetyPort(): SafetyStaffPort {
    if (!this.safety) throw new AppError('NOT_CONFIGURED', 'Module sécurité absent');
    return this.safety;
  }

  async listSafetyAlerts(actor: StaffActor, q: { status?: 'OPEN' | 'SAFE' | 'HANDLED'; cursor?: string; limit: number }) {
    this.guard.require(actor, 'safety.alerts');
    return this.safetyPort().listAlerts(q);
  }

  async getSafetyAlert(actor: StaffActor, alertId: string, opts: { justification: string }) {
    this.guard.require(actor, 'safety.alerts');
    if (!opts?.justification || opts.justification.trim().length < 10) throw Errors.precondition('JUSTIFICATION_REQUIRED');
    const a = await this.safetyPort().getAlert(alertId);
    if (!a) throw Errors.notFound('Alerte');
    // Lecture d'une position : toujours auditée (motif conservé, jamais la position elle-même).
    await this.guard.audit(actor, 'safety.alert.read', 'SafetyAlert', alertId, opts.justification, { positionAttached: a.positionAttached });
    return a;
  }

  async handleSafetyAlert(actor: StaffActor, alertId: string, input: { reason: string; commandId: string }) {
    this.guard.require(actor, 'safety.alerts');
    this.guard.reason(input.reason);
    const v = await this.safetyPort().handle(alertId, actor.staffUserId, input.commandId);
    await this.guard.audit(actor, 'safety.alert.handle', 'SafetyAlert', alertId, input.reason);
    return v;
  }

  async resolveKnowsSomeone(actor: StaffActor, seatId: string, input: { accept: boolean; reason: string; commandId: string }) {
    this.guard.require(actor, 'safety.knows_someone');
    this.guard.reason(input.reason);
    const r = await this.safetyPort().resolveKnowsSomeone(seatId, input.accept, actor.staffUserId, input.commandId);
    await this.guard.audit(actor, `safety.knows_someone.${input.accept ? 'accept' : 'reject'}`, 'OutingSeat', seatId, input.reason, { status: r.status });
    return r;
  }

  async listVerifications(actor: StaffActor, q: { status?: string; cursor?: string; limit: number }) {
    this.guard.require(actor, 'verifications.list');
    const rows = await this.repo.listVerifications({ ...(q.status ? { status: q.status } : {}), after: cursorAfter(q.cursor), limit: q.limit + 1 });
    const p = pageOf(rows, q.limit, (r) => r.createdAt);
    return { items: p.items.map(verView), nextCursor: p.nextCursor };
  }

  async reviewVerification(actor: StaffActor, sessionId: string, input: { decision: 'APPROVE_SELFIE_REVIEW' | 'REJECT' | 'REQUEST_RETRY'; reason: string; commandId: string }) {
    this.guard.require(actor, 'verifications.review');
    this.guard.reason(input.reason);
    const v = await this.repo.loadVerification(null, sessionId);
    if (!v) throw Errors.notFound('Vérification');
    const { result } = await this.bus.execute({
      actorId: actor.staffUserId,
      operation: 'staff.verification_review',
      commandId: input.commandId,
      payload: { sessionId, ...input },
      handle: async (scope) => {
        await scope.lock.users([v.userId]);
        let id = v.id;
        if (input.decision === 'APPROVE_SELFIE_REVIEW') {
          // Nouvelle session distincte : SELFIE_HUMAN_REVIEW / STAFF — jamais IDENTITY_AGE.
          id = this.random.uuid();
          await this.repo.createVerification(scope, { id, userId: v.userId, kind: 'SELFIE_HUMAN_REVIEW', provenance: 'STAFF', status: 'VERIFIED', providerRef: `staff:${id}`, expiresAt: new Date(scope.now.getTime() + 365 * 86_400_000), reasonCode: 'STAFF_SELFIE_REVIEW' });
        } else {
          if (v.status === 'VERIFIED' && v.provenance === 'PROVIDER') throw Errors.precondition('PROVIDER_DECISION_FINAL');
          await this.repo.updateVerification(scope, v.id, { status: input.decision === 'REJECT' ? 'REJECTED' : 'NEEDS_RETRY', reasonCode: `STAFF_${input.decision}` });
        }
        await this.repo.audit(scope, { actorUserId: actor.staffUserId, actorRole: actor.roles.join(','), action: `verification.${input.decision}`, targetType: 'VerificationSession', targetId: v.id, reason: input.reason, requestId: actor.requestId ?? null, at: scope.now });
        await scope.outbox.emit({ topic: 'user.verification_changed', aggregateType: 'User', aggregateId: v.userId, payload: { status: input.decision, provenance: 'STAFF' } });
        return { id };
      },
    });
    return verView((await this.repo.loadVerification(null, result.id))!);
  }

  async listReports(actor: StaffActor, q: { status?: string; category?: string; cursor?: string; limit: number }) {
    this.guard.require(actor, 'reports.list');
    const rows = await this.repo.listReports({ ...(q.status ? { status: q.status } : {}), ...(q.category ? { category: q.category } : {}), after: cursorAfter(q.cursor), limit: q.limit + 1 });
    const p = pageOf(rows, q.limit, (r) => r.createdAt);
    // Le signaleur n'apparaît jamais.
    return { items: p.items.map((r) => ({ id: r.id, reportedUserId: r.reportedUserId, category: r.category, safetyExit: r.safetyExit, status: r.status, createdAt: r.createdAt.toISOString() })), nextCursor: p.nextCursor };
  }

  async listExports(actor: StaffActor, q: { status?: string; cursor?: string; limit: number }) {
    this.guard.require(actor, 'privacy.list');
    const rows = await this.repo.listExports({ ...(q.status ? { status: q.status } : {}), after: cursorAfter(q.cursor), limit: q.limit + 1 });
    const p = pageOf(rows, q.limit, (r) => r.requestedAt);
    return { items: p.items.map((r) => ({ id: r.id, userId: r.userId, status: r.status, requestedAt: r.requestedAt.toISOString(), readyAt: r.readyAt?.toISOString() ?? null, expiresAt: r.expiresAt?.toISOString() ?? null })), nextCursor: p.nextCursor };
  }

  async listDeletionRequests(actor: StaffActor, q: { status?: string; cursor?: string; limit: number }) {
    this.guard.require(actor, 'privacy.list');
    const rows = await this.repo.listDeletions({ ...(q.status ? { status: q.status } : {}), after: cursorAfter(q.cursor), limit: q.limit + 1 });
    const p = pageOf(rows, q.limit, (r) => r.requestedAt);
    return { items: p.items.map((r) => ({ id: r.id, userId: r.userId, status: r.status, requestedAt: r.requestedAt.toISOString(), completedAt: r.completedAt?.toISOString() ?? null, purgeAfter: r.purgeAfter?.toISOString() ?? null })), nextCursor: p.nextCursor };
  }

  private jobView(j: Awaited<ReturnType<AiInvalidation['listJobs']>>[number]): StaffAiJobView {
    return { id: j.id, kind: j.kind, status: j.status, provider: j.provider, model: j.model, promptVersion: j.promptVersion, attempts: j.attempts, lastErrorCode: j.lastErrorCode, durationMs: j.durationMs, inputTokens: j.inputTokens, outputTokens: j.outputTokens, costMicros: j.costMicros, createdAt: j.createdAt.toISOString() };
  }

  async listAiJobs(actor: StaffActor, q: { status?: string; kind?: string; cursor?: string; limit: number }) {
    this.guard.require(actor, 'ai.list');
    const rows = await this.ai.listJobs({ ...(q.status ? { status: q.status } : {}), ...(q.kind ? { kind: q.kind } : {}), after: cursorAfter(q.cursor), limit: q.limit + 1 });
    const p = pageOf(rows, q.limit, (r) => r.createdAt);
    return { items: p.items.map((j) => this.jobView(j)), nextCursor: p.nextCursor };
  }

  private async job(id: string) {
    const j = (await this.ai.listJobs({ limit: 1000 })).find((x) => x.id === id);
    if (!j) throw Errors.notFound('Tâche IA');
    return j;
  }

  async retryAiJob(actor: StaffActor, jobId: string, _commandId: string) {
    this.guard.require(actor, 'ai.operate');
    const j = await this.job(jobId);
    if (j.status === 'SUCCEEDED') throw Errors.precondition('JOB_SUCCEEDED');
    // Le redrive contrôle l'état ACTUEL : jamais une ancienne permission.
    if (!(await this.retry.stillAuthorized(j))) throw new AppError('PRECONDITION_FAILED', 'Autorisation actuelle absente', { detailsSafe: { reason: 'NOT_AUTHORIZED_NOW' } });
    await this.ai.setJobStatus(jobId, 'QUEUED', null);
    await this.guard.audit(actor, 'ai.retry', 'AIJob', jobId, null);
    await this.retry.requeue(j);
    return this.jobView(await this.job(jobId));
  }

  async cancelAiJob(actor: StaffActor, jobId: string) {
    this.guard.require(actor, 'ai.operate');
    await this.job(jobId);
    await this.ai.setJobStatus(jobId, 'CANCELLED', 'STAFF');
    await this.guard.audit(actor, 'ai.cancel', 'AIJob', jobId, null);
    void this.uow;
    return this.jobView(await this.job(jobId));
  }
}
