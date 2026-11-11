import type { Provider } from '@nestjs/common';
import type { EncountersRepository } from '../ports';
import { type Adapters, repository } from '../../../persistence/repository';
import { ENCOUNTERS } from '../../../shared/tokens';
import { MemoryEncountersRepository } from './memory-encounters.repository';
import { SupabaseEncountersRepository } from './supabase-encounters.repository';

export const encountersRepositories = (adapters: Adapters): Provider[] => [
  repository<EncountersRepository>(ENCOUNTERS, adapters, (db) => new MemoryEncountersRepository(db), (c) => new SupabaseEncountersRepository(c)),
];
