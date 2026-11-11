import type { MemoryDb } from '../../../persistence/memory-db';
import type { WordVotesRepository } from '../ports';

export class MemoryWordVotesRepository implements WordVotesRepository {
  constructor(private readonly db: MemoryDb) {}

  async add(vote: { targetUser: string; words: readonly string[]; voterHash: string; createdAt: string }): Promise<boolean> {
    if (this.db.wordVotes.some((v) => v.targetUser === vote.targetUser && v.voterHash === vote.voterHash)) return false;
    this.db.wordVotes.push({ ...vote, words: [...vote.words] });
    return true;
  }

  async count(targetUser: string): Promise<number> {
    return this.db.wordVotes.filter((v) => v.targetUser === targetUser).length;
  }
}
