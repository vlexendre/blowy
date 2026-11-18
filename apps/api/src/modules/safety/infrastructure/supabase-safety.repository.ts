import type { Db } from '../../../persistence/database.types';
import { check, iso } from '../../../persistence/supabase';
import type { BlockRecord, BlocksRepository, ReportAlertRow, ReportRecord, ReportsRepository } from '../ports';

interface BlockRow {
  blocker: string;
  blocked: string;
  created_at: string;
}

export class SupabaseBlocksRepository implements BlocksRepository {
  constructor(private readonly client: Db) {}

  private get table() {
    return this.client.from('blocks');
  }

  async add(b: BlockRecord): Promise<void> {
    const { error } = await this.table.upsert(
      { blocker: b.blocker, blocked: b.blocked, created_at: b.createdAt },
      { onConflict: 'blocker,blocked', ignoreDuplicates: true },
    );
    check(error, 'blocage');
  }

  async remove(blocker: string, blocked: string): Promise<void> {
    const { error } = await this.table.delete().eq('blocker', blocker).eq('blocked', blocked);
    check(error, 'déblocage');
  }

  async listBy(blocker: string): Promise<BlockRecord[]> {
    const { data, error } = await this.table.select('*').eq('blocker', blocker).order('created_at', { ascending: false });
    check(error, 'lecture des blocages');
    return (data as BlockRow[]).map((r) => ({ blocker: r.blocker, blocked: r.blocked, createdAt: iso(r.created_at) }));
  }

  async blockedEitherWay(userId: string): Promise<Set<string>> {
    const { data, error } = await this.table.select('*').or(`blocker.eq.${userId},blocked.eq.${userId}`);
    check(error, 'lecture des blocages');
    return new Set((data as BlockRow[]).map((r) => (r.blocker === userId ? r.blocked : r.blocker)));
  }
}

export class SupabaseReportsRepository implements ReportsRepository {
  constructor(private readonly client: Db) {}

  async add(r: ReportRecord): Promise<void> {
    const { error } = await this.client.from('reports').insert({
      reporter: r.reporter,
      target_user: r.targetUser,
      link_id: r.linkId,
      message_id: r.messageId ?? null,
      group_id: r.groupId ?? null,
      group_message_id: r.groupMessageId ?? null,
      reason: r.reason,
      details: r.details,
      created_at: r.createdAt,
      source: r.source ?? 'person',
      priority: r.priority ?? 0,
      category: r.category ?? null,
      review: r.review ?? false,
      alerted_at: r.alertedAt ?? null,
      escalated_at: r.escalatedAt ?? null,
    });
    check(error, 'signalement');
  }

  async reportedBy(reporter: string): Promise<Set<string>> {
    const { data, error } = await this.client.from('reports').select('target_user').eq('reporter', reporter).not('target_user', 'is', null);
    check(error, 'lecture des signalements');
    return new Set((data ?? []).flatMap((r) => (r.target_user ? [r.target_user] : [])));
  }

  async createdBySince(reporter: string, since: string): Promise<string[]> {
    const { data, error } = await this.client.from('reports').select('created_at').eq('reporter', reporter).gte('created_at', since).limit(500);
    check(error, 'lecture des signalements');
    return (data ?? []).map((r) => r.created_at);
  }

  async hasOpenFiltered(targetUser: string, category: string): Promise<boolean> {
    const { data, error } = await this.client.from('reports').select('id').eq('target_user', targetUser).eq('source', 'filter').eq('category', category).is('handled_at', null).limit(1);
    check(error, 'lecture des signalements');
    return (data ?? []).length > 0;
  }

  async openReportersOf(targetUser: string): Promise<{ distinct: number; minor: number }> {
    const { data, error } = await this.client.from('reports').select('reporter, reason').eq('target_user', targetUser).is('handled_at', null).eq('source', 'person').not('reporter', 'is', null).limit(500);
    check(error, 'lecture des signalements');
    const rows = data ?? [];
    return { distinct: new Set(rows.map((r) => r.reporter)).size, minor: new Set(rows.filter((r) => r.reason === 'mineur').map((r) => r.reporter)).size };
  }

  async raisePriority(targetUser: string, priority: number): Promise<void> {
    const { error } = await this.client.from('reports').update({ priority }).eq('target_user', targetUser).is('handled_at', null).lt('priority', priority);
    check(error, 'priorité des signalements');
  }

  async claimUnalerted(at: string, limit: number): Promise<ReportAlertRow[]> {
    const { data: ids, error } = await this.client.from('reports').select('id').is('alerted_at', null).eq('review', false).order('created_at', { ascending: true }).limit(limit);
    check(error, 'lecture des signalements à annoncer');
    if (!ids || ids.length === 0) return [];
    // `is null` dans la mise à jour : deux minuteurs simultanés ne réservent pas les mêmes lignes.
    const { data, error: e2 } = await this.client
      .from('reports')
      .update({ alerted_at: at })
      .in('id', ids.map((r) => r.id))
      .is('alerted_at', null)
      .select('id, reason, source, category, priority, created_at');
    check(e2, 'réservation des signalements à annoncer');
    return (data ?? []).map(alertRow);
  }

  async pendingAlerts(): Promise<{ count: number; urgent: boolean }> {
    const [all, urgent] = await Promise.all([
      this.client.from('reports').select('id', { count: 'exact', head: true }).is('alerted_at', null).eq('review', false),
      this.client.from('reports').select('id', { count: 'exact', head: true }).is('alerted_at', null).eq('review', false).gte('priority', 2),
    ]);
    check(all.error ?? urgent.error, 'comptage des signalements à annoncer');
    return { count: all.count ?? 0, urgent: (urgent.count ?? 0) > 0 };
  }

  async lastAlertAt(): Promise<string | null> {
    const { data, error } = await this.client.from('reports').select('alerted_at').eq('review', false).not('alerted_at', 'is', null).order('alerted_at', { ascending: false }).limit(1).maybeSingle();
    check(error, 'lecture de la dernière alerte');
    return data?.alerted_at ? iso(data.alerted_at) : null;
  }

  async claimOverdue(before: string, at: string, limit: number): Promise<ReportAlertRow[]> {
    const { data: ids, error } = await this.client
      .from('reports')
      .select('id')
      .is('handled_at', null)
      .is('escalated_at', null)
      .eq('review', false)
      .lt('created_at', before)
      .order('created_at', { ascending: true })
      .limit(limit);
    check(error, 'lecture des signalements en retard');
    if (!ids || ids.length === 0) return [];
    const { data, error: e2 } = await this.client
      .from('reports')
      .update({ escalated_at: at })
      .in('id', ids.map((r) => r.id))
      .is('escalated_at', null)
      .select('id, reason, source, category, priority, created_at');
    check(e2, 'escalade des signalements');
    const rows = (data ?? []).map(alertRow);
    const low = rows.filter((r) => r.priority < 1).map((r) => Number(r.id));
    if (low.length > 0) {
      const { error: e3 } = await this.client.from('reports').update({ priority: 1 }).in('id', low);
      check(e3, 'priorité des signalements en retard');
    }
    return rows.map((r) => ({ ...r, priority: Math.max(r.priority, 1) }));
  }

  async removeBy(reporter: string): Promise<void> {
    const { error } = await this.client.from('reports').delete().eq('reporter', reporter);
    check(error, 'suppression des signalements');
  }
}

function alertRow(r: { id: number; reason: string; source: string; category: string | null; priority: number; created_at: string }): ReportAlertRow {
  return { id: String(r.id), reason: r.reason, source: r.source === 'filter' ? 'filter' : 'person', category: r.category, priority: r.priority, createdAt: iso(r.created_at) };
}
