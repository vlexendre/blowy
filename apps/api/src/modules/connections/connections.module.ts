/**
 * Composition root du module `connections` (spec-v5 §2.11–2.12, T5 / C2) : bande (« partir
 * proprement », « Ta rue »), duos (voie Duo, RDV, après-RDV, œuf en drapeau), branche DUO_LANE.
 * Consomme des ports seulement : conversations (chat DUO/BAND), pets (souvenirs), media (jetons
 * photo), economy (Blowy+ = duos illimités), outings (fiabilité, bande en lecture, blocages), trust
 * (blocages). Fournit à `safety` le sujet DUO_DATE de l'ange gardien.
 */
import { createHmac } from 'node:crypto';
import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import { DEFAULT_TUNING, type Tuning } from '@blowy/tuning';
import type { AppConfig } from '../../config/env.js';
import type { RecurringJob } from '../../jobs/scheduler.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { EventPublisher } from '../../shared/application/event-publisher.js';
import type { OutboxConsumer } from '../../shared/application/outbox-consumer.js';
import type { BlockReader } from '../../shared/application/ports/block-reader.port.js';
import { DUO_DATE_SUBJECT_READER, type DuoDateSubjectReader } from '../../shared/application/ports/duo-date-subject.port.js';
import type { EntitlementsReader } from '../../shared/application/ports/entitlements-reader.port.js';
import { GROUP_CHAT_PORT, type GroupChatPort } from '../../shared/application/ports/group-chat.port.js';
import { PHOTO_TOKEN_ISSUER, type PhotoTokenIssuer } from '../../shared/application/ports/outing-photos.port.js';
import { PET_MEMORY_PORT, type PetMemoryPort } from '../../shared/application/ports/pet-memory.port.js';
import { RELIABILITY_PORT, type ReliabilityPort } from '../../shared/application/ports/reliability.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { DUO_ALLOWANCE, type DuoAllowanceReader } from '../../shared/application/ports/duo-allowance.port.js';
import { APP_CONFIG, BLOCK_READER, CLOCK, COMMAND_BUS, DB, ENTITLEMENTS_READER, EVENT_PUBLISHER, RANDOM, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { OUTINGS_REPOSITORY, type OutingsRepository } from '../outings/application/ports/outings.repository.js';
import type { ConnectionsDeps } from './application/deps.js';
import { DuoEnding } from './application/duo-ending.js';
import { DuoEvents } from './application/duo-events.js';
import { ConnectionsBlockConsumer, DuoLifecycle } from './application/duo-lifecycle.js';
import { DuoUseCases } from './application/duos.use-cases.js';
import { isMember } from './application/duos.use-cases.js';
import { CONNECTIONS_REPOSITORY, type ConnectionsRepository } from './application/ports/connections.repository.js';
import { ConnectionQueries } from './application/queries.js';
import { PrismaConnectionsRepository } from './infrastructure/prisma-connections.repository.js';
import { ConnectionsController } from './interface/connections.controller.js';

import { ONCALL_COVERAGE, type OnCallCoverage } from '../../shared/application/ports/oncall-coverage.port.js';

export const CONNECTIONS_TUNING = Symbol('ConnectionsTuning');
export const CONNECTIONS_DEPS = Symbol('ConnectionsDeps');
export const CONNECTIONS_JOBS = Symbol('ConnectionsJobs');
export const CONNECTIONS_OUTBOX_CONSUMERS = Symbol('ConnectionsOutboxConsumers');

const MIN = 60_000;

@Global()
@Module({
  controllers: [ConnectionsController],
  providers: [
    { provide: CONNECTIONS_TUNING, useValue: DEFAULT_TUNING },
    { provide: CONNECTIONS_REPOSITORY, useFactory: (db: Db, t: Tuning) => new PrismaConnectionsRepository(db, t), inject: [DB, CONNECTIONS_TUNING] },
    { provide: DuoEvents, useFactory: (p: EventPublisher, r: RandomSource) => new DuoEvents(p, r), inject: [EVENT_PUBLISHER, RANDOM] },
    { provide: DuoEnding, useFactory: (r: ConnectionsRepository, c: GroupChatPort, e: DuoEvents) => new DuoEnding(r, c, e), inject: [CONNECTIONS_REPOSITORY, GROUP_CHAT_PORT, DuoEvents] },
    {
      provide: CONNECTIONS_DEPS,
      useFactory: (repo: ConnectionsRepository, bus: CommandBus, uow: UnitOfWork, chat: GroupChatPort, memories: PetMemoryPort, reliability: ReliabilityPort, photos: PhotoTokenIssuer, entitlements: EntitlementsReader | null, blocks: BlockReader, events: DuoEvents, ending: DuoEnding, random: RandomSource, clock: Clock, tuning: Tuning, cfg: AppConfig, allowance: DuoAllowanceReader | null, oncall: OnCallCoverage | null): ConnectionsDeps => {
        // Secret d'un lieu = HMAC(base serveur, référence du lieu) — même dérivation que les sorties.
        const base = cfg.MEDIA_TOKEN_SECRET ?? cfg.SESSION_SECRET;
        return { repo, bus, uow, chat, memories, reliability, photos, entitlements: entitlements ?? null, allowance: allowance ?? null, blocks, events, ending, random, clock, tuning, oncall: oncall ?? null, secretOf: (ref) => createHmac('sha256', base).update(`venue-checkin:${ref}`).digest('hex') };
      },
      inject: [CONNECTIONS_REPOSITORY, COMMAND_BUS, UNIT_OF_WORK, GROUP_CHAT_PORT, PET_MEMORY_PORT, RELIABILITY_PORT, PHOTO_TOKEN_ISSUER, { token: ENTITLEMENTS_READER, optional: true }, BLOCK_READER, DuoEvents, DuoEnding, RANDOM, CLOCK, CONNECTIONS_TUNING, APP_CONFIG, { token: DUO_ALLOWANCE, optional: true }, { token: ONCALL_COVERAGE, optional: true }],
    },
    { provide: DuoUseCases, useFactory: (x: ConnectionsDeps) => new DuoUseCases(x), inject: [CONNECTIONS_DEPS] },
    { provide: DuoLifecycle, useFactory: (x: ConnectionsDeps, d: DuoUseCases) => new DuoLifecycle(x, d), inject: [CONNECTIONS_DEPS, DuoUseCases] },
    { provide: ConnectionQueries, useFactory: (x: ConnectionsDeps, d: DuoUseCases, o: OutingsRepository) => new ConnectionQueries(x, d, o), inject: [CONNECTIONS_DEPS, DuoUseCases, OUTINGS_REPOSITORY] },
    {
      provide: DUO_DATE_SUBJECT_READER,
      useFactory: (r: ConnectionsRepository): DuoDateSubjectReader => ({
        async subjectFor(userId, duoDateId) {
          const date = await r.date(null, duoDateId);
          const duo = date ? await r.duo(null, date.duoId) : null;
          if (!date || !duo || !isMember(duo, userId)) return null;
          const venue = await r.venue(date.venueId);
          return { duoDateId, status: date.status, startsAt: date.startsAt, endsAt: date.endsAt, venue: { name: venue?.name ?? '', address: venue?.address ?? '' }, myCheckedInAt: duo.userLowId === userId ? date.checkinLowAt : date.checkinHighAt };
        },
      }),
      inject: [CONNECTIONS_REPOSITORY],
    },
    {
      provide: CONNECTIONS_JOBS,
      useFactory: (l: DuoLifecycle): RecurringJob[] => [
        { name: 'duos.lifecycle', everyMs: 15 * MIN, run: (now) => l.sweep(now) },
        { name: 'duos.lane', everyMs: 15 * MIN, run: (now) => l.runLane(now) },
      ],
      inject: [DuoLifecycle],
    },
    { provide: CONNECTIONS_OUTBOX_CONSUMERS, useFactory: (l: DuoLifecycle): OutboxConsumer[] => [new ConnectionsBlockConsumer(l)], inject: [DuoLifecycle] },
  ],
  exports: [DUO_DATE_SUBJECT_READER, CONNECTIONS_JOBS, CONNECTIONS_OUTBOX_CONSUMERS, DuoLifecycle],
})
export class ConnectionsModule {}
