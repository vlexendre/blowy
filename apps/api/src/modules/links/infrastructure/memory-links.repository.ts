import type { MemoryDb } from '../../../persistence/memory-db';
import type { Day } from '@blowy/domain';
import type { LinkRecord, LinksRepository } from '../ports';

export class MemoryLinksRepository implements LinksRepository {
  constructor(private readonly db: MemoryDb) {}

  async findById(id: string): Promise<LinkRecord | null> {
    const l = this.db.links.get(id);
    return l ? { ...l } : null;
  }

  async findBetween(userA: string, userB: string): Promise<LinkRecord | null> {
    for (const l of this.db.links.values()) if (l.userA === userA && l.userB === userB) return { ...l };
    return null;
  }

  async listForUsers(userIds: readonly string[]): Promise<LinkRecord[]> {
    const wanted = new Set(userIds);
    return [...this.db.links.values()].filter((l) => wanted.has(l.userA) || wanted.has(l.userB)).map((l) => ({ ...l }));
  }

  async create(link: LinkRecord): Promise<LinkRecord | null> {
    if (link.userA >= link.userB) throw new Error('user_a doit précéder user_b');
    if (await this.findBetween(link.userA, link.userB)) return null;
    this.db.links.set(link.id, { ...link });
    return { ...link };
  }

  async save(link: LinkRecord): Promise<void> {
    if (!this.db.links.has(link.id)) throw new Error('lien introuvable');
    this.db.links.set(link.id, { ...link });
  }

  async listDueForTick(today: Day, limit: number): Promise<LinkRecord[]> {
    return [...this.db.links.values()]
      .filter((l) => l.status === 'active' && l.lastTickOn < today)
      .sort((a, b) => a.lastTickOn.localeCompare(b.lastTickOn) || a.id.localeCompare(b.id))
      .slice(0, limit)
      .map((l) => ({ ...l }));
  }

  async listForWriteReminder(today: Day, limit: number): Promise<LinkRecord[]> {
    return [...this.db.links.values()]
      .filter((l) => l.status === 'active' && l.lastActiveOn === today && (this.db.linkWriteReminders.get(l.id) ?? '') < today)
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, limit)
      .map((l) => ({ ...l }));
  }

  async markWriteReminder(ids: readonly string[], today: Day): Promise<void> {
    for (const id of ids) if (this.db.links.has(id)) this.db.linkWriteReminders.set(id, today);
  }

  async pageForUser(userId: string, after: string | null, limit: number): Promise<LinkRecord[]> {
    return [...this.db.links.values()]
      .filter((l) => (l.userA === userId || l.userB === userId) && l.status !== 'archived' && (after === null || l.id > after))
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, limit)
      .map((l) => ({ ...l }));
  }
}
