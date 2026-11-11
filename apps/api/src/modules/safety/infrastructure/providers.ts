import type { Provider } from '@nestjs/common';
import type { BlocksRepository, ReportsRepository } from '../ports';
import { type Adapters, repository } from '../../../persistence/repository';
import { BLOCKS, REPORTS } from '../../../shared/tokens';
import { MemoryBlocksRepository, MemoryReportsRepository } from './memory-safety.repository';
import { SupabaseBlocksRepository, SupabaseReportsRepository } from './supabase-safety.repository';

export const safetyRepositories = (adapters: Adapters): Provider[] => [
  repository<BlocksRepository>(BLOCKS, adapters, (db) => new MemoryBlocksRepository(db), (c) => new SupabaseBlocksRepository(c)),
  repository<ReportsRepository>(REPORTS, adapters, (db) => new MemoryReportsRepository(db), (c) => new SupabaseReportsRepository(c)),
];
