/** Adaptateurs du port `SeedStore` : base mémoire (local, tests) et Supabase (projet de test ou de préproduction). */
import type { Db } from '../../persistence/database.types';
import type { MemoryDb } from '../../persistence/memory-db';
import { check } from '../../persistence/supabase';
import { SEED_DOMAIN, SEED_ID_PREFIX, isSeedEmail, isSeedId } from './guards';
import type { SeedStore } from './ports';

const already = (message: string): boolean => /already|exists|registered|duplicate/i.test(message);

export class MemorySeedStore implements SeedStore {
  constructor(private readonly db: MemoryDb) {}

  async countForeignAccounts(isExpected: (email: string | null) => boolean, stopAfter: number): Promise<number> {
    const ids = new Set([...this.db.authEmails.keys(), ...this.db.profiles.keys()]);
    let n = 0;
    for (const id of ids) {
      if (!isExpected(this.db.authEmails.get(id) ?? null) && ++n > stopAfter) break;
    }
    return n;
  }

  async ensureAccount(id: string, email: string): Promise<void> {
    this.db.deletedUsers.delete(id);
    this.db.authEmails.set(id, email);
  }

  async seedAccountIds(): Promise<string[]> {
    return [...this.db.authEmails].filter(([, email]) => isSeedEmail(email)).map(([id]) => id);
  }

  async accountIdByEmail(email: string): Promise<string | null> {
    const wanted = email.trim().toLowerCase();
    return [...this.db.authEmails].find(([, e]) => e.toLowerCase() === wanted)?.[0] ?? null;
  }

  async removeAccount(id: string): Promise<void> {
    this.db.deleteUser(id);
  }

  async detachFromWorld(world: string, keep: (id: string) => boolean): Promise<number> {
    let n = 0;
    for (const p of this.db.profiles.values()) {
      if (p.reviewWorld === world && p.id !== world && !keep(p.id)) {
        this.db.profiles.set(p.id, { ...p, reviewWorld: null });
        n++;
      }
    }
    return n;
  }

  async removeGroupsCreatedBy(ids: readonly string[]): Promise<number> {
    const creators = new Set(ids);
    const groups = new Set([...this.db.groups.values()].filter((g) => g.createdBy !== null && creators.has(g.createdBy)).map((g) => g.id));
    for (const id of groups) {
      this.db.groups.delete(id);
      this.db.groupInviteCodes.delete(id);
    }
    for (const [k, m] of this.db.groupMembers) if (groups.has(m.groupId)) this.db.groupMembers.delete(k);
    for (let i = this.db.groupMessages.length - 1; i >= 0; i--) if (groups.has(this.db.groupMessages[i]?.groupId ?? '')) this.db.groupMessages.splice(i, 1);
    for (const [k, day] of this.db.groupDays) if (groups.has(day.groupId)) this.db.groupDays.delete(k);
    for (const p of this.db.togetherProposals.values()) if (p.groupId && groups.has(p.groupId)) p.groupId = null;
    for (const r of this.db.reports) if (r.groupId && groups.has(r.groupId)) r.groupId = null;
    return groups.size;
  }

  async removeSeedSignups(): Promise<number> {
    const gone = new Set([...this.db.quartierSignups.values()].filter((s) => isSeedId(s.id) || isSeedEmail(s.email)).map((s) => s.id));
    for (const id of gone) this.db.quartierSignups.delete(id);
    for (const s of this.db.quartierSignups.values()) if (s.invitedBySignup && gone.has(s.invitedBySignup)) s.invitedBySignup = null;
    for (let i = this.db.quartierFounders.length - 1; i >= 0; i--) {
      const f = this.db.quartierFounders[i];
      if (f?.signupId && gone.has(f.signupId)) this.db.quartierFounders.splice(i, 1);
    }
    return gone.size;
  }

  async removeEmptySeedZones(createdAt: string): Promise<number> {
    const used = new Set([...this.db.quartierSignups.values()].map((s) => s.zone));
    let n = 0;
    for (const [zone, z] of this.db.quartiers) {
      if (z.createdAt === createdAt && !used.has(zone)) {
        this.db.quartiers.delete(zone);
        for (let i = this.db.quartierFounders.length - 1; i >= 0; i--) if (this.db.quartierFounders[i]?.zone === zone) this.db.quartierFounders.splice(i, 1);
        n++;
      }
    }
    return n;
  }
}

const PAGE = 1000;
const CHUNK = 100;
const chunks = <T>(list: readonly T[]): T[][] => Array.from({ length: Math.ceil(list.length / CHUNK) }, (_, i) => list.slice(i * CHUNK, (i + 1) * CHUNK));

export class SupabaseSeedStore implements SeedStore {
  constructor(private readonly client: Db) {}

  /** Tous les comptes d'authentification, page par page (l'arrêt anticipé est laissé à `visit`). */
  private async eachUser(visit: (u: { id: string; email: string | null }) => boolean | void): Promise<void> {
    for (let page = 1; ; page++) {
      const { data, error } = await this.client.auth.admin.listUsers({ page, perPage: PAGE });
      check(error, 'comptes (lecture)');
      const users = data.users ?? [];
      for (const u of users) if (visit({ id: u.id, email: u.email ?? null }) === false) return;
      if (users.length < PAGE) return;
    }
  }

  async countForeignAccounts(isExpected: (email: string | null) => boolean, stopAfter: number): Promise<number> {
    let n = 0;
    await this.eachUser((u) => {
      if (!isExpected(u.email)) n++;
      return n <= stopAfter;
    });
    return n;
  }

  async ensureAccount(id: string, email: string): Promise<void> {
    const { error } = await this.client.auth.admin.createUser({ id, email, email_confirm: true, ban_duration: '876000h', app_metadata: { blowy_seed: true } });
    if (error && !already(error.message)) throw new Error(`compte du semis non créé : ${error.message}`);
  }

  async seedAccountIds(): Promise<string[]> {
    const ids: string[] = [];
    await this.eachUser((u) => {
      if (isSeedEmail(u.email)) ids.push(u.id);
    });
    return ids;
  }

  async accountIdByEmail(email: string): Promise<string | null> {
    const wanted = email.trim().toLowerCase();
    let found: string | null = null;
    await this.eachUser((u) => {
      if (u.email?.toLowerCase() === wanted) found = u.id;
      return found === null;
    });
    return found;
  }

  async removeAccount(id: string): Promise<void> {
    const { error } = await this.client.auth.admin.deleteUser(id);
    if (error && !/not.?found/i.test(error.message)) throw new Error(`compte du semis non supprimé : ${error.message}`);
  }

  async detachFromWorld(world: string, keep: (id: string) => boolean): Promise<number> {
    const { data, error } = await this.client.from('profiles').select('id').eq('review_world', world);
    check(error, 'monde du semis (lecture)');
    const ids = (data ?? []).map((r) => r.id).filter((id) => id !== world && !keep(id));
    for (const part of chunks(ids)) {
      const res = await this.client.from('profiles').update({ review_world: null }).in('id', part);
      check(res.error, 'monde du semis (détachement)');
    }
    return ids.length;
  }

  async removeGroupsCreatedBy(ids: readonly string[]): Promise<number> {
    let n = 0;
    for (const part of chunks(ids)) {
      const { data, error } = await this.client.from('groups').delete().in('created_by', part).select('id');
      check(error, 'groupes du semis (suppression)');
      n += data?.length ?? 0;
    }
    return n;
  }

  async removeSeedSignups(): Promise<number> {
    // Liens d'invitation entre inscriptions : `on delete set null` ; fondateurs : cascade.
    const byId = await this.client
      .from('quartier_signups')
      .delete()
      .gte('id', `${SEED_ID_PREFIX}0000-0000-0000-000000000000`)
      .lte('id', `${SEED_ID_PREFIX}ffff-ffff-ffff-ffffffffffff`)
      .select('id');
    check(byId.error, 'inscriptions du semis (suppression)');
    const byEmail = await this.client.from('quartier_signups').delete().like('email', `%@${SEED_DOMAIN}`).select('id');
    check(byEmail.error, 'inscriptions du semis (suppression par adresse)');
    return (byId.data?.length ?? 0) + (byEmail.data?.length ?? 0);
  }

  async removeEmptySeedZones(createdAt: string): Promise<number> {
    const { data, error } = await this.client.from('quartiers').select('zone').eq('created_at', createdAt);
    check(error, 'quartiers du semis (lecture)');
    const zones = (data ?? []).map((r) => r.zone);
    let n = 0;
    for (const part of chunks(zones)) {
      const used = await this.client.from('quartier_signups').select('zone').in('zone', part);
      check(used.error, 'quartiers du semis (inscriptions)');
      const busy = new Set((used.data ?? []).map((r) => r.zone));
      const empty = part.filter((z) => !busy.has(z));
      if (empty.length === 0) continue;
      const res = await this.client.from('quartiers').delete().in('zone', empty).eq('created_at', createdAt).select('zone');
      check(res.error, 'quartiers du semis (suppression)');
      n += res.data?.length ?? 0;
    }
    return n;
  }
}
