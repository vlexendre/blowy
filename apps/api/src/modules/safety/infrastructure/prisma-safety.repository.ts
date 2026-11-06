/** Adaptateur Prisma du port `SafetyRepository` (tables du module `safety` uniquement). */
import type { Db } from '@blowy/database';
import type { GuardianSubjectKind } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { AlertRow, GuardianLinkRow, SafetyRepository } from '../application/ports/safety.ports.js';

type C = Db | ReturnType<typeof txOf>;
type AlertDb = {
  id: string;
  userId: string;
  subjectKind: GuardianSubjectKind;
  subjectId: string;
  status: 'OPEN' | 'SAFE' | 'HANDLED';
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  positionPurgeAfter: Date | null;
  positionPurgedAt: Date | null;
  moderationCaseId: string | null;
  createdAt: Date;
  ackAt: Date | null;
  resolvedAt: Date | null;
  handledById: string | null;
};

const alertRow = (a: AlertDb): AlertRow => ({
  id: a.id,
  userId: a.userId,
  subjectKind: a.subjectKind,
  subjectId: a.subjectId,
  status: a.status,
  createdAt: a.createdAt,
  resolvedAt: a.resolvedAt,
  position: a.lat !== null && a.lng !== null && a.accuracyM !== null ? { lat: a.lat, lng: a.lng, accuracyM: a.accuracyM } : null,
  moderationCaseId: a.moderationCaseId,
  ackAt: a.ackAt,
  positionPurgeAfter: a.positionPurgeAfter,
  positionPurgedAt: a.positionPurgedAt,
  handledById: a.handledById,
});

const LINK_SELECT = { id: true, ownerUserId: true, subjectKind: true, subjectId: true, label: true, activeFrom: true, expiresAt: true, revokedAt: true, lastViewedAt: true, viewCount: true, createdAt: true } as const;

export class PrismaSafetyRepository implements SafetyRepository {
  constructor(private readonly db: Db) {}
  private c(scope: TxScope | null): C {
    return scope ? txOf(scope) : this.db;
  }

  // ------------------------------------------------------------------ liens
  async createLink(scope: TxScope, l: Parameters<SafetyRepository['createLink']>[1]) {
    await txOf(scope).guardianLink.create({ data: { ...l, createdAt: scope.now } });
  }
  async countActiveLinks(scope: TxScope | null, ownerUserId: string, subjectKind: GuardianSubjectKind, subjectId: string, at: Date) {
    return this.c(scope).guardianLink.count({ where: { ownerUserId, subjectKind, subjectId, revokedAt: null, expiresAt: { gt: at } } });
  }
  async listLinks(ownerUserId: string, subjectKind: GuardianSubjectKind, subjectId: string): Promise<GuardianLinkRow[]> {
    return this.db.guardianLink.findMany({ where: { ownerUserId, subjectKind, subjectId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: LINK_SELECT });
  }
  async loadLink(scope: TxScope | null, id: string) {
    return this.c(scope).guardianLink.findUnique({ where: { id }, select: LINK_SELECT });
  }
  async linkByTokenHash(tokenHash: string) {
    return this.db.guardianLink.findUnique({ where: { tokenHash }, select: LINK_SELECT });
  }
  async touchLink(id: string, at: Date) {
    await this.db.guardianLink.update({ where: { id }, data: { lastViewedAt: at, viewCount: { increment: 1 } } });
  }
  async revokeLink(scope: TxScope, id: string, reason: string) {
    const r = await txOf(scope).guardianLink.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: scope.now, revokeReason: reason } });
    if (r.count) await txOf(scope).guardianPushSubscription.deleteMany({ where: { guardianLinkId: id } });
    return r.count > 0;
  }
  async revokeLinksWhere(scope: TxScope, w: { ownerUserId?: string; subjectKind?: GuardianSubjectKind; subjectId?: string }, reason: string) {
    const tx = txOf(scope);
    const where = { ...w, revokedAt: null };
    const ids = (await tx.guardianLink.findMany({ where, select: { id: true } })).map((l) => l.id);
    if (!ids.length) return 0;
    await tx.guardianLink.updateMany({ where: { id: { in: ids } }, data: { revokedAt: scope.now, revokeReason: reason } });
    // Un lien révoqué ne garde aucun abonnement push.
    await tx.guardianPushSubscription.deleteMany({ where: { guardianLinkId: { in: ids } } });
    return ids.length;
  }

  // ------------------------------------------------------------------ push du proche
  async upsertPush(linkId: string, endpoint: string, purgeAfter: Date, at: Date) {
    await this.db.guardianPushSubscription.upsert({ where: { guardianLinkId: linkId }, create: { guardianLinkId: linkId, endpoint, purgeAfter, createdAt: at }, update: { endpoint, purgeAfter } });
  }
  async pushEndpointsFor(ownerUserId: string, subjectKind: GuardianSubjectKind, subjectId: string, at: Date) {
    const rows = await this.db.guardianPushSubscription.findMany({ where: { link: { ownerUserId, subjectKind, subjectId, revokedAt: null, expiresAt: { gt: at } } }, select: { guardianLinkId: true, endpoint: true } });
    return rows.map((r) => ({ linkId: r.guardianLinkId, endpoint: r.endpoint }));
  }
  async deletePush(linkId: string) {
    await this.db.guardianPushSubscription.deleteMany({ where: { guardianLinkId: linkId } });
  }

  // ------------------------------------------------------------------ « tout va bien » et alertes
  async addOk(scope: TxScope, o: { id: string; userId: string; subjectKind: GuardianSubjectKind; subjectId: string }) {
    await txOf(scope).safetyOkSignal.create({ data: { ...o, createdAt: scope.now } });
  }
  async oks(userId: string, subjectKind: GuardianSubjectKind, subjectId: string) {
    return (await this.db.safetyOkSignal.findMany({ where: { userId, subjectKind, subjectId }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } })).map((r) => r.createdAt);
  }
  async alertsCountSince(scope: TxScope, userId: string, since: Date) {
    return txOf(scope).safetyAlert.count({ where: { userId, createdAt: { gt: since } } });
  }
  async createAlert(scope: TxScope, a: Parameters<SafetyRepository['createAlert']>[1]) {
    await txOf(scope).safetyAlert.create({
      data: { id: a.id, userId: a.userId, subjectKind: a.subjectKind, subjectId: a.subjectId, status: 'OPEN', lat: a.position?.lat ?? null, lng: a.position?.lng ?? null, accuracyM: a.position?.accuracyM ?? null, positionPurgeAfter: a.positionPurgeAfter, createdAt: scope.now },
    });
  }
  async setAlertCase(scope: TxScope, alertId: string, caseId: string) {
    await txOf(scope).safetyAlert.update({ where: { id: alertId }, data: { moderationCaseId: caseId } });
  }
  async loadAlert(scope: TxScope | null, id: string) {
    const a = await this.c(scope).safetyAlert.findUnique({ where: { id } });
    return a ? alertRow(a) : null;
  }
  async alertsOf(userId: string, subjectKind: GuardianSubjectKind, subjectId: string) {
    return (await this.db.safetyAlert.findMany({ where: { userId, subjectKind, subjectId }, orderBy: { createdAt: 'asc' } })).map(alertRow);
  }
  async listAlerts(q: { status?: 'OPEN' | 'SAFE' | 'HANDLED'; after?: { createdAt: Date; id: string } | null; limit: number }) {
    const page = q.after ? { OR: [{ createdAt: { lt: q.after.createdAt } }, { createdAt: q.after.createdAt, id: { lt: q.after.id } }] } : {};
    return (await this.db.safetyAlert.findMany({ where: { ...(q.status ? { status: q.status } : {}), ...page }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: q.limit })).map(alertRow);
  }
  async resolveAlert(scope: TxScope, id: string, status: 'SAFE' | 'HANDLED', by: string | null) {
    const r = await txOf(scope).safetyAlert.updateMany({ where: { id, status: 'OPEN' }, data: { status, resolvedAt: scope.now, handledById: by } });
    return r.count > 0;
  }
  async ackAlert(scope: TxScope, id: string) {
    await txOf(scope).safetyAlert.updateMany({ where: { id, ackAt: null }, data: { ackAt: scope.now } });
  }

  // ------------------------------------------------------------------ retraits système
  async recordRemoval(scope: TxScope, r: Parameters<SafetyRepository['recordRemoval']>[1]) {
    await txOf(scope).safetySystemRemoval.upsert({ where: { seatId: r.seatId }, create: { ...r, createdAt: scope.now }, update: {} });
  }
  async removalsSince(scope: TxScope, triggeredByUserId: string, since: Date) {
    return txOf(scope).safetySystemRemoval.count({ where: { triggeredByUserId, cause: 'BLOCK', createdAt: { gt: since } } });
  }

  // ------------------------------------------------------------------ « je pars, mal à l'aise »
  async upsertUneasyLeave(scope: TxScope, l: Parameters<SafetyRepository['upsertUneasyLeave']>[1]) {
    const tx = txOf(scope);
    const existing = await tx.safetyUneasyLeave.findUnique({ where: { seatId: l.seatId }, select: { id: true, notifyGuardian: true } });
    if (existing) {
      if (l.notifyGuardian && !existing.notifyGuardian) await tx.safetyUneasyLeave.update({ where: { id: existing.id }, data: { notifyGuardian: true } });
      return false;
    }
    await tx.safetyUneasyLeave.create({ data: { ...l, createdAt: scope.now } });
    return true;
  }
  async uneasyLeaveCount(scope: TxScope, userId: string, since?: Date) {
    return txOf(scope).safetyUneasyLeave.count({ where: { userId, ...(since ? { createdAt: { gte: since } } : {}) } });
  }

  // ------------------------------------------------------------------ rétention (§8.5)
  /** Position d'alerte : effacée à `positionPurgeAfter`, sauf dossier encore ouvert (purgée à sa clôture). */
  async purgeAlertPositions(now: Date) {
    const due = await this.db.safetyAlert.findMany({ where: { positionPurgedAt: null, lat: { not: null }, positionPurgeAfter: { lte: now } }, select: { id: true, moderationCaseId: true }, take: 500 });
    const open = new Set(
      (await this.db.moderationCase.findMany({ where: { id: { in: due.map((d) => d.moderationCaseId).filter((x): x is string => !!x) }, status: { in: ['OPEN', 'ASSIGNED', 'ESCALATED'] } }, select: { id: true } })).map((c) => c.id),
    );
    const ids = due.filter((d) => !d.moderationCaseId || !open.has(d.moderationCaseId)).map((d) => d.id);
    if (!ids.length) return 0;
    const r = await this.db.safetyAlert.updateMany({ where: { id: { in: ids } }, data: { lat: null, lng: null, accuracyM: null, positionPurgedAt: now } });
    return r.count;
  }
  async purgePushSubscriptions(now: Date) {
    return (await this.db.guardianPushSubscription.deleteMany({ where: { purgeAfter: { lte: now } } })).count;
  }
  /** Métadonnées d'un lien : 30 j après expiration (jeton déjà seulement haché). */
  async purgeExpiredLinks(before: Date) {
    // Les « tout va bien » ne servent qu'à la page du proche (lien ≤ 18 h) : purgés au même horizon.
    await this.db.safetyOkSignal.deleteMany({ where: { createdAt: { lt: before } } });
    return (await this.db.guardianLink.deleteMany({ where: { expiresAt: { lt: before } } })).count;
  }
}
