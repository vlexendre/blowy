import { type Day, NOTIFICATION_KINDS, type NotificationKindKey } from '@blowy/domain';
import type { Database, Db, Json } from '../../persistence/database.types';
import { check, iso, isoOrNull } from '../../persistence/supabase';
import type {
  DevicesRepository,
  LiveActivityKindKey,
  LiveActivityTokenRecord,
  LiveActivityTokensRepository,
  LiveActivityUse,
  NotificationLogRecord,
  NotificationLogRepository,
  NotificationSettingsRecord,
  NotificationSettingsRepository,
  NotificationStatus,
  PushDeviceRecord,
  PushReceiptsRepository,
} from './ports';

export class SupabaseDevicesRepository implements DevicesRepository {
  constructor(private readonly client: Db) {}

  async upsert(d: PushDeviceRecord): Promise<void> {
    const { error } = await this.client
      .from('push_devices')
      .upsert({ token: d.token, user_id: d.userId, platform: d.platform, kind: d.kind, last_seen_at: d.lastSeenAt, disabled_at: null });
    check(error, "enregistrement de l'appareil");
  }

  async forUser(userId: string): Promise<PushDeviceRecord[]> {
    const { data, error } = await this.client.from('push_devices').select('*').eq('user_id', userId).is('disabled_at', null).limit(20);
    check(error, 'appareils');
    return (data ?? []).map((r) => ({
      token: r.token,
      userId: r.user_id,
      platform: r.platform as PushDeviceRecord['platform'],
      kind: r.kind as PushDeviceRecord['kind'],
      createdAt: iso(r.created_at),
      lastSeenAt: iso(r.last_seen_at),
      disabledAt: isoOrNull(r.disabled_at),
    }));
  }

  async remove(token: string, userId: string): Promise<void> {
    const { error } = await this.client.from('push_devices').delete().eq('token', token).eq('user_id', userId);
    check(error, "retrait de l'appareil");
  }

  async disable(tokens: readonly string[], at: string): Promise<void> {
    if (tokens.length === 0) return;
    const { error } = await this.client.from('push_devices').update({ disabled_at: at }).in('token', [...tokens]);
    check(error, 'désactivation des appareils');
  }
}

type SettingsRow = { user_id: string; time_zone: string; morning_hour: number; disabled_kinds: string[]; next_morning_at: string | null; updated_at: string; marketing_opt_in_at?: string | null };
const settingsFrom = (r: SettingsRow): NotificationSettingsRecord => ({
  userId: r.user_id,
  timeZone: r.time_zone,
  morningHour: r.morning_hour,
  // Un type retiré (ex. `daily_photo`, migré en `your_turn` par 20261115190000) est ignoré.
  disabledKinds: r.disabled_kinds.filter((k): k is NotificationKindKey => (NOTIFICATION_KINDS as readonly string[]).includes(k)),
  nextMorningAt: isoOrNull(r.next_morning_at),
  marketingOptInAt: isoOrNull(r.marketing_opt_in_at ?? null),
  updatedAt: iso(r.updated_at),
});

export class SupabaseNotificationSettingsRepository implements NotificationSettingsRepository {
  constructor(private readonly client: Db) {}

  async get(userId: string): Promise<NotificationSettingsRecord | null> {
    const { data, error } = await this.client.from('notification_settings').select('*').eq('user_id', userId).maybeSingle();
    check(error, 'réglages des notifications');
    return data ? settingsFrom(data) : null;
  }

  async forUsers(userIds: readonly string[]): Promise<NotificationSettingsRecord[]> {
    const out: NotificationSettingsRecord[] = [];
    for (let i = 0; i < userIds.length; i += 200) {
      const { data, error } = await this.client.from('notification_settings').select('*').in('user_id', [...userIds.slice(i, i + 200)]);
      check(error, 'réglages des notifications');
      out.push(...(data ?? []).map(settingsFrom));
    }
    return out;
  }

  async save(s: NotificationSettingsRecord): Promise<void> {
    const { error } = await this.client.from('notification_settings').upsert({
      user_id: s.userId,
      time_zone: s.timeZone,
      morning_hour: s.morningHour,
      disabled_kinds: s.disabledKinds,
      next_morning_at: s.nextMorningAt,
      marketing_opt_in_at: s.marketingOptInAt,
      updated_at: s.updatedAt,
    });
    check(error, 'enregistrement des réglages des notifications');
  }

  async dueMorning(at: string, limit: number): Promise<NotificationSettingsRecord[]> {
    // Index partiel notification_settings_morning_idx.
    const { data, error } = await this.client.from('notification_settings').select('*').not('next_morning_at', 'is', null).lte('next_morning_at', at).order('next_morning_at').limit(limit);
    check(error, 'défis du matin');
    return (data ?? []).map(settingsFrom);
  }
}

type LogRow = { id: number; user_id: string; kind: string; link_id: string | null; local_day: string; status: string; send_after: string | null; vars: Json | null; created_at: string };
const logFrom = (r: LogRow): NotificationLogRecord => ({
  id: String(r.id),
  userId: r.user_id,
  kind: r.kind as NotificationKindKey,
  linkId: r.link_id,
  localDay: r.local_day,
  status: r.status as NotificationStatus,
  sendAfter: isoOrNull(r.send_after),
  vars: r.vars && typeof r.vars === 'object' && !Array.isArray(r.vars) ? (r.vars as Record<string, string>) : null,
  createdAt: iso(r.created_at),
});

export class SupabaseNotificationLogRepository implements NotificationLogRepository {
  constructor(private readonly client: Db) {}

  async add(e: Omit<NotificationLogRecord, 'id'>): Promise<void> {
    const { error } = await this.client.from('notification_log').insert({
      user_id: e.userId,
      kind: e.kind,
      link_id: e.linkId,
      local_day: e.localDay,
      status: e.status,
      send_after: e.sendAfter,
      vars: e.vars,
      created_at: e.createdAt,
    });
    check(error, 'journal des notifications');
  }

  async forUserDay(userId: string, localDay: Day): Promise<NotificationLogRecord[]> {
    // Index notification_log_user_day_idx.
    const { data, error } = await this.client.from('notification_log').select('*').eq('user_id', userId).eq('local_day', localDay).limit(500);
    check(error, 'journal des notifications');
    return (data ?? []).map(logFrom);
  }

  async forUserDays(userId: string, localDays: readonly Day[]): Promise<NotificationLogRecord[]> {
    if (localDays.length === 0) return [];
    // Index notification_log_user_day_idx.
    const { data, error } = await this.client.from('notification_log').select('*').eq('user_id', userId).in('local_day', [...localDays]).limit(1000);
    check(error, 'journal des notifications');
    return (data ?? []).map(logFrom);
  }

  async merge(id: string, vars: Record<string, string>): Promise<boolean> {
    const { data, error } = await this.client.from('notification_log').update({ vars }).eq('id', Number(id)).eq('status', 'deferred').select('id');
    check(error, 'notification reportée');
    return (data ?? []).length > 0;
  }

  async dueDeferred(at: string, limit: number): Promise<NotificationLogRecord[]> {
    // Index partiel notification_log_deferred_idx.
    const { data, error } = await this.client.from('notification_log').select('*').eq('status', 'deferred').lte('send_after', at).order('send_after').limit(limit);
    check(error, 'notifications reportées');
    return (data ?? []).map(logFrom);
  }

  async close(id: string, status: 'sent' | 'dropped', sent?: { at: string; localDay: Day }): Promise<boolean> {
    const { data: row, error: readError } = await this.client.from('notification_log').select('vars').eq('id', Number(id)).maybeSingle();
    check(readError, 'notification reportée');
    const key = row?.vars && typeof row.vars === 'object' && !Array.isArray(row.vars) ? (row.vars as Record<string, unknown>).key : undefined;
    const patch = {
      status,
      vars: typeof key === 'string' ? { key } : null,
      ...(status === 'sent' && sent ? { created_at: sent.at, local_day: sent.localDay } : {}),
    };
    const { data, error } = await this.client.from('notification_log').update(patch).eq('id', Number(id)).eq('status', 'deferred').select('id');
    check(error, 'notification reportée');
    return (data ?? []).length > 0;
  }

  async purge(before: string): Promise<number> {
    const { count, error } = await this.client.from('notification_log').delete({ count: 'exact' }).lt('created_at', before).neq('status', 'deferred');
    check(error, 'ménage du journal des notifications');
    return count ?? 0;
  }
}

export class SupabasePushReceiptsRepository implements PushReceiptsRepository {
  constructor(private readonly client: Db) {}

  async add(tickets: readonly { ticketId: string; token: string; createdAt: string }[]): Promise<void> {
    if (tickets.length === 0) return;
    const { error } = await this.client.from('push_receipts').upsert(tickets.map((t) => ({ ticket_id: t.ticketId, token: t.token, created_at: t.createdAt })));
    check(error, 'tickets de push');
  }

  async due(before: string, limit: number): Promise<{ ticketId: string; token: string }[]> {
    const { data, error } = await this.client.from('push_receipts').select('ticket_id, token').lte('created_at', before).order('created_at').limit(limit);
    check(error, 'tickets de push');
    return (data ?? []).map((r) => ({ ticketId: r.ticket_id, token: r.token }));
  }

  async remove(ticketIds: readonly string[]): Promise<void> {
    if (ticketIds.length === 0) return;
    const { error } = await this.client.from('push_receipts').delete().in('ticket_id', [...ticketIds]);
    check(error, 'tickets de push');
  }

  async purge(before: string): Promise<number> {
    const { count, error } = await this.client.from('push_receipts').delete({ count: 'exact' }).lt('created_at', before);
    check(error, 'ménage des tickets de push');
    return count ?? 0;
  }
}

type LiveRow = Database['public']['Tables']['live_activity_tokens']['Row'];
const liveFrom = (r: LiveRow): LiveActivityTokenRecord => ({
  token: r.token,
  userId: r.user_id,
  use: r.use as LiveActivityUse,
  activity: r.activity as LiveActivityKindKey | null,
  activityId: r.activity_id,
  linkId: r.link_id,
  endsAt: isoOrNull(r.ends_at),
  createdAt: iso(r.created_at),
  lastSeenAt: iso(r.last_seen_at),
});

/** `live_activity_tokens` (migration 20261115170000_integration). */
export class SupabaseLiveActivityTokensRepository implements LiveActivityTokensRepository {
  constructor(private readonly client: Db) {}

  async upsert(r: LiveActivityTokenRecord): Promise<void> {
    if (r.use === 'update' && r.activity) {
      let q = this.client.from('live_activity_tokens').delete().eq('user_id', r.userId).eq('use', 'update').eq('activity', r.activity).neq('token', r.token);
      q = r.activityId === null ? q.is('activity_id', null) : q.eq('activity_id', r.activityId);
      const { error } = await q;
      check(error, 'remplacement du jeton d’activité');
    }
    const { error } = await this.client.from('live_activity_tokens').upsert({
      token: r.token,
      user_id: r.userId,
      use: r.use,
      activity: r.activity,
      activity_id: r.activityId,
      link_id: r.linkId,
      ends_at: r.endsAt,
      last_seen_at: r.lastSeenAt,
      disabled_at: null,
    });
    check(error, 'enregistrement du jeton d’activité');
  }

  async forUser(userId: string, filter: { use: LiveActivityUse; activity?: LiveActivityKindKey; linkId?: string | null }): Promise<LiveActivityTokenRecord[]> {
    let q = this.client.from('live_activity_tokens').select('*').eq('user_id', userId).eq('use', filter.use).is('disabled_at', null);
    if (filter.activity) q = q.eq('activity', filter.activity);
    if (filter.linkId !== undefined) q = filter.linkId === null ? q.is('link_id', null) : q.eq('link_id', filter.linkId);
    const { data, error } = await q.order('last_seen_at', { ascending: false }).limit(10);
    check(error, 'jetons d’activité');
    return (data ?? []).map(liveFrom);
  }

  async remove(tokens: readonly string[]): Promise<void> {
    if (tokens.length === 0) return;
    const { error } = await this.client.from('live_activity_tokens').delete().in('token', [...tokens]);
    check(error, 'oubli des jetons d’activité');
  }

  async removeForUser(token: string, userId: string): Promise<void> {
    const { error } = await this.client.from('live_activity_tokens').delete().eq('token', token).eq('user_id', userId);
    check(error, 'retrait du jeton d’activité');
  }

  async disable(tokens: readonly string[], at: string): Promise<void> {
    if (tokens.length === 0) return;
    const { error } = await this.client.from('live_activity_tokens').update({ disabled_at: at }).in('token', [...tokens]);
    check(error, 'désactivation des jetons d’activité');
  }

  async listEnded(at: string, limit: number): Promise<LiveActivityTokenRecord[]> {
    const { data, error } = await this.client
      .from('live_activity_tokens')
      .select('*')
      .eq('use', 'update')
      .is('disabled_at', null)
      .lte('ends_at', at)
      .order('ends_at')
      .limit(limit);
    check(error, 'activités terminées');
    return (data ?? []).map(liveFrom);
  }

  async purgeDisabled(before: string): Promise<number> {
    const { data, error } = await this.client.from('live_activity_tokens').delete().lt('disabled_at', before).select('token');
    check(error, 'purge des jetons d’activité');
    return (data ?? []).length;
  }
}
