import type { Db } from '../../../persistence/database.types';
import { check, iso, isoOrNull } from '../../../persistence/supabase';
import type { Gender, Locale } from '@blowy/domain';
import type { Profile, ProfilePatch, ProfilesRepository } from '../ports';

interface ProfileRow {
  id: string;
  display_name: string;
  birthdate: string;
  gender: string;
  locale: string;
  discreet: boolean;
  location_consent_at: string | null;
  avatar_path: string | null;
  invite_code: string;
  words_code: string;
  plus_until: string | null;
  welcome_sent_at: string | null;
  created_at: string;
  review_world?: string | null;
  avatar_checked_at?: string | null;
  show_habits?: boolean;
}

const fromRow = (r: ProfileRow): Profile => ({
  id: r.id,
  displayName: r.display_name,
  birthdate: r.birthdate,
  // Valeurs bornées par les contraintes CHECK de la migration « vision ».
  gender: r.gender as Gender,
  locale: r.locale as Locale,
  discreet: r.discreet,
  locationConsentAt: isoOrNull(r.location_consent_at),
  avatarPath: r.avatar_path,
  inviteCode: r.invite_code,
  wordsCode: r.words_code,
  plusUntil: isoOrNull(r.plus_until),
  welcomeSentAt: isoOrNull(r.welcome_sent_at),
  createdAt: iso(r.created_at),
  reviewWorld: r.review_world ?? null,
  avatarCheckedAt: isoOrNull(r.avatar_checked_at ?? null),
  showHabits: r.show_habits ?? true,
});

export class SupabaseProfilesRepository implements ProfilesRepository {
  constructor(private readonly client: Db) {}

  private get table() {
    return this.client.from('profiles');
  }

  async findById(id: string): Promise<Profile | null> {
    return this.findOne('id', id);
  }

  async findByIds(ids: readonly string[]): Promise<Profile[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.table.select('*').in('id', [...ids]);
    check(error, 'lecture des profils');
    return (data as ProfileRow[]).map(fromRow);
  }

  async findByInviteCode(code: string): Promise<Profile | null> {
    return this.findOne('invite_code', code);
  }

  async findByWordsCode(code: string): Promise<Profile | null> {
    return this.findOne('words_code', code);
  }

  async codeTaken(code: string): Promise<boolean> {
    const { count, error } = await this.table.select('id', { count: 'exact', head: true }).or(`invite_code.eq.${code},words_code.eq.${code}`);
    check(error, 'vérification du code');
    return (count ?? 0) > 0;
  }

  async create(p: Profile): Promise<void> {
    const { error } = await this.table.insert({
      id: p.id,
      display_name: p.displayName,
      birthdate: p.birthdate,
      gender: p.gender,
      locale: p.locale,
      discreet: p.discreet,
      location_consent_at: p.locationConsentAt,
      avatar_path: p.avatarPath,
      invite_code: p.inviteCode,
      words_code: p.wordsCode,
      plus_until: p.plusUntil,
      welcome_sent_at: p.welcomeSentAt,
      created_at: p.createdAt,
      ...(p.reviewWorld ? { review_world: p.reviewWorld } : {}),
    });
    check(error, 'création du profil');
  }

  async update(id: string, patch: ProfilePatch): Promise<Profile> {
    const row: Partial<ProfileRow> = {};
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.gender !== undefined) row.gender = patch.gender;
    if (patch.locale !== undefined) row.locale = patch.locale;
    if (patch.discreet !== undefined) row.discreet = patch.discreet;
    if (patch.locationConsentAt !== undefined) row.location_consent_at = patch.locationConsentAt;
    if (patch.avatarPath !== undefined) row.avatar_path = patch.avatarPath;
    if (patch.welcomeSentAt !== undefined) row.welcome_sent_at = patch.welcomeSentAt;
    if (patch.reviewWorld !== undefined) row.review_world = patch.reviewWorld;
    if (patch.avatarCheckedAt !== undefined) row.avatar_checked_at = patch.avatarCheckedAt;
    if (patch.showHabits !== undefined) row.show_habits = patch.showHabits;
    const { data, error } = await this.table.update(row).eq('id', id).select('*').single();
    check(error, 'mise à jour du profil');
    return fromRow(data as ProfileRow);
  }

  async listRecent(limit: number, excludeId: string): Promise<Profile[]> {
    const { data, error } = await this.table.select('*').neq('id', excludeId).order('created_at', { ascending: false }).limit(limit);
    check(error, 'lecture des profils récents');
    return (data as ProfileRow[]).map(fromRow);
  }

  async listFixtures(world: string): Promise<Profile[]> {
    const { data, error } = await this.table.select('*').eq('review_world', world).neq('id', world);
    check(error, 'lecture des personnes fictives');
    return (data as ProfileRow[]).map(fromRow);
  }

  async deleteFixtures(world: string): Promise<string[]> {
    const { data, error } = await this.table.delete().eq('review_world', world).neq('id', world).select('id');
    check(error, 'suppression des personnes fictives');
    return (data ?? []).map((r) => r.id);
  }

  async listUncheckedAvatars(limit: number): Promise<Profile[]> {
    const { data, error } = await this.table.select('*').not('avatar_path', 'is', null).is('avatar_checked_at', null).order('created_at', { ascending: true }).limit(limit);
    check(error, 'lecture des photos à vérifier');
    return (data as ProfileRow[]).map(fromRow);
  }

  private async findOne(column: 'id' | 'invite_code' | 'words_code', value: string): Promise<Profile | null> {
    const { data, error } = await this.table.select('*').eq(column, value).maybeSingle();
    check(error, 'lecture du profil');
    return data ? fromRow(data as ProfileRow) : null;
  }
}
