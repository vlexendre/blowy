import { type Locale, dayOf } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type { FideliteFilter, FidelitePeople, FidelitePerson, LifecycleLog } from '../ports';

const k = (userId: string, key: string): string => `${userId}|${key}`;

export class MemoryLifecycleLog implements LifecycleLog {
  constructor(private readonly db: MemoryDb) {}

  async claim(userId: string, key: string, at: string): Promise<boolean> {
    // Comme la clé étrangère : pas de ligne pour une personne qui n'existe plus.
    if (!this.db.profiles.has(userId) || this.db.lifecycleMessages.has(k(userId, key))) return false;
    this.db.lifecycleMessages.set(k(userId, key), at);
    return true;
  }

  async keys(userIds: readonly string[]): Promise<Map<string, Set<string>>> {
    const out = new Map(userIds.map((id) => [id, new Set<string>()]));
    for (const composite of this.db.lifecycleMessages.keys()) {
      const i = composite.indexOf('|');
      out.get(composite.slice(0, i))?.add(composite.slice(i + 1));
    }
    return out;
  }

  async purge(before: string): Promise<number> {
    let n = 0;
    for (const [key, at] of this.db.lifecycleMessages) {
      if (Date.parse(at) < Date.parse(before)) {
        this.db.lifecycleMessages.delete(key);
        n += 1;
      }
    }
    return n;
  }
}

export class MemoryFidelitePeople implements FidelitePeople {
  constructor(private readonly db: MemoryDb) {}

  async page(filter: FideliteFilter, afterId: string | null, limit: number): Promise<FidelitePerson[]> {
    const people: FidelitePerson[] = [...this.db.profiles.values()].map((p) => ({
      userId: p.id,
      locale: p.locale as Locale,
      displayName: p.displayName,
      createdAt: p.createdAt,
      lastActiveOn: this.db.accountActivity.get(p.id)?.lastActiveOn ?? dayOf(new Date(p.createdAt)),
      reviewWorld: p.reviewWorld ?? null,
    }));
    return people
      .filter((p) =>
        filter.by === 'created'
          ? Date.parse(p.createdAt) >= Date.parse(filter.from) && Date.parse(p.createdAt) <= Date.parse(filter.to)
          : p.lastActiveOn >= filter.from && p.lastActiveOn <= filter.to,
      )
      .filter((p) => afterId === null || p.userId > afterId)
      .sort((a, b) => a.userId.localeCompare(b.userId))
      .slice(0, limit);
  }
}
