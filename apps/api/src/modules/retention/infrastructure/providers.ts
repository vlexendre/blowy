import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import { Bans } from '../application/bans';
import { RETENTION, type RetentionRepository } from '../ports';
import { MemoryRetentionRepository } from './memory-retention.repository';
import { SupabaseRetentionRepository } from './supabase-retention.repository';

/** Globaux (CoreModule) : la garde de compte note le dernier jour d'activité, l'inscription et la modération lisent les exclusions. */
export const retentionProviders = (adapters: Adapters): Provider[] => [
  repository<RetentionRepository>(RETENTION, adapters, (db) => new MemoryRetentionRepository(db), (c) => new SupabaseRetentionRepository(c)),
  Bans,
];
