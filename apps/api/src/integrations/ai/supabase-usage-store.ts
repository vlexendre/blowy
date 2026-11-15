import type { AiFeatureKey, AiTier, Day } from '@blowy/domain';
import type { Db } from '../../persistence/database.types';
import { check } from '../../persistence/supabase';
import type { AiUsageEntry, AiUsageRecord, AiUsageStore } from './usage-store';

/** Compteurs atomiques par fonctions SQL (`ai_take_user_call`, `ai_record_usage`, migration plateforme). */
export class SupabaseAiUsageStore implements AiUsageStore {
  constructor(private readonly client: Db) {}

  async spentMicros(day: Day): Promise<number> {
    const { data, error } = await this.client.from('ai_usage_daily').select('cost_micros').eq('day', day);
    check(error, 'lecture de la dépense IA');
    return (data ?? []).reduce((sum, r) => sum + Number(r.cost_micros), 0);
  }

  async userCalls(userId: string, day: Day, feature: AiFeatureKey): Promise<number> {
    const { data, error } = await this.client.from('ai_user_calls').select('calls').eq('user_id', userId).eq('day', day).eq('feature', feature).maybeSingle();
    check(error, 'lecture du budget IA');
    return data?.calls ?? 0;
  }

  async takeUserCall(userId: string, day: Day, feature: AiFeatureKey, max: number): Promise<boolean> {
    const { data, error } = await this.client.rpc('ai_take_user_call', { p_user: userId, p_day: day, p_feature: feature, p_max: max });
    check(error, 'budget IA');
    return data === true;
  }

  async record(e: AiUsageEntry): Promise<void> {
    const { error } = await this.client.rpc('ai_record_usage', {
      p_day: e.day,
      p_feature: e.feature,
      p_tier: e.tier,
      p_calls: e.outcome === 'declined' ? 0 : 1,
      p_declined: e.outcome === 'declined' ? 1 : 0,
      p_errors: e.outcome === 'error' ? 1 : 0,
      p_input: e.usage.input,
      p_output: e.usage.output,
      p_cache_write: e.usage.cacheWrite,
      p_cache_read: e.usage.cacheRead,
      p_cost_micros: e.costMicros,
    });
    check(error, 'compteur IA');
  }

  async list(from: Day, to: Day): Promise<AiUsageRecord[]> {
    const { data, error } = await this.client
      .from('ai_usage_daily')
      .select('*')
      .gte('day', from)
      .lte('day', to)
      .order('day', { ascending: false })
      .order('feature')
      .order('tier')
      .limit(2000);
    check(error, "lecture de l'usage IA");
    return (data ?? []).map((r) => ({
      day: r.day,
      feature: r.feature,
      tier: r.tier as AiTier,
      calls: r.calls,
      declined: r.declined,
      errors: r.errors,
      inputTokens: Number(r.input_tokens),
      outputTokens: Number(r.output_tokens),
      cacheWriteTokens: Number(r.cache_write_tokens),
      cacheReadTokens: Number(r.cache_read_tokens),
      costMicros: Number(r.cost_micros),
    }));
  }

  async purgeUserCalls(before: Day): Promise<number> {
    const { count, error } = await this.client.from('ai_user_calls').delete({ count: 'exact' }).lt('day', before);
    check(error, 'ménage des budgets IA');
    return count ?? 0;
  }
}
