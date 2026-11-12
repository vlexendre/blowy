import type { Provider } from '@nestjs/common';
import type { PetItemsRepository, PetsRepository, WordVotesRepository } from '../ports';
import { type Adapters, repository } from '../../../persistence/repository';
import { PET_ITEMS, PETS, WORD_VOTES } from '../../../shared/tokens';
import { MemoryPetItemsRepository } from './memory-pet-items.repository';
import { MemoryPetsRepository } from './memory-pets.repository';
import { MemoryWordVotesRepository } from './memory-word-votes.repository';
import { SupabasePetItemsRepository } from './supabase-pet-items.repository';
import { SupabasePetsRepository } from './supabase-pets.repository';
import { SupabaseWordVotesRepository } from './supabase-word-votes.repository';

export const petsRepositories = (adapters: Adapters): Provider[] => [
  repository<PetsRepository>(PETS, adapters, (db) => new MemoryPetsRepository(db), (c) => new SupabasePetsRepository(c)),
  repository<PetItemsRepository>(PET_ITEMS, adapters, (db) => new MemoryPetItemsRepository(db), (c) => new SupabasePetItemsRepository(c)),
  repository<WordVotesRepository>(WORD_VOTES, adapters, (db) => new MemoryWordVotesRepository(db), (c) => new SupabaseWordVotesRepository(c)),
];
