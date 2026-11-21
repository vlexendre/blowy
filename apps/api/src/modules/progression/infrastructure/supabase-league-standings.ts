import type { LeagueOutcome, LeagueTier } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check } from '../../../persistence/supabase';
import type { LeagueStanding, LeagueStandingsRepository } from '../ports';

export class SupabaseLeagueStandings implements LeagueStandingsRepository {
  constructor(private readonly client: Db) {}

  async listStale(week: string, after: string | null, limit: number): Promise<LeagueStanding[]> {
    let q = this.client
      .from('league_standings')
      .select('user_id, tier, week, result, result_rank, result_from')
      .lt('week', week)
      .order('user_id')
      .limit(limit);
    if (after) q = q.gt('user_id', after);
    const { data, error } = await q;
    check(error, 'ligues : à solder');
    return (data ?? []).map(toStanding);
  }

  async listWeek(week: string, after: string | null, limit: number): Promise<LeagueStanding[]> {
    let q = this.client
      .from('league_standings')
      .select('user_id, tier, week, result, result_rank, result_from')
      .eq('week', week)
      .order('user_id')
      .limit(limit);
    if (after) q = q.gt('user_id', after);
    const { data, error } = await q;
    check(error, 'ligues : semaine');
    return (data ?? []).map(toStanding);
  }

  async find(userIds: readonly string[]): Promise<Map<string, LeagueStanding>> {
    const out = new Map<string, LeagueStanding>();
    if (userIds.length === 0) return out;
    const { data, error } = await this.client
      .from('league_standings')
      .select('user_id, tier, week, result, result_rank, result_from')
      .in('user_id', [...userIds]);
    check(error, 'ligues : lecture');
    for (const r of data ?? []) out.set(r.user_id, toStanding(r));
    return out;
  }

  async save(s: LeagueStanding): Promise<void> {
    const { error } = await this.client.from('league_standings').upsert(
      {
        user_id: s.userId,
        tier: s.tier,
        week: s.week,
        result: s.result,
        result_rank: s.resultRank,
        result_from: s.resultFrom,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    check(error, 'ligues : écriture');
  }
}

type Row = {
  user_id: string;
  tier: string;
  week: string;
  result: string | null;
  result_rank: number | null;
  result_from: string | null;
};
function toStanding(r: Row): LeagueStanding {
  return {
    userId: r.user_id,
    tier: r.tier as LeagueTier,
    week: r.week,
    result: (r.result as LeagueOutcome | null) ?? null,
    resultRank: r.result_rank,
    resultFrom: (r.result_from as LeagueTier | null) ?? null,
  };
}
