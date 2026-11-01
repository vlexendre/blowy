/**
 * Cas d'usage du back-office (§18.1–18.13). Chaque mutation passe par AdminCommandRunner :
 * permission serveur, step-up si sensible, idempotence, transaction, audit append-only.
 * Aucune règle de jeu n'est recopiée : niveaux via EngineGateway, économie via ADMIN_ECONOMY (G),
 * modération/vérification via ADMIN_MODERATION/ADMIN_TRUST (E).
 */
import type {
  AdminMissionVersion,
  ContentPreview,
  DashboardView,
  MissionBounds,
  MissionDraftRequest,
  TuningDiffEntry,
  TuningOverview,
} from '@blowy/api-contract';
import { DEFAULT_TUNING, safeParseTuning, type Tuning } from '@blowy/tuning';
import { buildFrLocale } from '@blowy/content';
import type { Clock, RandomSource } from '../../../../shared/application/clock.js';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { EngineGateway } from '../../../../shared/application/ports/engine.gateway.js';
import type { AdminEconomyPort } from '../../../economy/application/use-cases/admin-economy.use-cases.js';
import { AppError, Errors } from '../../../../shared/domain/errors.js';
import { jsonDiff, renderPreview, validateContentEntry, variablesOf } from '../../domain/content-rules.js';
import { assertEditable, assertMissionTransition, assertRewardsWithin } from '../../domain/mission-rules.js';
import { authorize, type AdminActor, type AdminCommandRunner } from '../admin-command.js';
import type {
  AdminModerationPort,
  AdminTrustPort,
  AuditLog,
  ConfigRepository,
  DashboardQueryPort,
  MissionAdminRepository,
  OutboxAdminRepository,
  PetAdminRepository,
  ReadModelsPort,
  RedriveGuard,
  StaffActor,
  TuningSimulator,
  UserAdminRepository,
} from '../ports/admin.ports.js';

const notConfigured = (what: string) => new AppError('NOT_CONFIGURED', `${what} : service non branché`, { detailsSafe: { reason: 'SERVICE_NOT_WIRED', service: what } });

export const toStaffActor = (a: AdminActor): StaffActor => ({ staffUserId: a.userId, roles: [...a.roles], ...(a.requestId ? { requestId: a.requestId } : {}) });

// ------------------------------------------------------------------ 18.1 Dashboard
export class DashboardUseCase {
  constructor(private readonly q: DashboardQueryPort, private readonly clock: Clock) {}
  async execute(actor: AdminActor, from?: string, to?: string, zone?: string): Promise<DashboardView> {
    authorize(actor, 'dashboard.read');
    const now = this.clock.now();
    const end = to ? new Date(to) : now;
    const start = from ? new Date(from) : new Date(end.getTime() - 30 * 86_400_000);
    if (!(start < end)) throw Errors.validation({ reason: 'INVALID_PERIOD' });
    if (end.getTime() - start.getTime() > 400 * 86_400_000) throw Errors.validation({ reason: 'PERIOD_TOO_LONG' });
    return this.q.compute({ from: start, to: end, zone: zone ?? null, now });
  }
}

// ------------------------------------------------------------------ 18.2 Utilisateurs (lecture) + sanctions via E
export class UsersUseCases {
  constructor(
    private readonly users: UserAdminRepository,
    private readonly audit: AuditLog,
    private readonly runner: AdminCommandRunner,
    private readonly moderation: AdminModerationPort | null,
    private readonly clock: Clock,
  ) {}

  search(actor: AdminActor, q: { q?: string; status?: string; cursor?: string; limit: number }) {
    authorize(actor, 'users.read');
    return this.users.search(q);
  }

  async detail(actor: AdminActor, userId: string) {
    authorize(actor, 'users.read');
    const d = await this.users.detail(userId, this.clock.now());
    if (!d) throw Errors.notFound('Utilisateur');
    // Consultation d'une fiche : tracée (pas de contenu privé dans la fiche).
    await this.audit.recordNow({ actorUserId: actor.userId, actorRole: actor.roles.join(','), action: 'users.viewed', targetType: 'User', targetId: userId, reason: null, requestId: actor.requestId });
    const trail = await this.audit.list({ targetType: 'User', targetId: userId, limit: 30 });
    return { ...d, auditTrail: trail.items };
  }

  /** Avertir/restreindre/suspendre/bannir/rétablir : délégué au port de E (seule implémentation). */
  async act(actor: AdminActor, userId: string, kind: 'WARN' | 'RESTRICT' | 'SUSPEND' | 'BAN' | 'RESTORE', reason: string, commandId: string) {
    const permission = ({ WARN: 'users.warn', RESTRICT: 'users.restrict', SUSPEND: 'users.suspend', BAN: 'users.ban', RESTORE: 'users.restore' } as const)[kind];
    authorize(actor, permission);
    if (userId === actor.userId) throw Errors.forbidden('Action sur son propre compte interdite');
    const port = this.moderation;
    if (!port) throw notConfigured('Sanctions (module confiance)');
    return this.runner.delegate(actor, {
      permission,
      operation: `users.${kind.toLowerCase()}`,
      reason,
      target: { type: 'User', id: userId },
      commandId,
      call: () => port.sanction(toStaffActor(actor), { userId, kind, reason, commandId }),
    });
  }
}

// ------------------------------------------------------------------ 18.3 Pets / relations
export class PetsRelationshipsUseCases {
  constructor(
    private readonly repo: PetAdminRepository,
    private readonly engine: EngineGateway,
    private readonly runner: AdminCommandRunner,
    private readonly relationshipsWriter: RelationshipRepairWriter,
  ) {}

  async pet(actor: AdminActor, id: string) {
    authorize(actor, 'pets.read');
    const p = await this.repo.pet(id);
    if (!p) throw Errors.notFound('Pet');
    return p;
  }

  async relationship(actor: AdminActor, id: string) {
    authorize(actor, 'relationships.read');
    const r = await this.repo.relationship(id);
    if (!r) throw Errors.notFound('Relation');
    const computed = this.engine.levelFor(r.xpMilli, r.branch as 'UNDECIDED' | 'FRIEND' | 'PLUS');
    const notes: string[] = [];
    if (computed !== r.eligibleLevel) notes.push(`Niveau éligible stocké ${r.eligibleLevel} ≠ moteur ${computed} (${this.engine.engineVersion}/${this.engine.tuningVersion}).`);
    if (r.reachedLevel < r.eligibleLevel) notes.push('Niveau atteint inférieur à l’éligible : une porte de consentement n’a pas encore été franchie (normal).');
    if (r.engineVersion !== this.engine.engineVersion) notes.push(`Relation créée avec ${r.engineVersion}, moteur courant ${this.engine.engineVersion}.`);
    return { ...r, diagnostics: { computedEligibleLevel: computed, eligibleMismatch: computed !== r.eligibleLevel, engineAvailable: true, notes } };
  }

  /**
   * Réparation corrective auditée : SEUL le niveau éligible dérivé est recalculé par le moteur.
   * XP, niveau atteint, branche, consentements et votes ne sont jamais modifiés.
   */
  repair(actor: AdminActor, id: string, reason: string, commandId: string) {
    return this.runner.run(actor, {
      permission: 'relationships.repair',
      operation: 'relationships.repair_eligible_level',
      commandId,
      payload: { id, reason },
      reason,
      target: { type: 'RelationshipContext', id },
      handle: async (scope) => {
        await scope.lock.relationships([id]);
        const r = await this.relationshipsWriter.load(scope, id);
        if (!r) throw Errors.notFound('Relation');
        const computed = this.engine.levelFor(r.xpMilli, r.branch);
        if (computed === r.eligibleLevel) return { result: { changed: false, eligibleLevel: computed }, auditData: { noop: true } };
        await this.relationshipsWriter.correctEligible(scope, id, computed, { actorUserId: actor.userId, before: r.eligibleLevel, engineVersion: this.engine.engineVersion, tuningVersion: this.engine.tuningVersion, commandId });
        return { result: { changed: true, eligibleLevel: computed }, auditData: { before: r.eligibleLevel, after: computed } };
      },
    });
  }
}

/** Écriture corrective déléguée au module relations (propriétaire de ses tables). */
export interface RelationshipRepairWriter {
  load(scope: TxScope, id: string): Promise<{ xpMilli: number; branch: 'UNDECIDED' | 'FRIEND' | 'PLUS'; eligibleLevel: number } | null>;
  correctEligible(scope: TxScope, id: string, level: number, meta: { actorUserId: string; before: number; engineVersion: string; tuningVersion: string; commandId: string }): Promise<void>;
}
export const RELATIONSHIP_REPAIR_WRITER = Symbol('RelationshipRepairWriter');

// ------------------------------------------------------------------ 18.4 / 18.5 Modération & vérification (E)
export class TrustUseCases {
  constructor(
    private readonly moderation: AdminModerationPort | null,
    private readonly trust: AdminTrustPort | null,
    private readonly runner: AdminCommandRunner,
  ) {}

  private mod(): AdminModerationPort {
    if (!this.moderation) throw notConfigured('Modération');
    return this.moderation;
  }
  private tr(): AdminTrustPort {
    if (!this.trust) throw notConfigured('Vérification / confiance');
    return this.trust;
  }
  status() {
    return { moderation: !!this.moderation, trust: !!this.trust };
  }

  listCases(a: AdminActor, q: Parameters<AdminModerationPort['listCases']>[1]) {
    authorize(a, 'moderation.read');
    return this.mod().listCases(toStaffActor(a), q);
  }
  stats(a: AdminActor) {
    authorize(a, 'moderation.read');
    return this.mod().stats(toStaffActor(a));
  }
  getCase(a: AdminActor, id: string, justification?: string) {
    authorize(a, 'moderation.context');
    return this.mod().getCase(toStaffActor(a), id, justification ? { justification } : undefined);
  }
  assign(a: AdminActor, id: string, assigneeId: string | null, commandId: string) {
    return this.runner.delegate(a, { permission: 'moderation.assign', operation: 'moderation.assign', reason: null, target: { type: 'ModerationCase', id }, commandId, call: () => this.mod().assign(toStaffActor(a), id, assigneeId) });
  }
  decide(a: AdminActor, id: string, action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'WITHDRAW', reason: string, commandId: string) {
    return this.runner.delegate(a, { permission: 'moderation.decide', operation: `moderation.decide.${action.toLowerCase()}`, reason, target: { type: 'ModerationCase', id }, commandId, call: () => this.mod().decide(toStaffActor(a), id, { action, reason, commandId }) });
  }
  listAppeals(a: AdminActor, q: Parameters<AdminModerationPort['listAppeals']>[1]) {
    authorize(a, 'moderation.read');
    return this.mod().listAppeals(toStaffActor(a), q);
  }
  resolveAppeal(a: AdminActor, id: string, outcome: 'UPHELD' | 'OVERTURNED', reason: string, commandId: string) {
    return this.runner.delegate(a, { permission: 'moderation.appeal', operation: `moderation.appeal.${outcome.toLowerCase()}`, reason, target: { type: 'Appeal', id }, commandId, call: () => this.mod().resolveAppeal(toStaffActor(a), id, { outcome, reason, commandId }) });
  }
  listVerifications(a: AdminActor, q: Parameters<AdminTrustPort['listVerifications']>[1]) {
    authorize(a, 'verification.read');
    return this.tr().listVerifications(toStaffActor(a), q);
  }
  reviewVerification(a: AdminActor, id: string, decision: 'APPROVE_SELFIE_REVIEW' | 'REJECT' | 'REQUEST_RETRY', reason: string, commandId: string) {
    return this.runner.delegate(a, { permission: 'verification.review', operation: `verification.${decision.toLowerCase()}`, reason, target: { type: 'VerificationSession', id }, commandId, call: () => this.tr().reviewVerification(toStaffActor(a), id, { decision, reason, commandId }) });
  }
  listReports(a: AdminActor, q: Parameters<AdminTrustPort['listReports']>[1]) {
    authorize(a, 'moderation.read');
    return this.tr().listReports(toStaffActor(a), q);
  }
  listExports(a: AdminActor, q: Parameters<AdminTrustPort['listExports']>[1]) {
    authorize(a, 'users.read');
    return this.tr().listExports(toStaffActor(a), q);
  }
  listDeletions(a: AdminActor, q: Parameters<AdminTrustPort['listDeletionRequests']>[1]) {
    authorize(a, 'users.read');
    return this.tr().listDeletionRequests(toStaffActor(a), q);
  }
  listAiJobs(a: AdminActor, q: Parameters<AdminTrustPort['listAiJobs']>[1]) {
    authorize(a, 'ai.read');
    return this.tr().listAiJobs(toStaffActor(a), q);
  }
  retryAiJob(a: AdminActor, id: string, commandId: string) {
    return this.runner.delegate(a, { permission: 'ai.retry', operation: 'ai.retry', reason: null, target: { type: 'AIJob', id }, commandId, call: () => this.tr().retryAiJob(toStaffActor(a), id, commandId) });
  }
  cancelAiJob(a: AdminActor, id: string, commandId: string) {
    return this.runner.delegate(a, { permission: 'ai.retry', operation: 'ai.cancel', reason: null, target: { type: 'AIJob', id }, commandId, call: () => this.tr().cancelAiJob(toStaffActor(a), id) });
  }
}

// ------------------------------------------------------------------ 18.6 Missions
export function missionBoundsFrom(t: Tuning): MissionBounds {
  const m = t.actions.mission;
  return {
    maxLinkXpMilli: m.linkXp * m.jointMultiplier * 1000,
    maxPetXpMilli: m.petXp * m.jointMultiplier * 1000,
    maxCoins: t.coins.missionDaily * m.jointMultiplier,
    source: `${t.version} : actions.mission.{linkXp,petXp} et coins.missionDaily × jointMultiplier`,
  };
}

export class MissionsUseCases {
  private readonly bounds = missionBoundsFrom(DEFAULT_TUNING);
  private readonly locale = buildFrLocale();
  constructor(
    private readonly repo: MissionAdminRepository,
    private readonly runner: AdminCommandRunner,
    private readonly random: RandomSource,
  ) {}

  async list(a: AdminActor): Promise<{ items: AdminMissionVersion[]; bounds: MissionBounds }> {
    authorize(a, 'missions.read');
    const items = await this.repo.list();
    return { items: items.map((m) => ({ ...m, title: this.locale[m.titleKey] ?? null })), bounds: this.bounds };
  }

  private validateKeys(d: MissionDraftRequest) {
    const missing = [d.titleKey, d.accessibleAlternative].filter((k): k is string => !!k && !(k in this.locale));
    if (missing.length) throw Errors.validation({ reason: 'UNKNOWN_CONTENT_KEY', keys: missing });
    assertRewardsWithin(d, this.bounds);
  }

  /** Nouvelle définition OU nouvelle version d'une clé existante (les versions publiées sont immuables). */
  createDraft(a: AdminActor, d: MissionDraftRequest, commandId: string) {
    authorize(a, 'missions.write');
    this.validateKeys(d);
    const id = this.random.uuid();
    return this.runner.run(a, {
      permission: 'missions.write', operation: 'missions.create_draft', commandId, payload: d, reason: null, target: { type: 'MissionDefinition', id },
      handle: async (scope) => {
        const version = await this.repo.nextVersion(scope, d.key);
        await this.repo.create(scope, id, version, d);
        return { result: { id, version }, auditData: { key: d.key, version } };
      },
    });
  }

  updateDraft(a: AdminActor, id: string, d: MissionDraftRequest, commandId: string) {
    authorize(a, 'missions.write');
    this.validateKeys(d);
    return this.runner.run(a, {
      permission: 'missions.write', operation: 'missions.update_draft', commandId, payload: { id, d }, reason: null, target: { type: 'MissionDefinition', id },
      handle: async (scope) => {
        const cur = await this.repo.get(scope, id);
        if (!cur) throw Errors.notFound('Mission');
        assertEditable(cur.status);
        if (cur.key !== d.key) throw Errors.validation({ reason: 'KEY_IMMUTABLE' });
        await this.repo.update(scope, id, d);
        return { result: { id } };
      },
    });
  }

  transition(a: AdminActor, id: string, to: 'PUBLISHED' | 'ARCHIVED', reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: to === 'PUBLISHED' ? 'missions.publish' : 'missions.write', operation: to === 'PUBLISHED' ? 'missions.publish' : 'missions.archive', commandId, payload: { id, to, reason }, reason, target: { type: 'MissionDefinition', id },
      handle: async (scope) => {
        const cur = await this.repo.get(scope, id);
        if (!cur) throw Errors.notFound('Mission');
        assertMissionTransition(cur.status, to);
        await this.repo.setStatus(scope, id, to, scope.now);
        const archived = to === 'PUBLISHED' ? await this.repo.archiveOtherPublished(scope, cur.key, id) : [];
        return { result: { id, status: to, archived }, auditData: { key: cur.key, version: cur.version, archived } };
      },
    });
  }

  schedule(a: AdminActor, definitionId: string, zoneCode: string, day: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'missions.publish', operation: 'missions.schedule', commandId, payload: { definitionId, zoneCode, day }, reason: null, target: { type: 'MissionDefinition', id: definitionId },
      handle: async (scope) => {
        const cur = await this.repo.get(scope, definitionId);
        if (!cur) throw Errors.notFound('Mission');
        if (cur.status !== 'PUBLISHED') throw Errors.precondition('MISSION_NOT_PUBLISHED');
        const r = await this.repo.schedule(scope, definitionId, zoneCode, day);
        if (!r.created) throw Errors.conflict('DAY_ALREADY_SCHEDULED');
        return { result: r, auditData: { zoneCode, day } };
      },
    });
  }

  preview(a: AdminActor, d: MissionDraftRequest) {
    authorize(a, 'missions.read');
    const issues: string[] = [];
    try {
      this.validateKeys(d);
    } catch (e) {
      issues.push((e as AppError).message);
    }
    return { title: this.locale[d.titleKey] ?? null, alternative: d.accessibleAlternative ? (this.locale[d.accessibleAlternative] ?? null) : null, criteria: d.criteria, rewards: { linkXpMilli: d.linkXpMilli, petXpMilli: d.petXpMilli, coins: d.coins }, bounds: this.bounds, issues };
  }
}

// ------------------------------------------------------------------ 18.7 Contenus & 18.8 Tuning (ConfigVersion)
export class ContentUseCases {
  private readonly base = buildFrLocale();
  constructor(private readonly repo: ConfigRepository, private readonly runner: AdminCommandRunner, private readonly random: RandomSource) {}

  async overview(a: AdminActor) {
    authorize(a, 'content.read');
    const [versions, active] = await Promise.all([this.repo.list('CONTENT'), this.repo.active(null, 'CONTENT')]);
    return { baseKeys: Object.keys(this.base).length, base: this.base, versions, activeVersionId: active?.id ?? null, allowedVariables: ['pet', 'autrePet', 'lieu', 'nombre', 'prenom', 'jours', 'mot'] };
  }

  validate(entries: Record<string, string>): { entries: ContentPreview['entries']; issues: string[] } {
    const issues = Object.entries(entries).flatMap(([k, v]) => validateContentEntry(k, this.base[k], v));
    return { entries: Object.entries(entries).map(([key, draft]) => ({ key, base: this.base[key] ?? null, draft, rendered: renderPreview(draft), variables: variablesOf(draft) })), issues };
  }

  createDraft(a: AdminActor, entries: Record<string, string>, minClientVersion: string | null, note: string | undefined, commandId: string) {
    authorize(a, 'content.write');
    const { issues } = this.validate(entries);
    if (issues.length) throw Errors.validation({ reason: 'CONTENT_INVALID', issues });
    const id = this.random.uuid();
    return this.runner.run(a, {
      permission: 'content.write', operation: 'content.create_draft', commandId, payload: { entries, minClientVersion, note }, reason: note ?? null, target: { type: 'ConfigVersion', id },
      handle: async (scope) => {
        await this.repo.lockKind(scope, 'CONTENT');
        const version = `content-${scope.now.toISOString().slice(0, 10)}.${id.slice(-6)}`;
        await this.repo.create(scope, { id, kind: 'CONTENT', version, payload: { entries, note: note ?? null, status: 'DRAFT' }, authorId: a.userId, minClientVersion });
        return { result: { id, version }, auditData: { keys: Object.keys(entries).length } };
      },
    });
  }

  async preview(a: AdminActor, id: string): Promise<ContentPreview> {
    authorize(a, 'content.read');
    const v = await this.repo.get(null, id);
    if (!v || v.kind !== 'CONTENT') throw Errors.notFound('Version de contenu');
    const r = this.validate((v.payload.entries ?? {}) as Record<string, string>);
    return { version: v.version, ...r };
  }

  publish(a: AdminActor, id: string, reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'content.publish', operation: 'content.publish', commandId, payload: { id, reason }, reason, target: { type: 'ConfigVersion', id },
      handle: async (scope) => {
        await this.repo.lockKind(scope, 'CONTENT');
        const v = await this.repo.get(scope, id);
        if (!v || v.kind !== 'CONTENT') throw Errors.notFound('Version de contenu');
        if (v.payload.status === 'ARCHIVED') throw Errors.precondition('VERSION_ARCHIVED');
        const { issues } = this.validate((v.payload.entries ?? {}) as Record<string, string>);
        if (issues.length) throw Errors.validation({ reason: 'CONTENT_INVALID', issues });
        const prev = await this.repo.active(scope, 'CONTENT');
        await this.repo.activate(scope, id, scope.now);
        return { result: { id, version: v.version, previous: prev?.version ?? null, minClientVersion: v.minClientVersion }, auditData: { version: v.version, previous: prev?.version ?? null } };
      },
    });
  }

  archive(a: AdminActor, id: string, reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'content.write', operation: 'content.archive', commandId, payload: { id, reason }, reason, target: { type: 'ConfigVersion', id },
      handle: async (scope) => {
        const v = await this.repo.get(scope, id);
        if (!v || v.kind !== 'CONTENT') throw Errors.notFound('Version de contenu');
        const active = await this.repo.active(scope, 'CONTENT');
        if (active?.id === id) throw Errors.precondition('CANNOT_ARCHIVE_ACTIVE');
        await this.repo.archive(scope, id);
        return { result: { id } };
      },
    });
  }
}

export class TuningUseCases {
  constructor(
    private readonly repo: ConfigRepository,
    private readonly runner: AdminCommandRunner,
    private readonly random: RandomSource,
    private readonly simulator: TuningSimulator,
  ) {}

  private async activeTuning(): Promise<{ id: string | null; version: string; payload: Record<string, unknown>; activatedAt: Date | null; source: 'CONFIG_VERSION' | 'PACKAGE_DEFAULT' }> {
    const v = await this.repo.active(null, 'TUNING');
    if (v) return { id: v.id, version: v.version, payload: v.payload, activatedAt: v.activatedAt, source: 'CONFIG_VERSION' };
    return { id: null, version: DEFAULT_TUNING.version, payload: DEFAULT_TUNING as unknown as Record<string, unknown>, activatedAt: null, source: 'PACKAGE_DEFAULT' };
  }

  async overview(a: AdminActor): Promise<TuningOverview & { activePayload: Record<string, unknown> }> {
    authorize(a, 'tuning.read');
    const active = await this.activeTuning();
    return {
      active: { id: active.id, version: active.version, source: active.source, activatedAt: active.activatedAt?.toISOString() ?? null },
      activePayload: active.payload,
      versions: await this.repo.list('TUNING'),
      // Le moteur (EngineGateway) lit encore DEFAULT_TUNING du package : une publication est
      // versionnée et auditée, son branchement runtime appartient à C/B (handoff F).
      runtimeConsumesPublished: false,
      simulator: { available: this.simulator.available, reason: this.simulator.reason },
    };
  }

  async diff(a: AdminActor, id: string): Promise<{ version: string; against: string; changes: TuningDiffEntry[] }> {
    authorize(a, 'tuning.read');
    const v = await this.repo.get(null, id);
    if (!v || v.kind !== 'TUNING') throw Errors.notFound('Version de tuning');
    const active = await this.activeTuning();
    return { version: v.version, against: active.version, changes: jsonDiff(active.payload, v.payload) };
  }

  createDraft(a: AdminActor, payload: Record<string, unknown>, note: string | undefined, commandId: string) {
    authorize(a, 'tuning.write');
    const parsed = safeParseTuning(payload);
    if (!parsed.success) throw Errors.validation({ reason: 'TUNING_INVALID', issues: parsed.error.issues.slice(0, 50).map((i) => ({ path: i.path.join('.'), message: i.message })) });
    const id = this.random.uuid();
    return this.runner.run(a, {
      permission: 'tuning.write', operation: 'tuning.create_draft', commandId, payload: { payload, note }, reason: note ?? null, target: { type: 'ConfigVersion', id },
      handle: async (scope) => {
        await this.repo.lockKind(scope, 'TUNING');
        if (await this.repo.versionExists(scope, 'TUNING', parsed.data.version)) throw Errors.conflict('VERSION_EXISTS');
        await this.repo.create(scope, { id, kind: 'TUNING', version: parsed.data.version, payload: parsed.data as unknown as Record<string, unknown>, authorId: a.userId, minClientVersion: null });
        return { result: { id, version: parsed.data.version } };
      },
    });
  }

  publish(a: AdminActor, id: string, reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'tuning.publish', operation: 'tuning.publish', commandId, payload: { id, reason }, reason, target: { type: 'ConfigVersion', id },
      handle: async (scope) => {
        await this.repo.lockKind(scope, 'TUNING');
        const v = await this.repo.get(scope, id);
        if (!v || v.kind !== 'TUNING') throw Errors.notFound('Version de tuning');
        if (!safeParseTuning(v.payload).success) throw Errors.validation({ reason: 'TUNING_INVALID' });
        const prev = await this.repo.active(scope, 'TUNING');
        if (prev?.id === id) throw Errors.conflict('ALREADY_ACTIVE');
        await this.repo.activate(scope, id, scope.now);
        return { result: { id, version: v.version, previous: prev?.version ?? DEFAULT_TUNING.version }, auditData: { version: v.version, previous: prev?.version ?? DEFAULT_TUNING.version } };
      },
    });
  }

  /** Rollback = NOUVELLE version (copie d'une version historique) publiée ; l'historique est conservé. */
  rollback(a: AdminActor, targetId: string, newVersion: string, reason: string, commandId: string) {
    const id = this.random.uuid();
    return this.runner.run(a, {
      permission: 'tuning.publish', operation: 'tuning.rollback', commandId, payload: { targetId, newVersion, reason }, reason, target: { type: 'ConfigVersion', id },
      handle: async (scope) => {
        await this.repo.lockKind(scope, 'TUNING');
        const target = await this.repo.get(scope, targetId);
        if (!target || target.kind !== 'TUNING') throw Errors.notFound('Version cible');
        if (await this.repo.versionExists(scope, 'TUNING', newVersion)) throw Errors.conflict('VERSION_EXISTS');
        const parsed = safeParseTuning({ ...target.payload, version: newVersion });
        if (!parsed.success) throw Errors.validation({ reason: 'TUNING_INVALID' });
        const prev = await this.repo.active(scope, 'TUNING');
        await this.repo.create(scope, { id, kind: 'TUNING', version: newVersion, payload: { ...(parsed.data as unknown as Record<string, unknown>), rolledBackFrom: target.version }, authorId: a.userId, minClientVersion: null });
        await this.repo.activate(scope, id, scope.now);
        return { result: { id, version: newVersion, copiedFrom: target.version, previous: prev?.version ?? DEFAULT_TUNING.version }, auditData: { copiedFrom: target.version, previous: prev?.version ?? null } };
      },
    });
  }

  async simulate(a: AdminActor, id: string) {
    authorize(a, 'tuning.read');
    if (!this.simulator.available) throw new AppError('NOT_CONFIGURED', 'Simulateur indisponible', { detailsSafe: { reason: 'SIMULATOR_UNAVAILABLE', detail: this.simulator.reason } });
    const v = await this.repo.get(null, id);
    if (!v || v.kind !== 'TUNING') throw Errors.notFound('Version de tuning');
    const active = await this.activeTuning();
    const opts = { days: 60, relationships: 200, seed: 'admin-sim-1' };
    const [candidate, baseline] = await Promise.all([this.simulator.run(v.payload, opts), this.simulator.run(active.payload, opts)]);
    return { opts, candidate, baseline };
  }
}

// ------------------------------------------------------------------ 18.9 / 18.11 / 18.12 / 18.13 lectures + redrive
export class ReadModelsUseCases {
  constructor(private readonly rm: ReadModelsPort, private readonly clock: Clock) {}
  matching(a: AdminActor) {
    authorize(a, 'matching.read');
    return this.rm.matching(this.clock.now());
  }
  social(a: AdminActor) {
    authorize(a, 'social.read');
    return this.rm.social(this.clock.now());
  }
  ai(a: AdminActor) {
    authorize(a, 'ai.read');
    return this.rm.ai(this.clock.now(), 24);
  }
}

export class OpsUseCases {
  constructor(
    private readonly rm: ReadModelsPort,
    private readonly outbox: OutboxAdminRepository,
    private readonly guard: RedriveGuard,
    private readonly runner: AdminCommandRunner,
    private readonly clock: Clock,
    private readonly info: () => { api: { version: string; env: string; engineVersion: string; tuningVersion: string; node: string; uptimeSeconds: number }; redis: { configured: boolean; ok: boolean | null }; featureFlags: { key: string; value: unknown; note: string }[] },
  ) {}

  async status(a: AdminActor) {
    authorize(a, 'ops.read');
    const base = await this.rm.ops(this.clock.now());
    return { ...base, ...this.info() };
  }

  async dead(a: AdminActor) {
    authorize(a, 'ops.read');
    const rows = await this.rm.deadOutbox(100);
    return Promise.all(rows.map(async (r) => ({ ...r, ...(await this.guardInfo(r.id)) })));
  }

  private async guardInfo(id: string) {
    const ev = await this.outbox.loadForRedrive(null, id);
    if (!ev) return { redrivable: false, blockedReason: 'NOT_FOUND' };
    const g = await this.guard.check(ev);
    return g.ok ? { redrivable: true, blockedReason: null } : { redrivable: false, blockedReason: g.reason };
  }

  /** Redrive contrôlé : l'état ACTUEL est revérifié (permission/consentement/relation) avant remise en file. */
  redrive(a: AdminActor, id: string, reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'ops.redrive', operation: 'ops.outbox_redrive', commandId, payload: { id, reason }, reason, target: { type: 'OutboxEvent', id },
      handle: async (scope) => {
        const ev = await this.outbox.loadForRedrive(scope, id);
        if (!ev) throw Errors.notFound('Événement');
        if (ev.publishedAt) throw Errors.conflict('ALREADY_PUBLISHED');
        const g = await this.guard.check(ev);
        if (!g.ok) throw Errors.precondition(g.reason);
        await this.outbox.requeue(scope, id, scope.now);
        return { result: { id, topic: ev.topic, previousAttempts: ev.attempts }, auditData: { topic: ev.topic, previousAttempts: ev.attempts } };
      },
    });
  }
}

// ------------------------------------------------------------------ 18.10 Économie (G)
export class EconomyAdminUseCases {
  constructor(private readonly port: AdminEconomyPort | null, private readonly runner: AdminCommandRunner, private readonly audit: AuditLog) {}
  private p(): AdminEconomyPort {
    if (!this.port) throw notConfigured('Économie');
    return this.port;
  }
  async ledger(a: AdminActor, userId: string, cursor: string | undefined, limit: number) {
    authorize(a, 'economy.read');
    const r = await this.p().readLedger(userId, cursor, limit);
    return { balance: r.balance, items: r.page.items.map((e) => ({ id: e.id, amount: e.amount, balanceAfter: e.balanceAfter, reason: e.reason, source: e.source, causeType: e.causeType, causeId: e.causeId, reversesEntryId: e.reversesEntryId ?? null, actorUserId: e.actorUserId ?? null, note: e.note ?? null, createdAt: e.createdAt.toISOString() })), nextCursor: r.page.nextCursor };
  }
  webhooks(a: AdminActor, q: { status?: 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'IGNORED'; appUserId?: string; cursor?: string; limit: number }) {
    authorize(a, 'economy.read');
    return this.p().listWebhooks({ ...(q.status ? { status: q.status } : {}), ...(q.appUserId ? { appUserId: q.appUserId } : {}) }, q.cursor, q.limit);
  }
  /** Crédit/débit correctif : écriture STAFF_CORRECTION motivée (jamais un faux remboursement store). */
  correct(a: AdminActor, targetUserId: string, amount: number, reason: string, commandId: string) {
    authorize(a, 'economy.correct');
    if (targetUserId === a.userId) throw Errors.forbidden('Correction sur son propre portefeuille interdite');
    return this.runner.delegate(a, {
      permission: 'economy.correct', operation: 'economy.correct_balance', reason, target: { type: 'User', id: targetUserId }, commandId,
      call: () => this.p().correctBalance({ staffUserId: a.userId, commandId, targetUserId, amount, reason }),
      auditData: (r) => ({ amount, ledgerEntryId: r.ledgerEntryId, balance: r.balance, replayed: r.replayed }),
    });
  }
  redriveWebhook(a: AdminActor, id: string, reason: string, commandId: string) {
    return this.runner.delegate(a, { permission: 'economy.redrive', operation: 'economy.webhook_redrive', reason, target: { type: 'ProviderWebhookEvent', id }, commandId, call: () => this.p().redriveWebhook(id).then((status) => ({ status })) });
  }
  reconcile(a: AdminActor, userId: string, commandId: string) {
    return this.runner.delegate(a, { permission: 'economy.redrive', operation: 'economy.reconcile', reason: null, target: { type: 'User', id: userId }, commandId, call: () => this.p().reconcileUser(userId) });
  }
}

// ------------------------------------------------------------------ Audit
export class AuditUseCases {
  constructor(private readonly audit: AuditLog) {}
  list(a: AdminActor, q: Parameters<AuditLog['list']>[0]) {
    authorize(a, 'audit.read');
    return this.audit.list(q);
  }
}
