import type { Plan, Store, SubscriptionStatus } from '@blowy/domain';
import type { Database, Db } from '../../../persistence/database.types';
import { check, iso, isoOrNull } from '../../../persistence/supabase';
import type { StoreNotificationRecord, StoreNotificationsRepository, SubscriptionRecord, SubscriptionsRepository } from '../ports';

type Row = Database['public']['Tables']['subscriptions']['Row'];

const fromRow = (r: Row): SubscriptionRecord => ({
  store: r.store as Store,
  originalTransactionId: r.original_transaction_id,
  userId: r.user_id,
  latestTransactionId: r.latest_transaction_id,
  productId: r.product_id,
  plan: r.plan as Plan,
  status: r.status as SubscriptionStatus,
  expiresAt: isoOrNull(r.expires_at),
  graceUntil: isoOrNull(r.grace_until),
  trialEndsAt: isoOrNull(r.trial_ends_at),
  trialUsed: r.trial_used,
  autoRenew: r.auto_renew,
  revokedAt: isoOrNull(r.revoked_at),
  startedAt: iso(r.started_at),
  updatedAt: iso(r.updated_at),
  environment: r.environment,
  trialReminderFor: isoOrNull(r.trial_reminder_for),
});

const toRow = (s: SubscriptionRecord): Database['public']['Tables']['subscriptions']['Insert'] => ({
  store: s.store,
  original_transaction_id: s.originalTransactionId,
  user_id: s.userId,
  latest_transaction_id: s.latestTransactionId,
  product_id: s.productId,
  plan: s.plan,
  status: s.status,
  expires_at: s.expiresAt,
  grace_until: s.graceUntil,
  trial_ends_at: s.trialEndsAt,
  trial_used: s.trialUsed,
  auto_renew: s.autoRenew,
  revoked_at: s.revokedAt,
  started_at: s.startedAt,
  updated_at: s.updatedAt,
  environment: s.environment,
  trial_reminder_for: s.trialReminderFor,
});

export class SupabaseSubscriptionsRepository implements SubscriptionsRepository {
  constructor(private readonly client: Db) {}

  private get table() {
    return this.client.from('subscriptions');
  }

  async find(store: Store, id: string): Promise<SubscriptionRecord | null> {
    const { data, error } = await this.table.select('*').eq('store', store).eq('original_transaction_id', id).maybeSingle();
    check(error, 'lecture de l’abonnement');
    return data ? fromRow(data) : null;
  }

  async latestForUser(userId: string): Promise<SubscriptionRecord | null> {
    const { data, error } = await this.table
      .select('*')
      .eq('user_id', userId)
      .order('expires_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(1);
    check(error, 'lecture de l’abonnement');
    return data && data[0] ? fromRow(data[0]) : null;
  }

  async save(record: SubscriptionRecord): Promise<void> {
    const { error } = await this.table.upsert(toRow(record), { onConflict: 'store,original_transaction_id' });
    check(error, 'enregistrement de l’abonnement');
  }

  async setPlusUntil(userId: string, plusUntil: string | null): Promise<void> {
    const { error } = await this.client.from('profiles').update({ plus_until: plusUntil }).eq('id', userId);
    check(error, 'mise à jour de Blowy+');
  }

  async trialsEndingBefore(endsBefore: string, limit: number): Promise<SubscriptionRecord[]> {
    // Index partiel `subscriptions_trial_idx` (status = 'trial' and auto_renew).
    const { data, error } = await this.table
      .select('*')
      .eq('status', 'trial')
      .eq('auto_renew', true)
      .lte('trial_ends_at', endsBefore)
      .order('trial_ends_at', { ascending: true })
      .limit(limit * 2);
    check(error, 'lecture des essais');
    return (data ?? [])
      .map(fromRow)
      .filter((s) => s.trialReminderFor !== s.trialEndsAt)
      .slice(0, limit);
  }

  async markTrialReminded(store: Store, id: string, trialEndsAt: string): Promise<void> {
    const { error } = await this.table.update({ trial_reminder_for: trialEndsAt }).eq('store', store).eq('original_transaction_id', id);
    check(error, 'rappel d’essai');
  }

  async trialUsedBy(userId: string): Promise<boolean> {
    const { count, error } = await this.table.select('original_transaction_id', { count: 'exact', head: true }).eq('user_id', userId).eq('trial_used', true);
    check(error, 'lecture des essais');
    return (count ?? 0) > 0;
  }
}

export class SupabaseStoreNotificationsRepository implements StoreNotificationsRepository {
  constructor(private readonly client: Db) {}

  private get table() {
    return this.client.from('store_notifications');
  }

  async begin(r: StoreNotificationRecord): Promise<boolean> {
    const { error } = await this.table.upsert(
      {
        store: r.store,
        notification_id: r.notificationId,
        type: r.type,
        subtype: r.subtype,
        original_transaction_id: r.originalTransactionId,
        environment: r.environment,
        signed_at: r.signedAt,
        received_at: r.receivedAt,
      },
      { onConflict: 'store,notification_id', ignoreDuplicates: true },
    );
    check(error, 'notification du magasin');
    const { data, error: readError } = await this.table.select('processed_at').eq('store', r.store).eq('notification_id', r.notificationId).maybeSingle();
    check(readError, 'notification du magasin');
    return !data?.processed_at;
  }

  async finish(store: Store, id: string, outcome: string, at: string): Promise<void> {
    const { error } = await this.table.update({ outcome, processed_at: at }).eq('store', store).eq('notification_id', id);
    check(error, 'notification du magasin');
  }

  async purge(before: string): Promise<number> {
    const { count, error } = await this.table.delete({ count: 'exact' }).lt('received_at', before);
    check(error, 'purge des notifications');
    return count ?? 0;
  }
}
