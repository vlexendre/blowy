import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import { Growth } from '../application/growth';
import { Codes } from '../application/codes';
import {
  ACQUISITIONS,
  type AcquisitionsRepository,
  CREATORS,
  type CreatorsRepository,
  GROWTH_COUNTERS,
  GROWTH_EVENTS,
  GROWTH_READS,
  type GrowthCountersRepository,
  type GrowthEventsRepository,
  type GrowthReads,
} from '../ports';
import {
  MemoryAcquisitionsRepository,
  MemoryCreatorsRepository,
  MemoryGrowthCountersRepository,
  MemoryGrowthEventsRepository,
  MemoryGrowthReads,
} from './memory-growth.repositories';
import {
  SupabaseAcquisitionsRepository,
  SupabaseCreatorsRepository,
  SupabaseGrowthCountersRepository,
  SupabaseGrowthEventsRepository,
  SupabaseGrowthReads,
} from './supabase-growth.repositories';

/**
 * Croissance (globaux, CoreModule) : l'inscription, les liens, la garde-robe, Minimoa+, les pages publiques et la garde
 * d'authentification notent les étapes ; `Growth` et `Codes` ne dépendent que de dépôts globaux.
 */
export const growthProviders = (adapters: Adapters): Provider[] => [
  repository<CreatorsRepository>(CREATORS, adapters, (db) => new MemoryCreatorsRepository(db), (c) => new SupabaseCreatorsRepository(c)),
  repository<AcquisitionsRepository>(ACQUISITIONS, adapters, (db) => new MemoryAcquisitionsRepository(db), (c) => new SupabaseAcquisitionsRepository(c)),
  repository<GrowthEventsRepository>(GROWTH_EVENTS, adapters, (db) => new MemoryGrowthEventsRepository(db), (c) => new SupabaseGrowthEventsRepository(c)),
  repository<GrowthCountersRepository>(GROWTH_COUNTERS, adapters, (db) => new MemoryGrowthCountersRepository(db), (c) => new SupabaseGrowthCountersRepository(c)),
  repository<GrowthReads>(GROWTH_READS, adapters, (db) => new MemoryGrowthReads(db), (c) => new SupabaseGrowthReads(c)),
  Growth,
  Codes,
];
