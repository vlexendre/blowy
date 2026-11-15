import { type ChatPetState, EMPTY_CHAT_PET_STATE } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check, iso, isoOrNull } from '../../../persistence/supabase';
import type { ChatLinkSettingRecord, ChatPetStateRepository, ChatSettingsRepository } from './ports';

interface SettingRow {
  link_id: string;
  user_id: string;
  consent: boolean | null;
  consent_at: string | null;
  muted: boolean;
  updated_at: string;
}

const fromRow = (r: SettingRow): ChatLinkSettingRecord => ({
  linkId: r.link_id,
  userId: r.user_id,
  consent: r.consent,
  consentAt: isoOrNull(r.consent_at),
  muted: r.muted,
  updatedAt: iso(r.updated_at),
});

export class SupabaseChatSettingsRepository implements ChatSettingsRepository {
  constructor(private readonly client: Db) {}

  async forLink(linkId: string): Promise<ChatLinkSettingRecord[]> {
    const { data, error } = await this.client.from('chat_link_settings').select('*').eq('link_id', linkId);
    check(error, 'réglages des minimoas');
    return (data ?? []).map(fromRow);
  }

  async forUserLinks(userId: string, linkIds: readonly string[]): Promise<ChatLinkSettingRecord[]> {
    if (linkIds.length === 0) return [];
    const { data, error } = await this.client.from('chat_link_settings').select('*').eq('user_id', userId).in('link_id', [...linkIds]);
    check(error, 'réglages des minimoas');
    return (data ?? []).map(fromRow);
  }

  async upsert(r: ChatLinkSettingRecord): Promise<void> {
    const { error } = await this.client
      .from('chat_link_settings')
      .upsert({ link_id: r.linkId, user_id: r.userId, consent: r.consent, consent_at: r.consentAt, muted: r.muted, updated_at: r.updatedAt });
    check(error, 'enregistrement des réglages des minimoas');
  }
}

type StateRow = {
  day: string | null;
  interventions: number;
  messages_since_remark: number;
  icebreaker_done: boolean;
  last_user_at: string | null;
  last_nudge_for: string | null;
  last_guard_at: string | null;
};
const stateFrom = (data: StateRow): ChatPetState => ({
  day: data.day,
  interventions: data.interventions,
  messagesSinceRemark: data.messages_since_remark,
  icebreakerDone: data.icebreaker_done,
  lastUserAt: isoOrNull(data.last_user_at),
  lastNudgeFor: isoOrNull(data.last_nudge_for),
  lastGuardAt: isoOrNull(data.last_guard_at),
});

export class SupabaseChatPetStateRepository implements ChatPetStateRepository {
  constructor(private readonly client: Db) {}

  async get(linkId: string): Promise<ChatPetState> {
    const { data, error } = await this.client.from('chat_pet_state').select('*').eq('link_id', linkId).maybeSingle();
    check(error, 'état des minimoas');
    return data ? stateFrom(data) : { ...EMPTY_CHAT_PET_STATE };
  }

  async listSilent(before: string, after: string | null, limit: number): Promise<{ linkId: string; state: ChatPetState }[]> {
    // Index partiel chat_pet_state_silence_idx (last_user_at) where last_user_at is not null.
    let query = this.client.from('chat_pet_state').select('*').not('last_user_at', 'is', null).lt('last_user_at', before);
    if (after !== null) query = query.gt('last_user_at', after);
    const { data, error } = await query.order('last_user_at').limit(limit);
    check(error, 'silences des liens');
    return (data ?? []).map((r) => ({ linkId: r.link_id, state: stateFrom(r) }));
  }

  async save(linkId: string, s: ChatPetState): Promise<void> {
    const { error } = await this.client.from('chat_pet_state').upsert({
      link_id: linkId,
      day: s.day,
      interventions: s.interventions,
      messages_since_remark: s.messagesSinceRemark,
      icebreaker_done: s.icebreakerDone,
      last_user_at: s.lastUserAt,
      last_nudge_for: s.lastNudgeFor,
      last_guard_at: s.lastGuardAt,
      updated_at: new Date().toISOString(),
    });
    check(error, 'enregistrement de l’état des minimoas');
  }
}
