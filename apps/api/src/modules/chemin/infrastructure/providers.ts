import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import type { CheminAnswersRepository, CheminContentRepository, CheminProgressRepository, CheminSessionsRepository } from '../ports';
import { CHEMIN_ANSWERS, CHEMIN_CONTENT, CHEMIN_PROGRESS, CHEMIN_SESSIONS } from '../tokens';
import { MemoryCheminAnswersRepository, MemoryCheminContentRepository, MemoryCheminProgressRepository, MemoryCheminSessionsRepository } from './memory-chemin.repositories';
import {
  SupabaseCheminAnswersRepository,
  SupabaseCheminContentRepository,
  SupabaseCheminProgressRepository,
  SupabaseCheminSessionsRepository,
} from './supabase-chemin.repositories';

/** Dépôts de Ton chemin (globaux, via CoreModule : l'administration lit le contenu et le compteur). */
export const cheminRepositories = (adapters: Adapters): Provider[] => [
  repository<CheminContentRepository>(CHEMIN_CONTENT, adapters, (db) => new MemoryCheminContentRepository(db), (c) => new SupabaseCheminContentRepository(c)),
  repository<CheminProgressRepository>(CHEMIN_PROGRESS, adapters, (db) => new MemoryCheminProgressRepository(db), (c) => new SupabaseCheminProgressRepository(c)),
  repository<CheminSessionsRepository>(CHEMIN_SESSIONS, adapters, (db) => new MemoryCheminSessionsRepository(db), (c) => new SupabaseCheminSessionsRepository(c)),
  repository<CheminAnswersRepository>(CHEMIN_ANSWERS, adapters, (db) => new MemoryCheminAnswersRepository(db), (c) => new SupabaseCheminAnswersRepository(c)),
];
