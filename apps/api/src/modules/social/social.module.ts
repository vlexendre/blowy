/**
 * Composition root du module social (périmètre agent F : réponses anonymes + parrainage).
 * @Global : expose SOCIAL_MODERATION (admin), les effets outbox et jobs (worker).
 */
import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import type { Redis } from 'ioredis';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { MemoryRateLimiter, RedisRateLimiter } from '../../shared/interface/rate-limit.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB, RANDOM, REDIS, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import type { AppConfig } from '../../config/env.js';
import { ANONYMOUS_REPOSITORY, REFERRAL_REPOSITORY, SOCIAL_CONFIG, SOCIAL_QUOTA, type AnonymousRepository, type QuotaCounter, type ReferralRepository, type SocialConfig } from './application/ports/social.ports.js';
import { AnonymousResponsesUseCases } from './application/use-cases/anonymous.use-cases.js';
import { ReferralUseCases } from './application/use-cases/referral.use-cases.js';
import { PrismaAnonymousRepository, PrismaReferralRepository, RateLimiterQuota } from './infrastructure/prisma-social.repositories.js';
import { PublicSocialController, SocialController } from './interface/social.controllers.js';
import { ReferralActivationEffect, socialJobs } from './interface/social.consumers.js';
import { loadAdminConfig } from '../admin/infrastructure/admin-config.js';
import { SOCIAL_MODERATION } from '../admin/application/use-cases/admin-social.use-cases.js';

export const SOCIAL_OUTBOX_EFFECTS = Symbol('SocialOutboxEffects');
export const SOCIAL_JOBS = Symbol('SocialJobs');

@Global()
@Module({
  controllers: [PublicSocialController, SocialController],
  providers: [
    {
      provide: SOCIAL_CONFIG,
      useFactory: (app: AppConfig): SocialConfig => {
        const c = loadAdminConfig();
        return { publicLinkSecret: c.publicLinkSecret, publicWebOrigin: c.publicWebOrigin, inviteTtlDays: c.inviteTtlDays, allowLocalDemoVerification: !app.isProduction };
      },
      inject: [APP_CONFIG],
    },
    { provide: ANONYMOUS_REPOSITORY, useFactory: (db: Db) => new PrismaAnonymousRepository(db), inject: [DB] },
    { provide: REFERRAL_REPOSITORY, useFactory: (db: Db) => new PrismaReferralRepository(db), inject: [DB] },
    { provide: SOCIAL_QUOTA, useFactory: (r: Redis | null, c: Clock) => new RateLimiterQuota(r ? new RedisRateLimiter(r, c) : new MemoryRateLimiter(c)), inject: [REDIS, CLOCK] },
    {
      provide: AnonymousResponsesUseCases,
      useFactory: (r: AnonymousRepository, q: QuotaCounter, u: UnitOfWork, b: CommandBus, c: Clock, rnd: RandomSource, cfg: SocialConfig) => new AnonymousResponsesUseCases(r, q, u, b, c, rnd, cfg),
      inject: [ANONYMOUS_REPOSITORY, SOCIAL_QUOTA, UNIT_OF_WORK, COMMAND_BUS, CLOCK, RANDOM, SOCIAL_CONFIG],
    },
    {
      provide: ReferralUseCases,
      useFactory: (r: ReferralRepository, b: CommandBus, u: UnitOfWork, c: Clock, rnd: RandomSource, cfg: SocialConfig) => new ReferralUseCases(r, b, u, c, rnd, cfg),
      inject: [REFERRAL_REPOSITORY, COMMAND_BUS, UNIT_OF_WORK, CLOCK, RANDOM, SOCIAL_CONFIG],
    },
    { provide: SOCIAL_MODERATION, useFactory: (a: AnonymousResponsesUseCases) => ({ staffHide: a.staffHide.bind(a) }), inject: [AnonymousResponsesUseCases] },
    { provide: SOCIAL_OUTBOX_EFFECTS, useFactory: (r: ReferralUseCases) => [new ReferralActivationEffect(r)], inject: [ReferralUseCases] },
    { provide: SOCIAL_JOBS, useFactory: (r: ReferralUseCases) => socialJobs(r), inject: [ReferralUseCases] },
  ],
  exports: [SOCIAL_MODERATION, SOCIAL_OUTBOX_EFFECTS, SOCIAL_JOBS, ReferralUseCases, AnonymousResponsesUseCases],
})
export class SocialModule {}
