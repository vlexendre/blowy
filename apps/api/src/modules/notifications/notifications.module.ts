/**
 * Composition root du module `notifications` (agent G, T8 — spec-v5 §9, D-028, D-052) :
 * consommateur outbox (planification), job `notifications.plan` (livraison, rythme, mode discret),
 * préférences par catégorie, jeton d'appareil, envoi Expo derrière le port `PUSH_SENDER`.
 * Web Push de la page ange : déjà livré par `safety` (T4, `GuardianPushEffect`) — réutilisé, non dupliqué.
 */
import { Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import { DEFAULT_TUNING } from '@blowy/tuning';
import type { AppConfig } from '../../config/env.js';
import type { RecurringJob } from '../../jobs/scheduler.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { OutboxConsumer } from '../../shared/application/outbox-consumer.js';
import type { Logger } from '../../shared/infrastructure/logging/logger.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB, LOGGER, RANDOM } from '../../shared/shared.tokens.js';
import { NotificationsConsumer } from './application/consumers.js';
import { NotificationDelivery } from './application/delivery.service.js';
import { NotificationPlanner } from './application/planner.js';
import { NOTIFICATION_FACTS, NOTIFICATION_REPOSITORY, PUSH_SENDER, type NotificationFactsReader, type NotificationRepository, type PushSender } from './application/ports.js';
import { RelevanceResolver } from './application/relevance.js';
import { NotificationSettingsUseCases } from './application/settings.use-cases.js';
import { PrismaNotificationFactsReader } from './infrastructure/prisma-facts.reader.js';
import { PrismaNotificationRepository } from './infrastructure/prisma-notifications.repository.js';
import { readPushConfig, selectPushSender } from './infrastructure/push-senders.js';
import { NotificationsController } from './interface/notifications.controller.js';

export const NOTIFICATIONS_OUTBOX_CONSUMERS = Symbol('NotificationsOutboxConsumers');
export const NOTIFICATIONS_JOBS = Symbol('NotificationsJobs');
const TUNING = DEFAULT_TUNING.notifications.v5;

@Module({
  controllers: [NotificationsController],
  providers: [
    { provide: NOTIFICATION_REPOSITORY, useFactory: (db: Db) => new PrismaNotificationRepository(db), inject: [DB] },
    { provide: NOTIFICATION_FACTS, useFactory: (db: Db) => new PrismaNotificationFactsReader(db), inject: [DB] },
    { provide: PUSH_SENDER, useFactory: (cfg: AppConfig, c: Clock, l: Logger) => selectPushSender(readPushConfig(process.env, cfg.isProduction), c, l), inject: [APP_CONFIG, CLOCK, LOGGER] },
    { provide: NotificationPlanner, useFactory: (r: NotificationRepository, f: NotificationFactsReader, rnd: RandomSource) => new NotificationPlanner(r, f, rnd, TUNING), inject: [NOTIFICATION_REPOSITORY, NOTIFICATION_FACTS, RANDOM] },
    { provide: RelevanceResolver, useFactory: (f: NotificationFactsReader, r: NotificationRepository) => new RelevanceResolver(f, r), inject: [NOTIFICATION_FACTS, NOTIFICATION_REPOSITORY] },
    {
      provide: NotificationDelivery,
      useFactory: (r: NotificationRepository, f: NotificationFactsReader, rr: RelevanceResolver, s: PushSender, l: Logger) => new NotificationDelivery(r, f, rr, s, TUNING, l),
      inject: [NOTIFICATION_REPOSITORY, NOTIFICATION_FACTS, RelevanceResolver, PUSH_SENDER, LOGGER],
    },
    {
      provide: NotificationSettingsUseCases,
      useFactory: (r: NotificationRepository, f: NotificationFactsReader, b: CommandBus, c: Clock) => new NotificationSettingsUseCases(r, f, b, c, TUNING),
      inject: [NOTIFICATION_REPOSITORY, NOTIFICATION_FACTS, COMMAND_BUS, CLOCK],
    },
    {
      provide: NOTIFICATIONS_OUTBOX_CONSUMERS,
      useFactory: (p: NotificationPlanner, f: NotificationFactsReader, r: NotificationRepository): OutboxConsumer[] => [new NotificationsConsumer(p, f, r)],
      inject: [NotificationPlanner, NOTIFICATION_FACTS, NOTIFICATION_REPOSITORY],
    },
    {
      provide: NOTIFICATIONS_JOBS,
      useFactory: (d: NotificationDelivery): RecurringJob[] => [{ name: 'notifications.plan', everyMs: 60_000, run: (now: Date) => d.run(now) }],
      inject: [NotificationDelivery],
    },
  ],
  exports: [NOTIFICATIONS_OUTBOX_CONSUMERS, NOTIFICATIONS_JOBS, PUSH_SENDER, NotificationDelivery],
})
export class NotificationsModule {}
