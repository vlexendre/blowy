import { NO_ACTIVITY, type LifetimeStats, type WeekActivity } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check } from '../../../persistence/supabase';
import type { ProgressionReader } from '../ports';

/** Au plus autant de lignes lues par compteur de la semaine (une ligue = 20 personnes). */
const WEEK_ROWS = 20_000;

export class SupabaseProgressionReader implements ProgressionReader {
  constructor(private readonly client: Db) {}

  async lifetime(userId: string): Promise<Omit<LifetimeStats, 'bestStreak'>> {
    const [waves, messages, links, progress] = await Promise.all([
      this.client.from('encounters').select('id', { count: 'exact', head: true }).eq('from_user', userId),
      this.client.from('messages').select('id', { count: 'exact', head: true }).eq('author_kind', 'user').eq('author_id', userId),
      this.client.from('links').select('user_a, user_b').or(`user_a.eq.${userId},user_b.eq.${userId}`).limit(1000),
      this.client.from('chemin_progress').select('sessions_done').eq('user_id', userId).maybeSingle(),
    ]);
    check(waves.error, 'progression : bonjours');
    check(messages.error, 'progression : messages');
    check(links.error, 'progression : liens');
    check(progress.error, 'progression : séances');
    const others = (links.data ?? []).map((l) => (l.user_a === userId ? l.user_b : l.user_a));
    let places = 0;
    if (others.length > 0) {
      const { data, error } = await this.client.from('profile_places').select('home_cell').in('user_id', others);
      check(error, 'progression : zones');
      places = new Set((data ?? []).map((r) => r.home_cell)).size;
    }
    return { waves: waves.count ?? 0, messages: messages.count ?? 0, links: others.length, sessions: progress.data?.sessions_done ?? 0, places };
  }

  async week(userIds: readonly string[], since: string): Promise<Map<string, WeekActivity>> {
    const out = new Map(userIds.map((id) => [id, { ...NO_ACTIVITY }]));
    if (userIds.length === 0) return out;
    const ids = [...userIds];
    const list = ids.join(',');
    const [msgs, waves, sessions, links] = await Promise.all([
      this.client.from('messages').select('author_id').eq('author_kind', 'user').in('author_id', ids).gte('created_at', since).limit(WEEK_ROWS),
      this.client.from('encounters').select('from_user').in('from_user', ids).gte('created_at', since).limit(WEEK_ROWS),
      this.client.from('chemin_sessions').select('user_id').in('user_id', ids).gte('completed_at', since).limit(WEEK_ROWS),
      this.client.from('links').select('user_a, user_b').or(`user_a.in.(${list}),user_b.in.(${list})`).gte('created_at', since).limit(WEEK_ROWS),
    ]);
    check(msgs.error, 'ligue : messages');
    check(waves.error, 'ligue : bonjours');
    check(sessions.error, 'ligue : séances');
    check(links.error, 'ligue : liens');
    for (const r of msgs.data ?? []) { const a = r.author_id ? out.get(r.author_id) : undefined; if (a) a.messages++; }
    for (const r of waves.data ?? []) { const a = out.get(r.from_user); if (a) a.waves++; }
    for (const r of sessions.data ?? []) { const a = out.get(r.user_id); if (a) a.sessions++; }
    for (const r of links.data ?? []) for (const id of [r.user_a, r.user_b]) { const a = out.get(id); if (a) a.links++; }
    return out;
  }

  async neighbours(userId: string, limit: number): Promise<string[]> {
    const { data: me, error } = await this.client.from('profile_places').select('home_cell').eq('user_id', userId).maybeSingle();
    check(error, 'ligue : zone');
    if (!me) return [];
    const { data, error: e2 } = await this.client.from('profile_places').select('user_id').eq('home_cell', me.home_cell).neq('user_id', userId).order('user_id').limit(limit * 3);
    check(e2, 'ligue : voisins');
    return [userId, ...(data ?? []).map((r) => r.user_id)];
  }
}
