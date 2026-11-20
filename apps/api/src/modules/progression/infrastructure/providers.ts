import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import { PROGRESSION_READER, type ProgressionReader } from '../ports';
import { MemoryProgressionReader } from './memory-progression.reader';
import { SupabaseProgressionReader } from './supabase-progression.reader';

export const progressionProviders = (adapters: Adapters): Provider[] => [
  repository<ProgressionReader>(PROGRESSION_READER, adapters, (db) => new MemoryProgressionReader(db), (c) => new SupabaseProgressionReader(c)),
];
