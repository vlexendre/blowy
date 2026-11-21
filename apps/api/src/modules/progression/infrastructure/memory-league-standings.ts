import type { MemoryDb } from '../../../persistence/memory-db';
import type { LeagueStanding, LeagueStandingsRepository } from '../ports';

export class MemoryLeagueStandings implements LeagueStandingsRepository {
  constructor(private readonly db: MemoryDb) {}

  async find(userIds: readonly string[]): Promise<Map<string, LeagueStanding>> {
    const out = new Map<string, LeagueStanding>();
    for (const id of userIds) {
      const s = this.db.leagueStandings.get(id);
      if (s) out.set(id, { ...s });
    }
    return out;
  }

  async listStale(week: string, after: string | null, limit: number): Promise<LeagueStanding[]> {
    return this.page((s) => s.week < week, after, limit);
  }

  async listWeek(week: string, after: string | null, limit: number): Promise<LeagueStanding[]> {
    return this.page((s) => s.week === week, after, limit);
  }

  private page(keep: (s: LeagueStanding) => boolean, after: string | null, limit: number): LeagueStanding[] {
    return [...this.db.leagueStandings.values()]
      .filter((s) => keep(s) && (after === null || s.userId > after))
      .sort((a, b) => (a.userId < b.userId ? -1 : 1))
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }

  async save(standing: LeagueStanding): Promise<void> {
    this.db.leagueStandings.set(standing.userId, { ...standing });
  }
}
