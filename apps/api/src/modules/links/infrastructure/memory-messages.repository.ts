import type { MemoryDb } from '../../../persistence/memory-db';
import type { MessageRecord, MessagesRepository } from '../ports';

const newestFirst = (a: MessageRecord, b: MessageRecord): number => b.createdAt.localeCompare(a.createdAt);
const visibleBy = (m: MessageRecord, userId: string): boolean => !m.visibleTo || m.visibleTo === userId;

export class MemoryMessagesRepository implements MessagesRepository {
  constructor(private readonly db: MemoryDb) {}

  async add(messages: readonly MessageRecord[]): Promise<void> {
    for (const m of messages) this.db.messages.push({ ...m });
  }

  async page(linkId: string, before: string | null, limit: number, viewerId: string): Promise<MessageRecord[]> {
    return this.ofLink(linkId)
      .filter((m) => visibleBy(m, viewerId) && (before === null || m.createdAt < before))
      .sort(newestFirst)
      .slice(0, limit)
      .map((m) => ({ ...m }));
  }

  async latest(linkId: string, viewerId: string): Promise<MessageRecord | null> {
    const [first] = this.ofLink(linkId)
      .filter((m) => visibleBy(m, viewerId))
      .sort(newestFirst);
    return first ? { ...first } : null;
  }

  async countUnread(linkId: string, userId: string, after: string | null): Promise<number> {
    return this.ofLink(linkId).filter((m) => m.authorId !== userId && visibleBy(m, userId) && (after === null || m.createdAt > after)).length;
  }

  async countUserMessages(linkId: string): Promise<number> {
    return this.ofLink(linkId).filter((m) => m.authorKind === 'user' && m.kind === 'text').length;
  }

  async recentUserTexts(linkId: string, limit: number): Promise<MessageRecord[]> {
    return this.ofLink(linkId)
      .filter((m) => m.authorKind === 'user' && m.kind === 'text')
      .sort(newestFirst)
      .slice(0, limit)
      .map((m) => ({ ...m }));
  }

  async countUserTextsSince(linkId: string, since: string): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    for (const m of this.ofLink(linkId)) {
      if (m.authorKind !== 'user' || m.kind !== 'text' || m.createdAt < since || m.authorId === null) continue;
      out.set(m.authorId, (out.get(m.authorId) ?? 0) + 1);
    }
    return out;
  }

  private ofLink(linkId: string): MessageRecord[] {
    return this.db.messages.filter((m) => m.linkId === linkId);
  }
}
