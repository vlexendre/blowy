/**
 * Persistance Prisma des notifications. `Notification.data` (jsonb) ne contient QUE des références
 * et l'état de livraison : `{deliverAt, expiresAt, refs, attempts, claimedUntil?, reason?}` — jamais de
 * texte rendu. Ajouts minimaux hors module (listés au handoff) : `DeviceSession.pushToken/platform`
 * et `PrivacySettings.discreetMode` (écrits ici faute de commande dédiée chez leur propriétaire).
 */
import type { Db } from '@blowy/database';
import { NOTIFICATION_CATEGORIES_V5, type NotificationCategoryV5 } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { categoryOf, isPushKey } from '../domain/catalog.js';
import type { SuppressReason } from '../domain/policy.js';
import type { DeviceToken, NewNotification, NotificationRefs, NotificationRepository, StoredNotification } from '../application/ports.js';

interface DataJson {
  deliverAt: string;
  expiresAt: string | null;
  refs: NotificationRefs;
  attempts: number;
  claimedUntil?: string;
  reason?: SuppressReason;
}

interface Row {
  id: string;
  userId: string;
  templateKey: string;
  dedupKey: string;
  groupKey: string | null;
  data: unknown;
  createdAt: Date;
}

const toStored = (r: Row): StoredNotification | null => {
  if (!isPushKey(r.templateKey)) return null;
  const d = r.data as DataJson;
  return { id: r.id, userId: r.userId, key: r.templateKey, dedupKey: r.dedupKey, groupKey: r.groupKey, deliverAt: new Date(d.deliverAt), expiresAt: d.expiresAt ? new Date(d.expiresAt) : null, refs: d.refs ?? {}, attempts: d.attempts ?? 0, createdAt: r.createdAt };
};

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly db: Db) {}

  async insert(scope: TxScope, rows: NewNotification[]): Promise<number> {
    if (rows.length === 0) return 0;
    const r = await txOf(scope).notification.createMany({
      data: rows.map((n) => ({
        id: n.id,
        userId: n.userId,
        category: categoryOf(n.key),
        dedupKey: n.dedupKey,
        groupKey: n.groupKey ?? null,
        templateKey: n.key,
        status: n.suppressed ? 'SUPPRESSED' : 'QUEUED',
        localDay: n.localDay,
        createdAt: scope.now,
        data: { deliverAt: n.deliverAt.toISOString(), expiresAt: n.expiresAt?.toISOString() ?? null, refs: n.refs, attempts: 0, ...(n.suppressed ? { reason: n.suppressed } : {}) } satisfies DataJson as object,
      })),
      skipDuplicates: true,
    });
    return r.count;
  }

  async countByDedupPrefix(scope: TxScope, userId: string, prefix: string): Promise<number> {
    return txOf(scope).notification.count({ where: { userId, dedupKey: { startsWith: prefix } } });
  }

  async pendingInGroup(scope: TxScope, userId: string, groupKey: string) {
    const r = await txOf(scope).notification.findFirst({ where: { userId, groupKey, status: 'QUEUED' }, orderBy: { createdAt: 'desc' } });
    return r ? { id: r.id, refs: (r.data as unknown as DataJson).refs ?? {} } : null;
  }

  async lastSentInGroup(scope: TxScope, userId: string, groupKey: string): Promise<Date | null> {
    const r = await txOf(scope).notification.findFirst({ where: { userId, groupKey, status: 'SENT' }, orderBy: { sentAt: 'desc' }, select: { sentAt: true } });
    return r?.sentAt ?? null;
  }

  async updateRefs(scope: TxScope, id: string, refs: NotificationRefs): Promise<void> {
    await txOf(scope).$executeRaw`UPDATE "Notification" SET data = jsonb_set(data::jsonb, '{refs}', ${JSON.stringify(refs)}::jsonb) WHERE id = ${id}::uuid`;
  }

  async anyActive(userId: string, dedupKeys: string[]): Promise<boolean> {
    return (await this.db.notification.count({ where: { userId, dedupKey: { in: dedupKeys }, status: { in: ['QUEUED', 'SENT'] } } })) > 0;
  }

  async claimDue(now: Date, limit: number, leaseMs: number): Promise<StoredNotification[]> {
    const lease = new Date(now.getTime() + leaseMs).toISOString();
    const rows = await this.db.$queryRaw<Row[]>`
      UPDATE "Notification" n SET data = jsonb_set(n.data::jsonb, '{claimedUntil}', to_jsonb(${lease}::text))
      WHERE n.id IN (
        SELECT id FROM "Notification"
        WHERE status = 'QUEUED'
          AND (data->>'deliverAt')::timestamptz <= ${now}
          AND coalesce((data->>'claimedUntil')::timestamptz, '-infinity'::timestamptz) < ${now}
        ORDER BY (data->>'deliverAt')::timestamptz, id
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED)
      RETURNING n.id, n."userId", n."templateKey", n."dedupKey", n."groupKey", n.data, n."createdAt"`;
    return rows.map(toStored).filter((x): x is StoredNotification => x !== null);
  }

  async markSent(id: string, at: Date, localDay: string): Promise<void> {
    await this.db.$executeRaw`UPDATE "Notification" SET status = 'SENT', "sentAt" = ${at}, "localDay" = ${localDay}, data = (data::jsonb - 'claimedUntil') WHERE id = ${id}::uuid`;
  }

  async markSuppressed(id: string, reason: SuppressReason, _at: Date): Promise<void> {
    await this.db.$executeRaw`UPDATE "Notification" SET status = 'SUPPRESSED', data = jsonb_set(data::jsonb - 'claimedUntil', '{reason}', to_jsonb(${reason}::text)) WHERE id = ${id}::uuid`;
  }

  async defer(id: string, until: Date, localDay: string, attempts?: number): Promise<void> {
    const set = attempts === undefined ? null : attempts;
    await this.db.$executeRaw`
      UPDATE "Notification" SET "localDay" = ${localDay},
        data = jsonb_set(jsonb_set(data::jsonb - 'claimedUntil', '{deliverAt}', to_jsonb(${until.toISOString()}::text)), '{attempts}', to_jsonb(coalesce(${set}::int, (data->>'attempts')::int, 0)))
      WHERE id = ${id}::uuid`;
  }

  async markFailed(id: string, _at: Date): Promise<void> {
    await this.db.$executeRaw`UPDATE "Notification" SET status = 'FAILED', data = (data::jsonb - 'claimedUntil') WHERE id = ${id}::uuid`;
  }

  async sentToday(userId: string, localDay: string): Promise<number> {
    return this.db.notification.count({ where: { userId, localDay, status: 'SENT', category: { not: 'SAFETY' } } });
  }

  async suppressQueuedOf(scope: TxScope, userId: string, reason: SuppressReason): Promise<number> {
    return txOf(scope).$executeRaw`UPDATE "Notification" SET status = 'SUPPRESSED', data = jsonb_set(data::jsonb, '{reason}', to_jsonb(${reason}::text)) WHERE "userId" = ${userId}::uuid AND status = 'QUEUED'`;
  }

  async preferences(userId: string): Promise<Map<NotificationCategoryV5, boolean>> {
    const rows = await this.db.notificationPreference.findMany({ where: { userId } });
    const v5 = new Set<string>(NOTIFICATION_CATEGORIES_V5);
    return new Map(rows.filter((r) => v5.has(r.category)).map((r) => [r.category as NotificationCategoryV5, r.enabled]));
  }

  async setPreferences(scope: TxScope, userId: string, toggles: Partial<Record<NotificationCategoryV5, boolean>>): Promise<void> {
    const tx = txOf(scope);
    for (const [category, enabled] of Object.entries(toggles) as [NotificationCategoryV5, boolean][]) {
      await tx.notificationPreference.upsert({ where: { userId_category: { userId, category } }, create: { userId, category, enabled }, update: { enabled } });
    }
  }

  async activeTokens(userId: string, now: Date): Promise<DeviceToken[]> {
    const rows = await this.db.deviceSession.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: now }, pushToken: { not: null } }, select: { id: true, pushToken: true }, orderBy: { lastUsedAt: 'desc' }, take: 10 });
    const seen = new Set<string>();
    return rows.filter((r) => r.pushToken && !seen.has(r.pushToken) && seen.add(r.pushToken)).map((r) => ({ sessionId: r.id, token: r.pushToken! }));
  }

  async sessionHasToken(sessionId: string): Promise<boolean> {
    return (await this.db.deviceSession.count({ where: { id: sessionId, pushToken: { not: null } } })) > 0;
  }

  async setToken(scope: TxScope, i: { sessionId: string; userId: string; token: string; platform: string }): Promise<void> {
    const tx = txOf(scope);
    // Un appareil passé à un autre compte ne doit plus recevoir les notifications du précédent.
    await tx.deviceSession.updateMany({ where: { pushToken: i.token, NOT: { id: i.sessionId } }, data: { pushToken: null } });
    await tx.deviceSession.updateMany({ where: { id: i.sessionId, userId: i.userId }, data: { pushToken: i.token, platform: i.platform } });
  }

  async clearSessionToken(scope: TxScope, sessionId: string, userId: string): Promise<void> {
    await txOf(scope).deviceSession.updateMany({ where: { id: sessionId, userId }, data: { pushToken: null } });
  }

  async forgetToken(token: string): Promise<void> {
    await this.db.deviceSession.updateMany({ where: { pushToken: token }, data: { pushToken: null } });
  }

  async clearAllTokens(scope: TxScope, userId: string): Promise<void> {
    await txOf(scope).deviceSession.updateMany({ where: { userId }, data: { pushToken: null } });
  }

  async discreetMode(userId: string): Promise<boolean> {
    return (await this.db.privacySettings.findUnique({ where: { userId }, select: { discreetMode: true } }))?.discreetMode ?? false;
  }

  async setDiscreetMode(scope: TxScope, userId: string, on: boolean): Promise<void> {
    // V5.4 (A.5) : un réglage explicite compte comme le choix « Discret » / « Normal ».
    await txOf(scope).privacySettings.upsert({ where: { userId }, create: { userId, discreetMode: on, discreetModeChosenAt: scope.now }, update: { discreetMode: on, discreetModeChosenAt: scope.now } });
  }
}
