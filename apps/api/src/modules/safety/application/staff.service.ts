/**
 * Implémentation du port staff `SAFETY_STAFF_PORT` (rôles et audit vérifiés par l'appelant, module
 * trust). Idempotence par commandId (CommandBus) ; aucune donnée d'autre participant.
 */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { decodeCursor, encodeCursor } from '../../../shared/application/pagination.js';
import type { OutingSafetyPort } from '../../../shared/application/ports/outing-safety.port.js';
import type { SafetyStaffPort, StaffSafetyAlertView } from '../../../shared/application/ports/safety-staff.port.js';
import { Errors } from '../../../shared/domain/errors.js';
import { HUMAN_RESPONSE_MINUTES } from '../domain/guardian.js';
import type { AlertRow, SafetyCaseSink, SafetyRepository } from './ports/safety.ports.js';

export class SafetyStaffService implements SafetyStaffPort {
  constructor(
    private readonly repo: SafetyRepository,
    private readonly cases: SafetyCaseSink,
    private readonly outings: OutingSafetyPort | null,
    private readonly bus: CommandBus,
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly random: RandomSource,
  ) {}

  private view(a: AlertRow): StaffSafetyAlertView {
    const due = new Date(a.createdAt.getTime() + HUMAN_RESPONSE_MINUTES * 60_000);
    return {
      id: a.id,
      userId: a.userId,
      subjectKind: a.subjectKind,
      subjectId: a.subjectId,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
      acknowledged: !!a.ackAt,
      caseId: a.moderationCaseId,
      slaDueAt: due.toISOString(),
      overdue: a.status === 'OPEN' && this.clock.now() > due,
      positionAttached: !!a.position,
      positionPurgeAfter: a.positionPurgeAfter?.toISOString() ?? null,
    };
  }

  async listAlerts(q: { status?: 'OPEN' | 'SAFE' | 'HANDLED'; cursor?: string; limit: number }) {
    const c = decodeCursor(q.cursor);
    const after = c && typeof c[0] === 'number' && typeof c[1] === 'string' ? { createdAt: new Date(c[0]), id: c[1] } : null;
    const rows = await this.repo.listAlerts({ ...(q.status ? { status: q.status } : {}), after, limit: q.limit + 1 });
    const items = rows.slice(0, q.limit);
    const last = items.at(-1);
    return { items: items.map((a) => this.view(a)), nextCursor: rows.length > q.limit && last ? encodeCursor([last.createdAt.getTime(), last.id]) : null };
  }

  async getAlert(id: string) {
    const a = await this.repo.loadAlert(null, id);
    return a ? { ...this.view(a), position: a.position } : null;
  }

  async handle(alertId: string, staffUserId: string, commandId: string) {
    await this.bus.execute({
      actorId: staffUserId,
      operation: 'staff.safety_alert_handle',
      commandId,
      payload: { alertId },
      handle: async (scope) => {
        const a = await this.repo.loadAlert(scope, alertId);
        if (!a) throw Errors.notFound('Alerte');
        if (a.status === 'OPEN') await this.repo.resolveAlert(scope, alertId, 'HANDLED', staffUserId);
        await this.cases.resolveFor(scope, 'SAFETY_ALERT', alertId);
        return { ok: true };
      },
    });
    return this.view((await this.repo.loadAlert(null, alertId))!);
  }

  async caseSummary(subjectType: string, subjectId: string) {
    if (subjectType !== 'SAFETY_ALERT') return null;
    const a = await this.repo.loadAlert(null, subjectId);
    if (!a) return null;
    // Résumé sans position (visible des modérateurs) ; la position passe par `getAlert` (trust_lead).
    return `Alerte « besoin d'aide » · ${a.subjectKind === 'OUTING' ? 'sortie de groupe' : 'rendez-vous à deux'} · statut ${a.status} · position jointe : ${a.position ? 'oui' : 'non'}`;
  }

  async onCaseDecided(subjectType: string, subjectId: string, staffUserId: string) {
    if (subjectType !== 'SAFETY_ALERT') return;
    const a = await this.repo.loadAlert(null, subjectId);
    if (!a || a.status !== 'OPEN') return;
    // Idempotent par l'état (OPEN → HANDLED une seule fois).
    await this.uow.run((scope) => this.repo.resolveAlert(scope, subjectId, 'HANDLED', staffUserId));
  }

  async resolveKnowsSomeone(seatId: string, accept: boolean, staffUserId: string, commandId: string) {
    if (!this.outings) throw Errors.notFound('Demande');
    const outings = this.outings;
    const pending = await outings.knowsSomeoneUnderReview(null, seatId);
    const { result } = await this.bus.execute({
      actorId: staffUserId,
      operation: 'staff.knows_someone_resolve',
      commandId,
      payload: { seatId, accept },
      handle: async (scope) => {
        if (!pending) throw Errors.notFound('Demande');
        // Ordre global : users → outings (le port ne prend que `outings`).
        await scope.lock.users([pending.userId, pending.targetUserId]);
        const r = await outings.resolveKnowsSomeone(scope, { seatId, accept });
        if (!r) throw Errors.precondition('KNOWS_SOMEONE_NOT_IN_REVIEW');
        if (r.status === 'MOVED') await this.repo.recordRemoval(scope, { id: this.random.uuid(), outingId: pending.outingId, seatId, removedUserId: pending.userId, triggeredByUserId: pending.userId, cause: 'KNOWS_SOMEONE' });
        await this.cases.resolveFor(scope, 'OUTING', seatId);
        return r;
      },
    });
    return result;
  }
}
