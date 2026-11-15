import { type ChatPetState, type ChatReadingDefault, EMPTY_CHAT_PET_STATE } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type { ChatLinkSettingRecord, ChatPetStateRepository, ChatSettingsRepository } from './ports';

export class MemoryChatSettingsRepository implements ChatSettingsRepository {
  constructor(private readonly db: MemoryDb) {}

  async forLink(linkId: string): Promise<ChatLinkSettingRecord[]> {
    return [...this.db.chatLinkSettings.values()].filter((s) => s.linkId === linkId).map((s) => ({ ...s }));
  }

  async forUserLinks(userId: string, linkIds: readonly string[]): Promise<ChatLinkSettingRecord[]> {
    return linkIds.flatMap((id) => {
      const s = this.db.chatLinkSettings.get(`${id}:${userId}`);
      return s ? [{ ...s }] : [];
    });
  }

  async upsert(record: ChatLinkSettingRecord): Promise<void> {
    if (!this.db.links.has(record.linkId)) return;
    this.db.chatLinkSettings.set(`${record.linkId}:${record.userId}`, { ...record });
  }

  async upsertMany(records: readonly ChatLinkSettingRecord[]): Promise<void> {
    for (const r of records) await this.upsert(r);
  }

  async readingDefault(userId: string): Promise<ChatReadingDefault> {
    return this.db.chatReadingDefaults.get(userId) ?? 'ask';
  }

  async setReadingDefault(userId: string, value: ChatReadingDefault): Promise<void> {
    if (!this.db.profiles.has(userId)) return;
    this.db.chatReadingDefaults.set(userId, value);
  }
}

export class MemoryChatPetStateRepository implements ChatPetStateRepository {
  constructor(private readonly db: MemoryDb) {}

  async get(linkId: string): Promise<ChatPetState> {
    return { ...(this.db.chatPetStates.get(linkId) ?? EMPTY_CHAT_PET_STATE) };
  }

  async save(linkId: string, state: ChatPetState): Promise<void> {
    if (!this.db.links.has(linkId)) return;
    this.db.chatPetStates.set(linkId, { ...state });
  }

  async listSilent(before: string, after: string | null, limit: number): Promise<{ linkId: string; state: ChatPetState }[]> {
    return [...this.db.chatPetStates.entries()]
      .filter(([, s]) => s.lastUserAt !== null && s.lastUserAt < before && (after === null || s.lastUserAt > after))
      .sort(([, a], [, b]) => (a.lastUserAt ?? '').localeCompare(b.lastUserAt ?? ''))
      .slice(0, limit)
      .map(([linkId, s]) => ({ linkId, state: { ...s } }));
  }
}
