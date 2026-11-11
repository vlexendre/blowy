import type { MemoryDb } from '../../../persistence/memory-db';
import type { LinkReadsRepository } from '../ports';

export class MemoryLinkReadsRepository implements LinkReadsRepository {
  constructor(private readonly db: MemoryDb) {}

  async lastReadAt(linkId: string, userId: string): Promise<string | null> {
    return this.db.linkReads.get(`${linkId}:${userId}`) ?? null;
  }

  async markRead(linkId: string, userId: string, at: string): Promise<void> {
    this.db.linkReads.set(`${linkId}:${userId}`, at);
  }
}
