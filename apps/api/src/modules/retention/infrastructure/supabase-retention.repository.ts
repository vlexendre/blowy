import type { Day } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check } from '../../../persistence/supabase';
import type { InactiveAccount, RetentionRepository } from '../ports';

const PAGE = 200;

/** `profiles.last_active_on` / `inactivity_noticed_on` (index `profiles_last_active_idx`), `banned_identities`. */
export class SupabaseRetentionRepository implements RetentionRepository {
  constructor(private readonly client: Db) {}

  async touch(userId: string, day: Day): Promise<void> {
    // Sans effet si le jour est déjà noté (ou si le profil n'existe pas encore : inscription en cours).
    const { error } = await this.client.from('profiles').update({ last_active_on: day, inactivity_noticed_on: null }).eq('id', userId).lt('last_active_on', day);
    check(error, 'dernier jour d’activité');
  }

  async lastActiveOn(userId: string): Promise<Day | null> {
    const { data, error } = await this.client.from('profiles').select('last_active_on').eq('id', userId).maybeSingle();
    check(error, 'dernier jour d’activité');
    return data?.last_active_on ?? null;
  }

  async listToNotice(cutoff: Day, limit: number): Promise<InactiveAccount[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, last_active_on, inactivity_noticed_on')
      .lte('last_active_on', cutoff)
      .is('inactivity_noticed_on', null)
      .order('last_active_on')
      .limit(limit);
    check(error, 'comptes inactifs');
    return (data ?? []).map((r) => ({ userId: r.id, lastActiveOn: r.last_active_on, noticedOn: r.inactivity_noticed_on }));
  }

  async listToDelete(cutoff: Day, noticedBy: Day, limit: number): Promise<InactiveAccount[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, last_active_on, inactivity_noticed_on')
      .lte('last_active_on', cutoff)
      .lte('inactivity_noticed_on', noticedBy)
      .order('last_active_on')
      .limit(limit);
    check(error, 'comptes inactifs');
    return (data ?? []).map((r) => ({ userId: r.id, lastActiveOn: r.last_active_on, noticedOn: r.inactivity_noticed_on }));
  }

  async markNoticed(userIds: readonly string[], day: Day): Promise<void> {
    for (let i = 0; i < userIds.length; i += PAGE) {
      const { error } = await this.client.from('profiles').update({ inactivity_noticed_on: day }).in('id', [...userIds.slice(i, i + PAGE)]);
      check(error, 'prévenance');
    }
  }

  async addBans(hashes: readonly string[], at: string, until: string): Promise<void> {
    if (hashes.length === 0) return;
    const { error } = await this.client.from('banned_identities').upsert(
      hashes.map((hash) => ({ hash, banned_at: at, until })),
      { onConflict: 'hash' },
    );
    check(error, 'exclusion');
  }

  async isBanned(hashes: readonly string[], now: string): Promise<boolean> {
    if (hashes.length === 0) return false;
    const { data, error } = await this.client.from('banned_identities').select('hash').in('hash', [...hashes]).gt('until', now).limit(1);
    check(error, 'lecture des exclusions');
    return (data ?? []).length > 0;
  }

  async purgeBans(now: string): Promise<number> {
    const { data, error } = await this.client.from('banned_identities').delete().lte('until', now).select('hash');
    check(error, 'purge des exclusions');
    return (data ?? []).length;
  }

  async purgeClosedReports(before: string): Promise<number> {
    const { data, error } = await this.client.from('reports').delete().lt('handled_at', before).select('id');
    check(error, 'purge des signalements');
    return (data ?? []).length;
  }

  async purgeAuditLog(before: string): Promise<number> {
    const { data, error } = await this.client.from('admin_audit_log').delete().lt('at', before).select('id');
    check(error, 'purge du journal de modération');
    return (data ?? []).length;
  }
}
