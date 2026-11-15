import type { MemoryDb } from '../../../persistence/memory-db';
import type { AiConsentRecord, AiConsentsRepository } from '../ports';

export class MemoryAiConsentsRepository implements AiConsentsRepository {
  constructor(private readonly db: MemoryDb) {}

  async proofs(userId: string): Promise<AiConsentRecord> {
    const row = this.db.aiProofsConsents.get(userId);
    return row ? { consent: row.consent, at: row.at } : { consent: null, at: null };
  }

  async setProofs(userId: string, consent: boolean, at: string): Promise<void> {
    if (!this.db.profiles.has(userId)) return;
    this.db.aiProofsConsents.set(userId, { consent, at });
  }
}
