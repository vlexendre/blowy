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

export class SupabaseChatPetStateRepository implements ChatPetStateRepository {
  constructor(private readonly client: Db) {}

  async get(linkId: string): Promise<ChatPetState> {
    const { data, error } = await this.client.from('chat_pet_state').select('*').eq('link_id', linkId).maybeSingle();
    check(error, 'état des minimoas');
    if (!data) return { ...EMPTY_CHAT_PET_STATE };
    return {
      day: data.day,
      interventions: data.interventions,
      messagesSinceRemark: data.messages_since_remark,
      icebreakerDone: data.icebreaker_done,
      lastNudgeFor: isoOrNull(data.last_nudge_for),
      lastGuardAt: isoOrNull(data.last_guard_at),
    };
  }

  async save(linkId: string, s: ChatPetState): Promise<void> {
    const { error } = await this.client.from('chat_pet_state').upsert({
      link_id: linkId,
      day: s.day,
      interventions: s.interventions,
      messages_since_remark: s.messagesSinceRemark,
      icebreaker_done: s.icebreakerDone,
      last_nudge_for: s.lastNudgeFor,
      last_guard_at: s.lastGuardAt,
      updated_at: new Date().toISOString(),
    });
    check(error, 'enregistrement de l’état des minimoas');
  }
}
