import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import { QUARTIERS, QUIZ_RESULTS, type QuartiersRepository, type QuizResultsRepository } from '../ports';
import { MemoryQuartiersRepository, MemoryQuizResultsRepository } from './memory-quartiers.repositories';
import { SupabaseQuartiersRepository, SupabaseQuizResultsRepository } from './supabase-quartiers.repositories';

/** Quiz et quartiers (globaux, CoreModule) : les codes, l'inscription et la garde-robe les lisent. */
export const quartierRepositories = (adapters: Adapters): Provider[] => [
  repository<QuizResultsRepository>(QUIZ_RESULTS, adapters, (db) => new MemoryQuizResultsRepository(db), (c) => new SupabaseQuizResultsRepository(c)),
  repository<QuartiersRepository>(QUARTIERS, adapters, (db) => new MemoryQuartiersRepository(db), (c) => new SupabaseQuartiersRepository(c)),
];
