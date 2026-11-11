import type { Provider } from '@nestjs/common';
import type { ProfilesRepository } from '../ports';
import { type Adapters, repository } from '../../../persistence/repository';
import { PROFILES } from '../../../shared/tokens';
import { MemoryProfilesRepository } from './memory-profiles.repository';
import { SupabaseProfilesRepository } from './supabase-profiles.repository';

export const meRepositories = (adapters: Adapters): Provider[] => [
  repository<ProfilesRepository>(PROFILES, adapters, (db) => new MemoryProfilesRepository(db), (c) => new SupabaseProfilesRepository(c)),
];
