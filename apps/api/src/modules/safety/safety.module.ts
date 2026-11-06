/**
 * Composition root du module `safety` (agent E, T4 — spec-v5 §2.9, §7.4, §8.5 ; V5.1 G ; V5.2 C/H) :
 * ange gardien par lien web, « tout va bien », alertes « besoin d'aide » (dossier SAFETY prioritaire,
 * Web Push sans contenu au proche), file staff (port SAFETY_STAFF_PORT consommé par ADMIN_TRUST),
 * révocations par observateurs outbox, rétention (job `safety.purge`).
 */
import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import { DEFAULT_TUNING } from '@blowy/tuning';
import type { Redis } from 'ioredis';
import type { AppConfig } from '../../config/env.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { EventPublisher } from '../../shared/application/event-publisher.js';
import type { OutboxConsumer, OutboxEffect } from '../../shared/application/outbox-consumer.js';
import { OUTING_SAFETY_PORT, type OutingSafetyPort } from '../../shared/application/ports/outing-safety.port.js';
import { SAFETY_STAFF_PORT } from '../../shared/application/ports/safety-staff.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { MemoryRateLimiter, RedisRateLimiter } from '../../shared/interface/rate-limit.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB, EVENT_PUBLISHER, RANDOM, REDIS, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import type { RecurringJob } from '../../jobs/scheduler.js';
import { TRUST_REPOSITORY, type TrustRepository } from '../trust/application/ports/trust.repository.js';
import { GUARDIAN_PUSH_SENDER, SAFETY_CASE_SINK, SAFETY_RATE_LIMITER, SAFETY_REPOSITORY, SUBJECT_READER, type GuardianPushSender, type SafetyCaseSink, type SafetyRepository, type SubjectReader } from './application/ports/safety.ports.js';
import { SafetyUseCases } from './application/safety.use-cases.js';
import { SafetyStaffService } from './application/staff.service.js';
import { BlockRemovalHook } from './application/block-removal.hook.js';
import { BLOCK_SAFETY_HOOK } from '../../shared/application/ports/block-hook.port.js';
import { GUARDIAN_METADATA_RETENTION_DAYS } from './domain/guardian.js';
import { PrismaSafetyRepository } from './infrastructure/prisma-safety.repository.js';
import { PrismaSubjectReader } from './infrastructure/prisma-subject-reader.js';
import { AlertAckConsumer, GuardianPushEffect, GuardianRevocationConsumer, KnowsSomeoneReviewConsumer, UneasyLeaveConsumer } from './infrastructure/safety.consumers.js';
import { DisabledPushSender, RecordingPushSender, VapidPushSender } from './infrastructure/web-push.sender.js';
import { PublicGuardianController, SafetyController } from './interface/safety.controller.js';

export const SAFETY_OUTBOX = Symbol('SafetyOutbox');
export const SAFETY_JOBS = Symbol('SafetyJobs');
const DAY = 86_400_000;

/** Strategy Web Push : VAPID si configuré ; enregistreur local hors production ; sinon désactivé. */
function selectPushSender(cfg: AppConfig, clock: Clock): GuardianPushSender {
  if (cfg.WEB_PUSH_VAPID_PUBLIC_KEY && cfg.WEB_PUSH_VAPID_PRIVATE_KEY && cfg.WEB_PUSH_SUBJECT) return new VapidPushSender(cfg.WEB_PUSH_VAPID_PUBLIC_KEY, cfg.WEB_PUSH_VAPID_PRIVATE_KEY, cfg.WEB_PUSH_SUBJECT, clock);
  return cfg.isProduction ? new DisabledPushSender() : new RecordingPushSender();
}

@Global()
@Module({
  controllers: [SafetyController, PublicGuardianController],
  providers: [
    { provide: SAFETY_REPOSITORY, useFactory: (db: Db) => new PrismaSafetyRepository(db), inject: [DB] },
    { provide: SUBJECT_READER, useFactory: (db: Db) => new PrismaSubjectReader(db), inject: [DB] },
    { provide: GUARDIAN_PUSH_SENDER, useFactory: selectPushSender, inject: [APP_CONFIG, CLOCK] },
    { provide: SAFETY_RATE_LIMITER, useFactory: (r: Redis | null, c: Clock) => (r ? new RedisRateLimiter(r, c) : new MemoryRateLimiter(c)), inject: [{ token: REDIS, optional: true }, CLOCK] },
    {
      provide: SAFETY_CASE_SINK,
      useFactory: (t: TrustRepository): SafetyCaseSink => ({
        open: (scope, c) => t.openCase(scope, { subjectType: c.subjectType, subjectId: c.subjectId, subjectUserId: c.subjectUserId, reasonCode: c.reasonCode, priority: c.priority, restricted: false, dueAt: new Date(scope.now.getTime() + c.dueInMinutes * 60_000) }),
        resolveFor: async (scope, subjectType, subjectId) => {
          const c = await t.findOpenCase(scope, subjectType, subjectId);
          if (c) await t.updateCase(scope, c.id, { status: 'RESOLVED', resolvedAt: scope.now });
        },
        isOpen: async (id) => {
          const c = await t.loadCase(null, id);
          return !!c && c.status !== 'RESOLVED';
        },
        audit: (scope, a) => t.audit(scope, a),
      }),
      inject: [TRUST_REPOSITORY],
    },
    {
      provide: SafetyUseCases,
      useFactory: (r: SafetyRepository, s: SubjectReader, k: SafetyCaseSink, b: CommandBus, c: Clock, rnd: RandomSource, e: EventPublisher, cfg: AppConfig, o: OutingSafetyPort | null) =>
        new SafetyUseCases(r, s, k, b, c, rnd, e, DEFAULT_TUNING.safety, cfg.PUBLIC_WEB_ORIGIN, o ?? null),
      inject: [SAFETY_REPOSITORY, SUBJECT_READER, SAFETY_CASE_SINK, COMMAND_BUS, CLOCK, RANDOM, EVENT_PUBLISHER, APP_CONFIG, { token: OUTING_SAFETY_PORT, optional: true }],
    },
    {
      provide: SAFETY_STAFF_PORT,
      useFactory: (r: SafetyRepository, k: SafetyCaseSink, o: OutingSafetyPort | null, b: CommandBus, u: UnitOfWork, c: Clock, rnd: RandomSource) => new SafetyStaffService(r, k, o ?? null, b, u, c, rnd),
      inject: [SAFETY_REPOSITORY, SAFETY_CASE_SINK, { token: OUTING_SAFETY_PORT, optional: true }, COMMAND_BUS, UNIT_OF_WORK, CLOCK, RANDOM],
    },
    {
      provide: BLOCK_SAFETY_HOOK,
      useFactory: (o: OutingSafetyPort | null, r: SafetyRepository, k: SafetyCaseSink, rnd: RandomSource) => new BlockRemovalHook(o ?? null, r, k, rnd, DEFAULT_TUNING.safety),
      inject: [{ token: OUTING_SAFETY_PORT, optional: true }, SAFETY_REPOSITORY, SAFETY_CASE_SINK, RANDOM],
    },
    {
      provide: SAFETY_OUTBOX,
      useFactory: (s: SafetyUseCases, sr: SubjectReader, k: SafetyCaseSink, p: GuardianPushSender): { consumers: OutboxConsumer[]; effects: OutboxEffect[] } => ({
        consumers: [new GuardianRevocationConsumer(s, sr), new KnowsSomeoneReviewConsumer(k, sr), new AlertAckConsumer(s), new UneasyLeaveConsumer(s, sr)],
        effects: [new GuardianPushEffect(s, p)],
      }),
      inject: [SafetyUseCases, SUBJECT_READER, SAFETY_CASE_SINK, GUARDIAN_PUSH_SENDER],
    },
    {
      provide: SAFETY_JOBS,
      useFactory: (r: SafetyRepository): RecurringJob[] => [
        {
          name: 'safety.purge',
          everyMs: 60 * 60_000,
          run: async (now: Date) => ({
            positions: await r.purgeAlertPositions(now),
            push: await r.purgePushSubscriptions(now),
            links: await r.purgeExpiredLinks(new Date(now.getTime() - GUARDIAN_METADATA_RETENTION_DAYS * DAY)),
          }),
        },
      ],
      inject: [SAFETY_REPOSITORY],
    },
  ],
  exports: [BLOCK_SAFETY_HOOK, SAFETY_STAFF_PORT, SAFETY_OUTBOX, SAFETY_JOBS, SafetyUseCases, GUARDIAN_PUSH_SENDER, SAFETY_REPOSITORY],
})
export class SafetyModule {}
