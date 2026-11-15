import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import { AI_CONSENTS, type AiConsentsRepository } from '../ports';
import { MemoryAiConsentsRepository } from './memory-ai-consents.repository';
import { SupabaseAiConsentsRepository } from './supabase-ai-consents.repository';

/** Dépôt global (CoreModule) : les rituels le lisent avant tout envoi d'image à l'IA. */
export const aiConsentsRepositories = (adapters: Adapters): Provider[] => [
  repository<AiConsentsRepository>(AI_CONSENTS, adapters, (db) => new MemoryAiConsentsRepository(db), (c) => new SupabaseAiConsentsRepository(c)),
];
