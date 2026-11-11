import type { MemoryDb } from '../../../persistence/memory-db';
import type { MessageRecord, MessagesRepository } from '../ports';

const newestFirst = (a: MessageRecord, b: MessageRecord): number => b.createdAt.localeCompare(a.createdAt);

export class MemoryMessagesRepository implements MessagesRepository {
  constructor(private readonly db: MemoryDb) {}

  async add(messages: readonly MessageRecord[]): Promise<void> {
    for (const m of messages) this.db.messages.push({ ...m });
  }

  async page(linkId: string, before: string | null, limit: number): Promise<MessageRecord[]> {
    return this.ofLink(linkId)
      .filter((m) => before === null || m.createdAt < before)
      .sort(newestFirst)
      .slice(0, limit)
      .map((m) => ({ ...m }));
  }

  async latest(linkId: string): Promise<MessageRecord | null> {
    const [first] = this.ofLink(linkId).sort(newestFirst);
    return first ? { ...first } : null;
  }

  async countUnread(linkId: string, userId: string, after: string | null): Promise<number> {
    return this.ofLink(linkId).filter((m) => m.authorId !== userId && (after === null || m.createdAt > after)).length;
  }

  async countUserMessages(linkId: string): Promise<number> {
    return this.ofLink(linkId).filter((m) => m.authorKind === 'user' && m.kind === 'text').length;
  }

  private ofLink(linkId: string): MessageRecord[] {
    return this.db.messages.filter((m) => m.linkId === linkId);
  }
}
