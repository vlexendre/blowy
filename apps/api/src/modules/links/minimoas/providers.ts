import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import { MemoryChatPetStateRepository, MemoryChatSettingsRepository } from './memory-chat.repositories';
import { CHAT_PET_STATE, CHAT_SETTINGS, type ChatPetStateRepository, type ChatSettingsRepository } from './ports';
import { SupabaseChatPetStateRepository, SupabaseChatSettingsRepository } from './supabase-chat.repositories';

export const chatMinimoasRepositories = (adapters: Adapters): Provider[] => [
  repository<ChatSettingsRepository>(CHAT_SETTINGS, adapters, (db) => new MemoryChatSettingsRepository(db), (c) => new SupabaseChatSettingsRepository(c)),
  repository<ChatPetStateRepository>(CHAT_PET_STATE, adapters, (db) => new MemoryChatPetStateRepository(db), (c) => new SupabaseChatPetStateRepository(c)),
];
