import type { Provider } from '@nestjs/common';
import type { PetsRepository, WordVotesRepository } from '../ports';
import { type Adapters, repository } from '../../../persistence/repository';
import { PETS, WORD_VOTES } from '../../../shared/tokens';
import { MemoryPetsRepository } from './memory-pets.repository';
import { MemoryWordVotesRepository } from './memory-word-votes.repository';
import { SupabasePetsRepository } from './supabase-pets.repository';
import { SupabaseWordVotesRepository } from './supabase-word-votes.repository';

export const petsRepositories = (adapters: Adapters): Provider[] => [
  repository<PetsRepository>(PETS, adapters, (db) => new MemoryPetsRepository(db), (c) => new SupabasePetsRepository(c)),
  repository<WordVotesRepository>(WORD_VOTES, adapters, (db) => new MemoryWordVotesRepository(db), (c) => new SupabaseWordVotesRepository(c)),
];
