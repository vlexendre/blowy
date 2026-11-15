import type { Provider } from '@nestjs/common';
import { ENCOUNTER_PROPOSALS, type EncountersRepository, type ProposalsRepository } from '../ports';
import { type Adapters, repository } from '../../../persistence/repository';
import { ENCOUNTERS } from '../../../shared/tokens';
import { MemoryEncountersRepository, MemoryProposalsRepository } from './memory-encounters.repository';
import { SupabaseEncountersRepository, SupabaseProposalsRepository } from './supabase-encounters.repository';

export const encountersRepositories = (adapters: Adapters): Provider[] => [
  repository<EncountersRepository>(ENCOUNTERS, adapters, (db) => new MemoryEncountersRepository(db), (c) => new SupabaseEncountersRepository(c)),
  repository<ProposalsRepository>(ENCOUNTER_PROPOSALS, adapters, (db) => new MemoryProposalsRepository(db), (c) => new SupabaseProposalsRepository(c)),
];
