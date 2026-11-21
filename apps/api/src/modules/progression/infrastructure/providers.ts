import type { Provider } from '@nestjs/common';
import { type Adapters, repository } from '../../../persistence/repository';
import {
  LEAGUE_STANDINGS,
  type LeagueStandingsRepository,
  PROGRESSION_READER,
  type ProgressionReader,
} from '../ports';
import { MemoryLeagueStandings } from './memory-league-standings';
import { SupabaseLeagueStandings } from './supabase-league-standings';
import { MemoryProgressionReader } from './memory-progression.reader';
import { SupabaseProgressionReader } from './supabase-progression.reader';

export const progressionProviders = (adapters: Adapters): Provider[] => [
  repository<ProgressionReader>(
    PROGRESSION_READER,
    adapters,
    (db) => new MemoryProgressionReader(db),
    (c) => new SupabaseProgressionReader(c),
  ),
  repository<LeagueStandingsRepository>(
    LEAGUE_STANDINGS,
    adapters,
    (db) => new MemoryLeagueStandings(db),
    (c) => new SupabaseLeagueStandings(c),
  ),
];
