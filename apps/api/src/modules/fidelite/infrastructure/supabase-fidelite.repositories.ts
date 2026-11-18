import type { Locale } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check, iso } from '../../../persistence/supabase';
import type { FideliteFilter, FidelitePeople, FidelitePerson, LifecycleLog } from '../ports';

const PAGE = 200;

/** `lifecycle_messages` : une ligne par (personne, clé) ; la clé primaire fait l'idempotence. */
export class SupabaseLifecycleLog implements LifecycleLog {
  constructor(private readonly client: Db) {}

  async claim(userId: string, key: string, at: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('lifecycle_messages')
      .upsert({ user_id: userId, key, sent_at: at }, { onConflict: 'user_id,key', ignoreDuplicates: true })
      .select('key');
    // Personne supprimée entre-temps (clé étrangère) : rien à envoyer.
    if (error?.code === '23503') return false;
    check(error, 'journal des messages de fidélisation');
    return (data ?? []).length > 0;
  }

  async keys(userIds: readonly string[]): Promise<Map<string, Set<string>>> {
    const out = new Map(userIds.map((id) => [id, new Set<string>()]));
    for (let i = 0; i < userIds.length; i += PAGE) {
      const { data, error } = await this.client.from('lifecycle_messages').select('user_id, key').in('user_id', [...userIds.slice(i, i + PAGE)]);
      check(error, 'journal des messages de fidélisation');
      for (const r of data ?? []) out.get(r.user_id)?.add(r.key);
    }
    return out;
  }

  async purge(before: string): Promise<number> {
    const { count, error } = await this.client.from('lifecycle_messages').delete({ count: 'exact' }).lt('sent_at', before);
    check(error, 'purge du journal de fidélisation');
    return count ?? 0;
  }
}

/** Lit `profiles` (index `profiles_created_idx` et `profiles_last_active_idx`). */
export class SupabaseFidelitePeople implements FidelitePeople {
  constructor(private readonly client: Db) {}

  async page(filter: FideliteFilter, afterId: string | null, limit: number): Promise<FidelitePerson[]> {
    let q = this.client.from('profiles').select('id, locale, display_name, created_at, last_active_on, review_world');
    q = filter.by === 'created' ? q.gte('created_at', filter.from).lte('created_at', filter.to) : q.gte('last_active_on', filter.from).lte('last_active_on', filter.to);
    if (afterId !== null) q = q.gt('id', afterId);
    const { data, error } = await q.order('id').limit(limit);
    check(error, 'personnes à qui donner des nouvelles');
    return (data ?? []).map((r) => ({
      userId: r.id,
      locale: r.locale as Locale,
      displayName: r.display_name,
      createdAt: iso(r.created_at),
      lastActiveOn: r.last_active_on,
      reviewWorld: r.review_world,
    }));
  }
}
