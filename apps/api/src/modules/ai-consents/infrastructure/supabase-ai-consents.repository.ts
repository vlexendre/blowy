import type { Db } from '../../../persistence/database.types';
import { check, iso } from '../../../persistence/supabase';
import type { AiConsentRecord, AiConsentsRepository } from '../ports';

/** Colonnes `profiles.ai_proofs_consent` et `ai_proofs_consent_at` (migration 20261115210000_audit_app). */
export class SupabaseAiConsentsRepository implements AiConsentsRepository {
  constructor(private readonly client: Db) {}

  async proofs(userId: string): Promise<AiConsentRecord> {
    const { data, error } = await this.client.from('profiles').select('ai_proofs_consent, ai_proofs_consent_at').eq('id', userId).maybeSingle();
    check(error, 'accord IA des preuves');
    return { consent: data?.ai_proofs_consent ?? null, at: data?.ai_proofs_consent_at ? iso(data.ai_proofs_consent_at) : null };
  }

  async setProofs(userId: string, consent: boolean, at: string): Promise<void> {
    const { error } = await this.client.from('profiles').update({ ai_proofs_consent: consent, ai_proofs_consent_at: at }).eq('id', userId);
    check(error, 'accord IA des preuves');
  }
}
