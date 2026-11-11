import type { SupabaseClient } from '@supabase/supabase-js';
import { check, isUniqueViolation } from '../../../persistence/supabase';
import type { WordVotesRepository } from '../ports';

export class SupabaseWordVotesRepository implements WordVotesRepository {
  constructor(private readonly client: SupabaseClient) {}

  async add(vote: { targetUser: string; words: readonly string[]; voterHash: string; createdAt: string }): Promise<boolean> {
    const { error } = await this.client
      .from('word_votes')
      .insert({ target_user: vote.targetUser, words: [...vote.words], voter_hash: vote.voterHash, created_at: vote.createdAt });
    if (isUniqueViolation(error)) return false;
    check(error, 'enregistrement du vote');
    return true;
  }

  async count(targetUser: string): Promise<number> {
    const { count, error } = await this.client.from('word_votes').select('id', { count: 'exact', head: true }).eq('target_user', targetUser);
    check(error, 'comptage des votes');
    return count ?? 0;
  }
}
