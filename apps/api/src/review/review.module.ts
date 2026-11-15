import { type DynamicModule, Global, Module } from '@nestjs/common';
import type { Env } from '../config/env';
import type { Db } from '../persistence/database.types';
import type { MemoryDb } from '../persistence/memory-db';
import { MEMORY_DB, SUPABASE } from '../shared/tokens';
import { EncountersModule } from '../modules/encounters/encounters.module';
import { LinksModule } from '../modules/links/links.module';
import { PetsModule } from '../modules/pets/pets.module';
import { RituelsModule } from '../modules/rituels/rituels.module';
import { VisionModule } from '../modules/vision/vision.module';
import { FIXTURE_ACCOUNTS, MemoryFixtureAccounts, MemoryReviewAuth, REVIEW_AUTH, SupabaseFixtureAccounts, SupabaseReviewAuth } from './review-auth';
import { REVIEW_REPLIES, ReviewAutoReplies } from './review-replies';
import { ReviewController } from './review.controller';
import { ReviewWorld } from './review-world';

/**
 * Compte de revue d'Apple et son monde d'exemple (audit B1), global : le crochet d'inscription (`DemoModule`), la
 * suppression du compte et le contrôleur des liens s'en servent. Sans `REVIEW_EMAIL` / `REVIEW_CODE`, la connexion par
 * e-mail répond toujours « adresse ou code incorrect » et aucun monde n'est posé.
 */
@Global()
@Module({})
export class ReviewModule {
  static forRoot(env: Env): DynamicModule {
    const memory = env.adapters === 'memory';
    const supabase = env.supabase;
    return {
      module: ReviewModule,
      imports: [LinksModule, PetsModule, EncountersModule, VisionModule, RituelsModule],
      controllers: [ReviewController],
      providers: [
        memory || !supabase
          ? { provide: REVIEW_AUTH, useFactory: (db: MemoryDb) => new MemoryReviewAuth(db), inject: [MEMORY_DB] }
          : { provide: REVIEW_AUTH, useFactory: (c: Db) => new SupabaseReviewAuth(c, supabase.url, supabase.serviceRoleKey), inject: [SUPABASE] },
        memory || !supabase
          ? { provide: FIXTURE_ACCOUNTS, useFactory: (db: MemoryDb) => new MemoryFixtureAccounts(db), inject: [MEMORY_DB] }
          : { provide: FIXTURE_ACCOUNTS, useFactory: (c: Db) => new SupabaseFixtureAccounts(c), inject: [SUPABASE] },
        ReviewWorld,
        ReviewAutoReplies,
        { provide: REVIEW_REPLIES, useExisting: ReviewAutoReplies },
      ],
      exports: [ReviewWorld, REVIEW_REPLIES, FIXTURE_ACCOUNTS],
    };
  }
}
