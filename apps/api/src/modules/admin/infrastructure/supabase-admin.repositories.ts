import type { Day } from '@blowy/domain';
import type { ModerationActionKind } from '@blowy/contract';
import type { Database, Db } from '../../../persistence/database.types';
import { check, iso, isoOrNull } from '../../../persistence/supabase';
import type {
  ActivityRepository,
  AdminReportRow,
  AuditFilter,
  AuditLogRepository,
  AuditRecord,
  ContextMessage,
  DailyStatsRepository,
  DailyStatsRow,
  MetricsSource,
  ModerationRepository,
  ReportFilter,
  SuspensionRecord,
  SuspensionsRepository,
  TopMinimoaRow,
} from '../ports';
import { parseCursor } from './memory-admin.repositories';

/** Échappe une recherche pour `ilike` et pour la syntaxe `or=(…)` de PostgREST. */
const like = (q: string): string => `%${q.replace(/[%_\\]/g, (c) => `\\${c}`).replace(/[,()"]/g, ' ')}%`;

type ReportRow = Database['public']['Tables']['reports']['Row'];
const reportFromRow = (r: ReportRow): AdminReportRow => ({
  id: String(r.id),
  reporter: r.reporter,
  targetUser: r.target_user,
  linkId: r.link_id,
  messageId: r.message_id,
  reason: r.reason,
  details: r.details,
  createdAt: iso(r.created_at),
  handledAt: isoOrNull(r.handled_at),
  handledBy: r.handled_by,
  resolution: r.resolution as ModerationActionKind | null,
  priority: r.priority ?? 0,
  source: r.source === 'filter' ? 'filter' : 'person',
  category: r.category ?? null,
  review: r.review ?? false,
});

export class SupabaseSuspensionsRepository implements SuspensionsRepository {
  constructor(private readonly client: Db) {}
  private get table() {
    return this.client.from('account_suspensions');
  }
  async find(userId: string): Promise<SuspensionRecord | null> {
    const { data, error } = await this.table.select('*').eq('user_id', userId).maybeSingle();
    check(error, 'lecture de la suspension');
    return data ? { userId: data.user_id, since: iso(data.since), until: isoOrNull(data.until), reason: data.reason, byEmail: data.by_email } : null;
  }
  async put(r: SuspensionRecord): Promise<void> {
    const { error } = await this.table.upsert({ user_id: r.userId, since: r.since, until: r.until, reason: r.reason, by_email: r.byEmail }, { onConflict: 'user_id' });
    check(error, 'suspension');
  }
  async remove(userId: string): Promise<void> {
    const { error } = await this.table.delete().eq('user_id', userId);
    check(error, 'levée de la suspension');
  }
  async listActive(now: string, cursor: string | null, limit: number): Promise<SuspensionRecord[]> {
    let q = this.table.select('*').or(`until.is.null,until.gt.${now}`).order('since', { ascending: false }).limit(limit);
    if (cursor) q = q.lt('since', cursor);
    const { data, error } = await q;
    check(error, 'lecture des suspensions');
    return (data ?? []).map((d) => ({ userId: d.user_id, since: iso(d.since), until: isoOrNull(d.until), reason: d.reason, byEmail: d.by_email }));
  }
  async activeAmong(userIds: readonly string[], now: string): Promise<Set<string>> {
    const out = new Set<string>();
    // Par paquets (longueur de l'URL PostgREST) ; la clé primaire sert la recherche.
    for (let i = 0; i < userIds.length; i += 200) {
      const ids = userIds.slice(i, i + 200);
      const { data, error } = await this.table.select('user_id').in('user_id', [...ids]).or(`until.is.null,until.gt.${now}`);
      check(error, 'lecture des suspensions');
      for (const d of data ?? []) out.add(d.user_id);
    }
    return out;
  }
}

type AuditRow = Database['public']['Tables']['admin_audit_log']['Row'];
const auditFromRow = (r: AuditRow): AuditRecord => ({
  id: String(r.id),
  at: iso(r.at),
  adminEmail: r.admin_email,
  action: r.action as ModerationActionKind,
  targetUserId: r.target_user_id,
  targetName: r.target_name,
  reportId: r.report_id === null ? null : String(r.report_id),
  reason: r.reason,
  until: isoOrNull(r.until),
});

export class SupabaseAuditLogRepository implements AuditLogRepository {
  constructor(private readonly client: Db) {}
  private get table() {
    return this.client.from('admin_audit_log');
  }
  async append(e: Omit<AuditRecord, 'id'>): Promise<AuditRecord> {
    const { data, error } = await this.table
      .insert({
        at: e.at,
        admin_email: e.adminEmail,
        action: e.action,
        target_user_id: e.targetUserId,
        target_name: e.targetName,
        report_id: e.reportId === null ? null : Number(e.reportId),
        reason: e.reason,
        until: e.until,
      })
      .select('*')
      .single();
    check(error, 'journal de modération');
    return auditFromRow(data as AuditRow);
  }
  async page(filter: AuditFilter, cursor: string | null, limit: number): Promise<AuditRecord[]> {
    let q = this.table.select('*').order('id', { ascending: false }).limit(limit);
    if (cursor && /^\d+$/.test(cursor)) q = q.lt('id', Number(cursor));
    if (filter.action) q = q.eq('action', filter.action);
    if (filter.targetUserId) q = q.eq('target_user_id', filter.targetUserId);
    if (filter.q) {
      const p = like(filter.q);
      q = q.or(`target_name.ilike.${p},admin_email.ilike.${p},reason.ilike.${p}`);
    }
    const { data, error } = await q;
    check(error, 'lecture du journal');
    return (data ?? []).map(auditFromRow);
  }
}

export class SupabaseModerationRepository implements ModerationRepository {
  constructor(private readonly client: Db) {}
  private get reports() {
    return this.client.from('reports');
  }

  async page(filter: ReportFilter, cursor: string | null, limit: number): Promise<AdminReportRow[]> {
    const ascending = filter.status === 'open';
    let q = (ascending ? this.reports.select('*').order('priority', { ascending: false }) : this.reports.select('*')).order('created_at', { ascending }).order('id', { ascending }).limit(limit);
    if (filter.status === 'open') q = q.is('handled_at', null);
    if (filter.status === 'handled') q = q.not('handled_at', 'is', null);
    if (filter.reason) q = q.eq('reason', filter.reason);
    if (filter.targetIds) q = q.in('target_user', [...filter.targetIds]);
    const after = cursor ? parseCursor(cursor) : null;
    if (after) {
      const op = ascending ? 'gt' : 'lt';
      const sameRank = `created_at.${op}.${after.createdAt},and(created_at.eq.${after.createdAt},id.${op}.${after.id})`;
      q = ascending
        ? q.or(`priority.lt.${after.priority},and(priority.eq.${after.priority},created_at.gt.${after.createdAt}),and(priority.eq.${after.priority},created_at.eq.${after.createdAt},id.gt.${after.id})`)
        : q.or(sameRank);
    }
    const { data, error } = await q;
    check(error, 'lecture des signalements');
    return (data ?? []).map(reportFromRow);
  }

  async find(id: string): Promise<AdminReportRow | null> {
    if (!/^\d+$/.test(id)) return null;
    const { data, error } = await this.reports.select('*').eq('id', Number(id)).maybeSingle();
    check(error, 'lecture du signalement');
    return data ? reportFromRow(data) : null;
  }

  async counts(now: string, overdueHours: number): Promise<{ open: number; overdue: number }> {
    const limit = new Date(Date.parse(now) - overdueHours * 3_600_000).toISOString();
    const [open, overdue] = await Promise.all([
      this.reports.select('id', { count: 'exact', head: true }).is('handled_at', null),
      this.reports.select('id', { count: 'exact', head: true }).is('handled_at', null).lt('created_at', limit),
    ]);
    check(open.error ?? overdue.error, 'comptage des signalements');
    return { open: open.count ?? 0, overdue: overdue.count ?? 0 };
  }

  async countsByTarget(userIds: readonly string[]): Promise<Map<string, { open: number; total: number }>> {
    const out = new Map<string, { open: number; total: number }>(userIds.map((id) => [id, { open: 0, total: 0 }]));
    if (userIds.length === 0) return out;
    const { data, error } = await this.reports.select('target_user, handled_at').in('target_user', [...userIds]);
    check(error, 'comptage des signalements');
    for (const r of data ?? []) {
      const c = r.target_user ? out.get(r.target_user) : undefined;
      if (!c) continue;
      c.total += 1;
      if (r.handled_at === null) c.open += 1;
    }
    return out;
  }

  async resolve(input: { reportId: string | null; targetUserId: string; at: string; by: string; resolution: ModerationActionKind }): Promise<void> {
    let q = this.reports.update({ handled_at: input.at, handled_by: input.by, resolution: input.resolution }).is('handled_at', null);
    q = input.reportId !== null ? q.eq('id', Number(input.reportId)) : q.eq('target_user', input.targetUserId);
    const { error } = await q;
    check(error, 'traitement du signalement');
  }

  async context(linkId: string, messageId: string, around: number): Promise<ContextMessage[]> {
    const messages = this.client.from('messages');
    const { data: m, error } = await messages.select('*').eq('id', messageId).eq('link_id', linkId).maybeSingle();
    check(error, 'lecture du message signalé');
    if (!m) return [];
    const [before, after] = await Promise.all([
      messages.select('*').eq('link_id', linkId).lt('created_at', m.created_at).order('created_at', { ascending: false }).limit(around),
      messages.select('*').eq('link_id', linkId).gt('created_at', m.created_at).order('created_at', { ascending: true }).limit(around),
    ]);
    check(before.error ?? after.error, 'lecture du contexte');
    const rows = [...(before.data ?? []).reverse(), m, ...(after.data ?? [])];
    return rows.map((r) => ({
      id: r.id,
      linkId: r.link_id,
      authorKind: r.author_kind as ContextMessage['authorKind'],
      authorId: r.author_id,
      kind: r.kind,
      body: r.body,
      mediaPath: r.media_path,
      createdAt: iso(r.created_at),
    }));
  }

  async searchPeople(q: string, limit: number): Promise<string[]> {
    const { data, error } = await this.client.from('profiles').select('id').ilike('display_name', like(q)).limit(limit);
    check(error, 'recherche de personnes');
    return (data ?? []).map((p) => p.id);
  }
}

export class SupabaseActivityRepository implements ActivityRepository {
  constructor(private readonly client: Db) {}
  async touch(userId: string, day: Day): Promise<void> {
    const { error } = await this.client.from('user_activity_days').upsert({ day, user_id: userId }, { onConflict: 'day,user_id', ignoreDuplicates: true });
    check(error, 'jour d’activité');
  }
  async purgeBefore(day: Day): Promise<number> {
    const { count, error } = await this.client.from('user_activity_days').delete({ count: 'exact' }).lt('day', day);
    check(error, 'purge des jours d’activité');
    return count ?? 0;
  }
  async usersOn(day: Day, afterUserId: string | null, limit: number): Promise<string[]> {
    // Clé primaire (day, user_id) : parcours d'un intervalle, sans tri.
    let q = this.client.from('user_activity_days').select('user_id').eq('day', day).order('user_id').limit(limit);
    if (afterUserId) q = q.gt('user_id', afterUserId);
    const { data, error } = await q;
    check(error, 'lecture des jours d’activité');
    return (data ?? []).map((r) => r.user_id);
  }
}

export class SupabaseDailyStatsRepository implements DailyStatsRepository {
  constructor(private readonly client: Db) {}
  private get table() {
    return this.client.from('admin_daily_stats');
  }
  private fromRow = (r: Database['public']['Tables']['admin_daily_stats']['Row']): DailyStatsRow => ({
    day: r.day,
    metrics: r.metrics as unknown as DailyStatsRow['metrics'],
    computedAt: iso(r.computed_at),
  });
  async get(day: Day): Promise<DailyStatsRow | null> {
    const { data, error } = await this.table.select('*').eq('day', day).maybeSingle();
    check(error, 'lecture des statistiques');
    return data ? this.fromRow(data) : null;
  }
  async range(from: Day, to: Day): Promise<DailyStatsRow[]> {
    const { data, error } = await this.table.select('*').gte('day', from).lte('day', to).order('day', { ascending: true });
    check(error, 'lecture des statistiques');
    return (data ?? []).map(this.fromRow);
  }
  async latest(): Promise<DailyStatsRow | null> {
    const { data, error } = await this.table.select('*').order('day', { ascending: false }).limit(1);
    check(error, 'lecture des statistiques');
    return data && data[0] ? this.fromRow(data[0]) : null;
  }
  async put(row: DailyStatsRow): Promise<void> {
    const { error } = await this.table.upsert({ day: row.day, metrics: JSON.parse(JSON.stringify(row.metrics)), computed_at: row.computedAt }, { onConflict: 'day' });
    check(error, 'écriture des statistiques');
  }
}

const n = (v: unknown): number => (typeof v === 'number' ? v : typeof v === 'string' ? Number(v) || 0 : 0);

/** Une requête : la fonction SQL `admin_daily_metrics` de la migration 20261115160000. */
export class SupabaseMetricsSource implements MetricsSource {
  constructor(private readonly client: Db) {}
  async compute(day: Day): ReturnType<MetricsSource['compute']> {
    const { data, error } = await this.client.rpc('admin_daily_metrics', { p_day: day });
    check(error, 'calcul des statistiques');
    const m = (data ?? {}) as Record<string, unknown>;
    const top = Array.isArray(m.top) ? (m.top as Record<string, unknown>[]) : [];
    return {
      accountsTotal: n(m.accountsTotal),
      accountsNew: n(m.accountsNew),
      dau: n(m.dau),
      wau: n(m.wau),
      mau: n(m.mau),
      d1Cohort: n(m.d1Cohort),
      d1Retained: n(m.d1Retained),
      d7Cohort: n(m.d7Cohort),
      d7Retained: n(m.d7Retained),
      d30Cohort: n(m.d30Cohort),
      d30Retained: n(m.d30Retained),
      subscribers: n(m.subscribers),
      trials: n(m.trials),
      newTrials: n(m.newTrials),
      petMessages: n(m.petMessages),
      petMessagesAnswered: n(m.petMessagesAnswered),
      encountersWaved: n(m.encountersWaved),
      encountersAccepted: n(m.encountersAccepted),
      linksActive: n(m.linksActive),
      linksGhost: n(m.linksGhost),
      linksArchived: n(m.linksArchived),
      linksWroteTogether: m.linksWroteTogether === undefined || m.linksWroteTogether === null ? null : n(m.linksWroteTogether),
      reportsOpened: n(m.reportsOpened),
      reportsHandled: n(m.reportsHandled),
      reportsOpen: n(m.reportsOpen),
      top: top.map(
        (t): TopMinimoaRow => ({
          userId: String(t.userId),
          ownerName: String(t.ownerName),
          petName: String(t.petName),
          species: String(t.species),
          activeLinks: n(t.activeLinks),
        }),
      ),
    };
  }
}
