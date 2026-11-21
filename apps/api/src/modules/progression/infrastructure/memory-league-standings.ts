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

  async save(standing: LeagueStanding): Promise<void> {
    this.db.leagueStandings.set(standing.userId, { ...standing });
  }
}
