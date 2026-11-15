import type { MemoryDb } from '../../../persistence/memory-db';
import type { EncounterRecord, EncounterStatus, EncountersRepository } from '../ports';

export class MemoryEncountersRepository implements EncountersRepository {
  constructor(private readonly db: MemoryDb) {}

  async findById(id: string): Promise<EncounterRecord | null> {
    const e = this.db.encounters.get(id);
    return e ? { ...e } : null;
  }

  async findPair(fromUser: string, toUser: string): Promise<EncounterRecord | null> {
    for (const e of this.db.encounters.values()) if (e.fromUser === fromUser && e.toUser === toUser) return { ...e };
    return null;
  }

  async create(encounter: EncounterRecord): Promise<EncounterRecord | null> {
    if (await this.findPair(encounter.fromUser, encounter.toUser)) return null;
    this.db.encounters.set(encounter.id, { ...encounter });
    return { ...encounter };
  }

  async setStatus(id: string, status: EncounterStatus, at: string): Promise<void> {
    const e = this.db.encounters.get(id);
    if (!e) throw new Error('rencontre introuvable');
    this.db.encounters.set(id, { ...e, status, statusAt: at });
  }

  async listInvolving(userId: string): Promise<EncounterRecord[]> {
    return [...this.db.encounters.values()].filter((e) => e.fromUser === userId || e.toUser === userId).map((e) => ({ ...e }));
  }

  async listHistory(userId: string, before: string | null, limit: number): Promise<EncounterRecord[]> {
    return [...this.db.encounters.values()]
      .filter((e) => e.fromUser === userId || (e.toUser === userId && e.status !== 'waved'))
      .filter((e) => before === null || e.statusAt < before)
      .sort((a, b) => b.statusAt.localeCompare(a.statusAt) || b.id.localeCompare(a.id))
      .slice(0, limit)
      .map((e) => ({ ...e }));
  }
}
