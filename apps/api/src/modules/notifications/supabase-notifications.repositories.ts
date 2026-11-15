import type { Day, NotificationKindKey } from '@blowy/domain';
import type { Db, Json } from '../../persistence/database.types';
import { check, iso, isoOrNull } from '../../persistence/supabase';
import type {
  DevicesRepository,
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

type SettingsRow = { user_id: string; time_zone: string; morning_hour: number; disabled_kinds: string[]; next_morning_at: string | null; updated_at: string };
const settingsFrom = (r: SettingsRow): NotificationSettingsRecord => ({
  userId: r.user_id,
  timeZone: r.time_zone,
  morningHour: r.morning_hour,
  disabledKinds: r.disabled_kinds as NotificationKindKey[],
  nextMorningAt: isoOrNull(r.next_morning_at),
  updatedAt: iso(r.updated_at),
});

export class SupabaseNotificationSettingsRepository implements NotificationSettingsRepository {
  constructor(private readonly client: Db) {}

  async get(userId: string): Promise<NotificationSettingsRecord | null> {
    const { data, error } = await this.client.from('notification_settings').select('*').eq('user_id', userId).maybeSingle();
    check(error, 'réglages des notifications');
    return data ? settingsFrom(data) : null;
  }

  async save(s: NotificationSettingsRecord): Promise<void> {
    const { error } = await this.client.from('notification_settings').upsert({
      user_id: s.userId,
      time_zone: s.timeZone,
      morning_hour: s.morningHour,
      disabled_kinds: s.disabledKinds,
      next_morning_at: s.nextMorningAt,
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

  async dueDeferred(at: string, limit: number): Promise<NotificationLogRecord[]> {
    // Index partiel notification_log_deferred_idx.
    const { data, error } = await this.client.from('notification_log').select('*').eq('status', 'deferred').lte('send_after', at).order('send_after').limit(limit);
    check(error, 'notifications reportées');
    return (data ?? []).map(logFrom);
  }

  async close(id: string, status: 'sent' | 'dropped'): Promise<boolean> {
    const { data, error } = await this.client.from('notification_log').update({ status, vars: null }).eq('id', Number(id)).eq('status', 'deferred').select('id');
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
