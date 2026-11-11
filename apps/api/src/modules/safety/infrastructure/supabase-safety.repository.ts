import type { Db } from '../../../persistence/database.types';
import { check, iso } from '../../../persistence/supabase';
import type { BlockRecord, BlocksRepository, ReportRecord, ReportsRepository } from '../ports';

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
    const { error } = await this.client
      .from('reports')
      .insert({ reporter: r.reporter, target_user: r.targetUser, link_id: r.linkId, reason: r.reason, details: r.details, created_at: r.createdAt });
    check(error, 'signalement');
  }
}
