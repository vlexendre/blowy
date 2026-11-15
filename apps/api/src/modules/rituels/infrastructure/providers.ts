import type { Provider } from '@nestjs/common';
import type { Env } from '../../../config/env';
import { AI_GATEWAY, type AiGateway } from '../../../integrations/ai/ai-gateway';
import type { MemoryStorage } from '../../../integrations/storage/memory-storage';
import type { Db } from '../../../persistence/database.types';
import { type Adapters, repository } from '../../../persistence/repository';
import { ENV, STORAGE, SUPABASE } from '../../../shared/tokens';
import type {
  Coach,
  DailyChallengesRepository,
  HabitChecksRepository,
  HabitVerifier,
  HabitsRepository,
  ProofImages,
  RitualPhotosRepository,
  RitualStatesRepository,
  WeeklyReviewsRepository,
} from '../ports';
import { COACH, DAILY_CHALLENGES, HABIT_CHECKS, HABIT_VERIFIER, HABITS, PROOF_IMAGES, RITUAL_PHOTOS, RITUAL_STATES, WEEKLY_REVIEWS } from '../tokens';
import { AiCoach, AiHabitVerifier, MemoryHabitVerifier, MemoryProofImages, SupabaseProofImages, TemplateCoach } from './adapters';
import {
  MemoryDailyChallengesRepository,
  MemoryHabitChecksRepository,
  MemoryHabitsRepository,
  MemoryRitualPhotosRepository,
  MemoryRitualStatesRepository,
  MemoryWeeklyReviewsRepository,
} from './memory-rituels.repositories';
import {
  SupabaseDailyChallengesRepository,
  SupabaseHabitChecksRepository,
  SupabaseHabitsRepository,
  SupabaseRitualPhotosRepository,
  SupabaseRitualStatesRepository,
  SupabaseWeeklyReviewsRepository,
} from './supabase-rituels.repositories';

/** Dépôts des rituels (globaux, via CoreModule : la garde-robe lit les compteurs de la série et des habitudes). */
export const rituelsRepositories = (adapters: Adapters): Provider[] => [
  repository<RitualStatesRepository>(RITUAL_STATES, adapters, (db) => new MemoryRitualStatesRepository(db), (c) => new SupabaseRitualStatesRepository(c)),
  repository<DailyChallengesRepository>(DAILY_CHALLENGES, adapters, (db) => new MemoryDailyChallengesRepository(db), (c) => new SupabaseDailyChallengesRepository(c)),
  repository<HabitsRepository>(HABITS, adapters, (db) => new MemoryHabitsRepository(db), (c) => new SupabaseHabitsRepository(c)),
  repository<HabitChecksRepository>(HABIT_CHECKS, adapters, (db) => new MemoryHabitChecksRepository(db), (c) => new SupabaseHabitChecksRepository(c)),
  repository<RitualPhotosRepository>(RITUAL_PHOTOS, adapters, (db) => new MemoryRitualPhotosRepository(db), (c) => new SupabaseRitualPhotosRepository(c)),
  repository<WeeklyReviewsRepository>(WEEKLY_REVIEWS, adapters, (db) => new MemoryWeeklyReviewsRepository(db), (c) => new SupabaseWeeklyReviewsRepository(c)),
];

const optionalGateway = { token: AI_GATEWAY, optional: true };

/**
 * Ports externes du module (vérification, reformulation, images). En mémoire : verdicts déterministes et modèles
 * de phrases. Sinon : la passerelle IA partagée ; si elle n'est pas fournie, le même repli que lorsqu'elle refuse.
 */
export const rituelsPorts: Provider[] = [
  {
    provide: PROOF_IMAGES,
    useFactory: (env: Env, storage: unknown, client: Db | undefined): ProofImages =>
      env.adapters === 'memory' || !client ? new MemoryProofImages(storage as MemoryStorage) : new SupabaseProofImages(client),
    inject: [ENV, STORAGE, { token: SUPABASE, optional: true }],
  },
  {
    provide: HABIT_VERIFIER,
    useFactory: (env: Env, images: ProofImages, gateway: AiGateway | undefined): HabitVerifier =>
      env.adapters === 'memory' ? new MemoryHabitVerifier() : new AiHabitVerifier(gateway ?? declining, images),
    inject: [ENV, PROOF_IMAGES, optionalGateway],
  },
  {
    provide: COACH,
    useFactory: (env: Env, gateway: AiGateway | undefined): Coach => (env.adapters === 'memory' || !gateway ? new TemplateCoach() : new AiCoach(gateway)),
    inject: [ENV, optionalGateway],
  },
];

/** Passerelle absente : se comporte comme une passerelle coupée. */
const declining: AiGateway = { complete: async () => ({ ok: false, reason: 'disabled' }) };
