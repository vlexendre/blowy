import type { VisionSignal } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type { MatchCacheEntry, MatchCacheRepository, PlaceRecord, PlacesRepository, VisionSnapshot, VisionStore } from '../ports';

const clonePlace = (p: PlaceRecord): PlaceRecord => ({
  ...p,
  last: { ...p.last },
  home: { ...p.home },
  candidate: p.candidate ? { ...p.candidate } : null,
  chosenCity: p.chosenCity ? { ...p.chosenCity } : null,
  manualArea: p.manualArea ? { ...p.manualArea } : null,
});

export class MemoryPlacesRepository implements PlacesRepository {
  constructor(private readonly db: MemoryDb) {}

  async find(userId: string): Promise<PlaceRecord | null> {
    const p = this.db.profilePlaces.get(userId);
    return p ? clonePlace(p) : null;
  }

  async findMany(userIds: readonly string[]): Promise<PlaceRecord[]> {
    return userIds.flatMap((id) => {
      const p = this.db.profilePlaces.get(id);
      return p ? [clonePlace(p)] : [];
    });
  }

  async save(place: PlaceRecord): Promise<void> {
    if (!this.db.profiles.has(place.userId)) throw new Error('profil introuvable');
    this.db.profilePlaces.set(place.userId, clonePlace(place));
  }

  async remove(userId: string): Promise<void> {
    this.db.profilePlaces.delete(userId);
  }

  async listInCells(cells: readonly string[], limit: number, excludeId: string): Promise<PlaceRecord[]> {
    const wanted = new Set(cells);
    return [...this.db.profilePlaces.values()]
      .filter((p) => p.userId !== excludeId && wanted.has(p.homeCell))
      .sort((a, b) => b.locatedAt.localeCompare(a.locatedAt) || a.userId.localeCompare(b.userId))
      .slice(0, limit)
      .map(clonePlace);
  }
}

export class MemoryVisionStore implements VisionStore {
  constructor(private readonly db: MemoryDb) {}

  async listSignals(userId: string, limit: number): Promise<VisionSignal[]> {
    return this.db.visionSignals
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit)
      .map(({ axis, value, source, at }) => ({ axis, value, source, at }));
  }

  async addSignals(userId: string, signals: readonly VisionSignal[]): Promise<void> {
    if (!this.db.profiles.has(userId)) throw new Error('profil introuvable');
    for (const s of signals) this.db.visionSignals.push({ ...s, userId });
  }

  async replaceTest(userId: string, signals: readonly VisionSignal[]): Promise<void> {
    for (let i = this.db.visionSignals.length - 1; i >= 0; i--) {
      const s = this.db.visionSignals[i];
      if (s && s.userId === userId && s.source === 'test') this.db.visionSignals.splice(i, 1);
    }
    await this.addSignals(userId, signals);
  }

  async saveSnapshot(snapshot: VisionSnapshot): Promise<void> {
    this.db.visionProfiles.set(snapshot.userId, structuredClone(snapshot));
  }

  async findSnapshot(userId: string): Promise<VisionSnapshot | null> {
    const s = this.db.visionProfiles.get(userId);
    return s ? structuredClone(s) : null;
  }

  async findSnapshots(userIds: readonly string[]): Promise<VisionSnapshot[]> {
    return userIds.flatMap((id) => {
      const s = this.db.visionProfiles.get(id);
      return s ? [structuredClone(s)] : [];
    });
  }
}

export class MemoryMatchCache implements MatchCacheRepository {
  constructor(private readonly db: MemoryDb) {}

  async get(userId: string): Promise<MatchCacheEntry | null> {
    const e = this.db.matchCache.get(userId);
    return e ? structuredClone(e) : null;
  }

  async put(userId: string, entry: MatchCacheEntry): Promise<void> {
    this.db.matchCache.set(userId, structuredClone(entry));
  }

  async clear(userId: string): Promise<void> {
    this.db.matchCache.delete(userId);
  }
}
