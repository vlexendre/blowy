import { NO_ACTIVITY, type LifetimeStats, type WeekActivity } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type { ProgressionReader } from '../ports';

export class MemoryProgressionReader implements ProgressionReader {
  constructor(private readonly db: MemoryDb) {}

  async lifetime(userId: string): Promise<Omit<LifetimeStats, 'bestStreak'>> {
    const links = [...this.db.links.values()].filter((l) => l.userA === userId || l.userB === userId);
    const others = links.map((l) => (l.userA === userId ? l.userB : l.userA));
    const cells = new Set(others.map((id) => this.db.profilePlaces.get(id)?.homeCell).filter((c): c is string => !!c));
    return {
      waves: [...this.db.encounters.values()].filter((e) => e.fromUser === userId).length,
      messages: this.db.messages.filter((m) => m.authorKind === 'user' && m.authorId === userId).length,
      links: links.length,
      sessions: this.db.cheminProgress.get(userId)?.sessionsDone ?? 0,
      places: cells.size,
    };
  }

  async week(userIds: readonly string[], since: string): Promise<Map<string, WeekActivity>> {
    const out = new Map(userIds.map((id) => [id, { ...NO_ACTIVITY }]));
    for (const m of this.db.messages) if (m.authorKind === 'user' && m.authorId && m.createdAt >= since) { const a = out.get(m.authorId); if (a) a.messages++; }
    for (const e of this.db.encounters.values()) if (e.createdAt >= since) { const a = out.get(e.fromUser); if (a) a.waves++; }
    for (const s of this.db.cheminSessions.values()) if (s.completedAt && s.completedAt >= since) { const a = out.get(s.userId); if (a) a.sessions++; }
    for (const l of this.db.links.values()) if (l.createdAt >= since) for (const id of [l.userA, l.userB]) { const a = out.get(id); if (a) a.links++; }
    return out;
  }

  async neighbours(userId: string, limit: number): Promise<string[]> {
    const cell = this.db.profilePlaces.get(userId)?.homeCell;
    if (!cell) return [];
    const ids = [...this.db.profilePlaces.values()].filter((p) => p.homeCell === cell).map((p) => p.userId);
    return [userId, ...ids.filter((id) => id !== userId).sort()].slice(0, limit);
  }
}
