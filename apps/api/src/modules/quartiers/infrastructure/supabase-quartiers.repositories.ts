import type { Gauges, Locale, QuizTrait, Species, ZoneInvite } from '@blowy/domain';
import type { Database, Db } from '../../../persistence/database.types';
import { check, iso, isoOrNull, isUniqueViolation } from '../../../persistence/supabase';
import type {
  FounderRecord,
  QuartiersRepository,
  QuizRecord,
  QuizResultsRepository,
  SignupRecord,
  ZoneCounts,
  ZoneRecord,
} from '../ports';

type SignupRow = Database['public']['Tables']['quartier_signups']['Row'];
type ZoneRow = Database['public']['Tables']['quartiers']['Row'];

/** Lignes lues par page (PostgREST limite chaque réponse). */
const PAGE = 1000;

export class SupabaseQuizResultsRepository implements QuizResultsRepository {
  constructor(private readonly client: Db) {}
  async create(r: QuizRecord): Promise<boolean> {
    const { error } = await this.client.from('quiz_results').insert({
      code: r.code,
      species: r.species,
      trait: r.trait,
      second_trait: r.second,
      gauges: r.gauges,
      ref: r.ref,
      locale: r.locale,
      created_at: r.createdAt,
    });
    if (isUniqueViolation(error)) return false;
    check(error, 'résultat du quiz');
    return true;
  }
  async find(code: string): Promise<QuizRecord | null> {
    const { data, error } = await this.client.from('quiz_results').select('*').eq('code', code).maybeSingle();
    check(error, 'lecture du résultat du quiz');
    return data
      ? {
          code: data.code,
          species: data.species as Species,
          trait: data.trait as QuizTrait,
          second: data.second_trait as QuizTrait | null,
          gauges: data.gauges as unknown as Gauges,
          ref: data.ref,
          locale: data.locale as Locale,
          createdAt: iso(data.created_at),
        }
      : null;
  }
  async purgeBefore(at: string): Promise<number> {
    const { data, error } = await this.client.from('quiz_results').delete().lt('created_at', at).select('code');
    check(error, 'effacement des résultats du quiz');
    return (data ?? []).length;
  }
}

const zoneFromRow = (r: ZoneRow): ZoneRecord => ({
  zone: r.zone,
  openedAt: isoOrNull(r.opened_at),
  openedBy: (r.opened_by as ZoneRecord['openedBy']) ?? null,
  createdAt: iso(r.created_at),
});

const signupFromRow = (r: SignupRow): SignupRecord => ({
  id: r.id,
  zone: r.zone,
  email: r.email,
  locale: r.locale as Locale,
  code: r.code,
  token: r.token,
  invitedByUser: r.invited_by_user,
  invitedBySignup: r.invited_by_signup,
  consentAt: iso(r.consent_at),
  confirmedAt: isoOrNull(r.confirmed_at),
  unsubscribedAt: isoOrNull(r.unsubscribed_at),
  openMailSentAt: isoOrNull(r.open_mail_sent_at),
  userId: r.user_id,
  createdAt: iso(r.created_at),
});

export class SupabaseQuartiersRepository implements QuartiersRepository {
  constructor(private readonly client: Db) {}

  async threshold(): Promise<number> {
    const { data, error } = await this.client.from('quartier_settings').select('threshold').eq('id', true).maybeSingle();
    check(error, 'seuil des quartiers');
    return data?.threshold ?? 50;
  }
  async setThreshold(threshold: number, at: string): Promise<void> {
    const { error } = await this.client.from('quartier_settings').upsert({ id: true, threshold, updated_at: at }, { onConflict: 'id' });
    check(error, 'seuil des quartiers');
  }
  async findZone(zone: string): Promise<ZoneRecord | null> {
    const { data, error } = await this.client.from('quartiers').select('*').eq('zone', zone).maybeSingle();
    check(error, 'quartier');
    return data ? zoneFromRow(data) : null;
  }
  async ensureZone(zone: string, at: string): Promise<ZoneRecord> {
    const { error } = await this.client.from('quartiers').upsert({ zone, created_at: at }, { onConflict: 'zone', ignoreDuplicates: true });
    check(error, 'création du quartier');
    const z = await this.findZone(zone);
    if (!z) throw new Error('quartier introuvable après création');
    return z;
  }
  async listZones(): Promise<ZoneRecord[]> {
    const { data, error } = await this.client.from('quartiers').select('*').order('created_at').limit(5000);
    check(error, 'liste des quartiers');
    return (data ?? []).map(zoneFromRow);
  }
  async open(zone: string, at: string, by: 'threshold' | 'admin'): Promise<boolean> {
    const { data, error } = await this.client.from('quartiers').update({ opened_at: at, opened_by: by }).eq('zone', zone).is('opened_at', null).select('zone');
    check(error, 'ouverture du quartier');
    return (data ?? []).length > 0;
  }
  async counts(zones: readonly string[]): Promise<Map<string, ZoneCounts>> {
    const out = new Map<string, ZoneCounts>(zones.map((z) => [z, { confirmed: 0, pending: 0, notified: 0, founders: 0 }]));
    if (zones.length === 0) return out;
    // Lecture par pages de colonnes légères (pas d'adresse) : quelques milliers de lignes au lancement.
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.client
        .from('quartier_signups')
        .select('zone, confirmed_at, unsubscribed_at, open_mail_sent_at')
        .in('zone', [...zones])
        .order('id')
        .range(from, from + PAGE - 1);
      check(error, 'compteurs des quartiers');
      for (const r of data ?? []) {
        const c = out.get(r.zone);
        if (!c) continue;
        if (!r.unsubscribed_at) c.pending += 1;
        if (!r.unsubscribed_at && r.confirmed_at) c.confirmed += 1;
        if (r.open_mail_sent_at) c.notified += 1;
      }
      if ((data ?? []).length < PAGE) break;
    }
    const { data: f, error } = await this.client.from('quartier_founders').select('zone').in('zone', [...zones]);
    check(error, 'fondateurs des quartiers');
    for (const r of f ?? []) {
      const c = out.get(r.zone);
      if (c) c.founders += 1;
    }
    return out;
  }
  async findSignup(by: { email?: string; token?: string; code?: string; id?: string }): Promise<SignupRecord | null> {
    let q = this.client.from('quartier_signups').select('*');
    if (by.id) q = q.eq('id', by.id);
    else if (by.email) q = q.eq('email', by.email);
    else if (by.token) q = q.eq('token', by.token);
    else if (by.code) q = q.eq('code', by.code);
    else return null;
    const { data, error } = await q.maybeSingle();
    check(error, 'inscription au quartier');
    return data ? signupFromRow(data) : null;
  }
  async createSignup(s: SignupRecord): Promise<boolean> {
    const { error } = await this.client.from('quartier_signups').insert({
      id: s.id,
      zone: s.zone,
      email: s.email,
      locale: s.locale,
      code: s.code,
      token: s.token,
      invited_by_user: s.invitedByUser,
      invited_by_signup: s.invitedBySignup,
      consent_at: s.consentAt,
      confirmed_at: s.confirmedAt,
      unsubscribed_at: s.unsubscribedAt,
      open_mail_sent_at: s.openMailSentAt,
      user_id: s.userId,
      created_at: s.createdAt,
    });
    if (isUniqueViolation(error)) return false;
    check(error, 'inscription au quartier');
    return true;
  }
  async updateSignup(id: string, patch: Partial<Omit<SignupRecord, 'id' | 'code'>>): Promise<SignupRecord | null> {
    const row: Database['public']['Tables']['quartier_signups']['Update'] = {};
    if (patch.zone !== undefined) row.zone = patch.zone;
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.locale !== undefined) row.locale = patch.locale;
    if (patch.token !== undefined) row.token = patch.token;
    if (patch.invitedByUser !== undefined) row.invited_by_user = patch.invitedByUser;
    if (patch.invitedBySignup !== undefined) row.invited_by_signup = patch.invitedBySignup;
    if (patch.consentAt !== undefined) row.consent_at = patch.consentAt;
    if (patch.confirmedAt !== undefined) row.confirmed_at = patch.confirmedAt;
    if (patch.unsubscribedAt !== undefined) row.unsubscribed_at = patch.unsubscribedAt;
    if (patch.openMailSentAt !== undefined) row.open_mail_sent_at = patch.openMailSentAt;
    if (patch.userId !== undefined) row.user_id = patch.userId;
    const { data, error } = await this.client.from('quartier_signups').update(row).eq('id', id).select('*').maybeSingle();
    check(error, 'mise à jour de l’inscription');
    return data ? signupFromRow(data) : null;
  }
  async invitesOf(zone: string): Promise<ZoneInvite[]> {
    const { data, error } = await this.client
      .from('quartier_signups')
      .select('invited_by_user, invited_by_signup, confirmed_at')
      .eq('zone', zone)
      .is('unsubscribed_at', null)
      .not('confirmed_at', 'is', null)
      .or('invited_by_user.not.is.null,invited_by_signup.not.is.null')
      .order('confirmed_at')
      .limit(PAGE);
    check(error, 'invitations du quartier');
    return (data ?? []).map((r) => ({
      inviter: r.invited_by_user ? `u:${r.invited_by_user}` : `s:${r.invited_by_signup}`,
      confirmedAt: iso(r.confirmed_at as string),
    }));
  }
  async setFounders(zone: string, founders: readonly FounderRecord[], at: string): Promise<void> {
    if (founders.length === 0) return;
    const { error } = await this.client
      .from('quartier_founders')
      .upsert(
        founders.map((f) => ({ zone, rank: f.rank, user_id: f.userId, signup_id: f.signupId, created_at: at })),
        { onConflict: 'zone,rank', ignoreDuplicates: true },
      );
    check(error, 'fondateurs du quartier');
  }
  async founders(zone: string): Promise<FounderRecord[]> {
    const { data, error } = await this.client.from('quartier_founders').select('*').eq('zone', zone).order('rank');
    check(error, 'fondateurs du quartier');
    return (data ?? []).map((r) => ({ zone: r.zone, rank: r.rank, userId: r.user_id, signupId: r.signup_id }));
  }
  async foundedBy(userId: string): Promise<number> {
    const { data: mine, error: e1 } = await this.client.from('quartier_signups').select('id').eq('user_id', userId).limit(20);
    check(e1, 'inscriptions reprises');
    const ids = (mine ?? []).map((r) => r.id);
    const or = ids.length ? `user_id.eq.${userId},signup_id.in.(${ids.join(',')})` : `user_id.eq.${userId}`;
    const { data, error } = await this.client.from('quartier_founders').select('zone').or(or);
    check(error, 'quartiers fondés');
    return new Set((data ?? []).map((r) => r.zone)).size;
  }
  async toNotify(limit: number): Promise<SignupRecord[]> {
    const { data: open, error: e1 } = await this.client.from('quartiers').select('zone').not('opened_at', 'is', null).limit(5000);
    check(e1, 'quartiers ouverts');
    const zones = (open ?? []).map((r) => r.zone);
    if (zones.length === 0) return [];
    const { data, error } = await this.client
      .from('quartier_signups')
      .select('*')
      .in('zone', zones)
      .is('unsubscribed_at', null)
      .is('open_mail_sent_at', null)
      .not('confirmed_at', 'is', null)
      .not('email', 'is', null)
      .order('confirmed_at')
      .limit(limit);
    check(error, 'inscriptions à prévenir');
    return (data ?? []).map(signupFromRow);
  }
  async purge(unconfirmedBefore: string, notifiedBefore: string): Promise<number> {
    const { data: gone, error: e1 } = await this.client
      .from('quartier_signups')
      .delete()
      .is('confirmed_at', null)
      .lt('created_at', unconfirmedBefore)
      .select('id');
    check(e1, 'effacement des inscriptions non confirmées');
    const { data: erased, error: e2 } = await this.client
      .from('quartier_signups')
      .update({ email: null, token: null })
      .not('email', 'is', null)
      .lt('open_mail_sent_at', notifiedBefore)
      .select('id');
    check(e2, 'effacement des adresses prévenues');
    return (gone ?? []).length + (erased ?? []).length;
  }
}
