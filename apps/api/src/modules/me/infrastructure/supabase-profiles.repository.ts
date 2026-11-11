import type { SupabaseClient } from '@supabase/supabase-js';
import { check, iso, isoOrNull } from '../../../persistence/supabase';
import type { Profile, ProfilePatch, ProfilesRepository } from '../ports';

interface ProfileRow {
  id: string;
  display_name: string;
  birthdate: string;
  city: string | null;
  avatar_path: string | null;
  invite_code: string;
  words_code: string;
  plus_until: string | null;
  welcome_sent_at: string | null;
  created_at: string;
}

const fromRow = (r: ProfileRow): Profile => ({
  id: r.id,
  displayName: r.display_name,
  birthdate: r.birthdate,
  city: r.city,
  avatarPath: r.avatar_path,
  inviteCode: r.invite_code,
  wordsCode: r.words_code,
  plusUntil: isoOrNull(r.plus_until),
  welcomeSentAt: isoOrNull(r.welcome_sent_at),
  createdAt: iso(r.created_at),
});

export class SupabaseProfilesRepository implements ProfilesRepository {
  constructor(private readonly client: SupabaseClient) {}

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
      city: p.city,
      avatar_path: p.avatarPath,
      invite_code: p.inviteCode,
      words_code: p.wordsCode,
      plus_until: p.plusUntil,
      welcome_sent_at: p.welcomeSentAt,
      created_at: p.createdAt,
    });
    check(error, 'création du profil');
  }

  async update(id: string, patch: ProfilePatch): Promise<Profile> {
    const row: Partial<ProfileRow> = {};
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.city !== undefined) row.city = patch.city;
    if (patch.avatarPath !== undefined) row.avatar_path = patch.avatarPath;
    if (patch.welcomeSentAt !== undefined) row.welcome_sent_at = patch.welcomeSentAt;
    const { data, error } = await this.table.update(row).eq('id', id).select('*').single();
    check(error, 'mise à jour du profil');
    return fromRow(data as ProfileRow);
  }

  async listRecent(limit: number, excludeId: string): Promise<Profile[]> {
    const { data, error } = await this.table.select('*').neq('id', excludeId).order('created_at', { ascending: false }).limit(limit);
    check(error, 'lecture des profils récents');
    return (data as ProfileRow[]).map(fromRow);
  }

  private async findOne(column: 'id' | 'invite_code' | 'words_code', value: string): Promise<Profile | null> {
    const { data, error } = await this.table.select('*').eq(column, value).maybeSingle();
    check(error, 'lecture du profil');
    return data ? fromRow(data as ProfileRow) : null;
  }
}
