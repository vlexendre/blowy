import type { Store } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type { StoreNotificationRecord, StoreNotificationsRepository, SubscriptionRecord, SubscriptionsRepository } from '../ports';

const key = (store: Store, id: string): string => `${store}:${id}`;
const t = (iso: string | null): number => (iso === null ? Number.NEGATIVE_INFINITY : Date.parse(iso));

export class MemorySubscriptionsRepository implements SubscriptionsRepository {
  constructor(private readonly db: MemoryDb) {}

  async find(store: Store, id: string): Promise<SubscriptionRecord | null> {
    const s = this.db.subscriptions.get(key(store, id));
    return s ? { ...s } : null;
  }

  async latestForUser(userId: string): Promise<SubscriptionRecord | null> {
    const mine = [...this.db.subscriptions.values()].filter((s) => s.userId === userId);
    mine.sort((a, b) => t(b.expiresAt) - t(a.expiresAt) || t(b.updatedAt) - t(a.updatedAt));
    return mine[0] ? { ...mine[0] } : null;
  }

  async save(record: SubscriptionRecord): Promise<void> {
    this.db.subscriptions.set(key(record.store, record.originalTransactionId), { ...record });
  }

  async setPlusUntil(userId: string, plusUntil: string | null): Promise<void> {
    const p = this.db.profiles.get(userId);
    if (p) this.db.profiles.set(userId, { ...p, plusUntil });
  }

  async trialsEndingBefore(endsBefore: string, limit: number): Promise<SubscriptionRecord[]> {
    return [...this.db.subscriptions.values()]
      .filter((s) => s.status === 'trial' && s.autoRenew && s.trialEndsAt !== null && t(s.trialEndsAt) <= t(endsBefore) && s.trialReminderFor !== s.trialEndsAt)
      .sort((a, b) => t(a.trialEndsAt) - t(b.trialEndsAt))
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }

  async markTrialReminded(store: Store, id: string, trialEndsAt: string): Promise<void> {
    const s = this.db.subscriptions.get(key(store, id));
    if (s) s.trialReminderFor = trialEndsAt;
  }

  async trialUsedBy(userId: string): Promise<boolean> {
    return [...this.db.subscriptions.values()].some((s) => s.userId === userId && s.trialUsed);
  }

  async endedBetween(from: string, to: string, limit: number): Promise<SubscriptionRecord[]> {
    return [...this.db.subscriptions.values()]
      .filter((s) => s.userId !== null && s.status !== 'refunded' && s.status !== 'revoked' && s.expiresAt !== null && t(s.expiresAt) >= t(from) && t(s.expiresAt) <= t(to))
      .sort((a, b) => t(a.expiresAt) - t(b.expiresAt))
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }
}

export class MemoryStoreNotificationsRepository implements StoreNotificationsRepository {
  constructor(private readonly db: MemoryDb) {}

  async begin(record: StoreNotificationRecord): Promise<boolean> {
    const k = key(record.store, record.notificationId);
    const existing = this.db.storeNotifications.get(k);
    if (existing?.processedAt) return false;
    if (!existing) this.db.storeNotifications.set(k, { ...record });
    return true;
  }

  async finish(store: Store, id: string, outcome: string, at: string): Promise<void> {
    const n = this.db.storeNotifications.get(key(store, id));
    if (n) Object.assign(n, { outcome, processedAt: at });
  }

  async purge(before: string): Promise<number> {
    let n = 0;
    for (const [k, v] of this.db.storeNotifications) {
      if (t(v.receivedAt) < t(before)) {
        this.db.storeNotifications.delete(k);
        n += 1;
      }
    }
    return n;
  }
}
