/**
 * Composition root du module `outings` (spec-v5 §2.4–2.14, V5.1) : demandes, composition,
 * sorties, places, chat de groupe (port conversations), check-in, votes, accords, bande (lecture),
 * fiabilité, teams. @Global : expose les ports consommés par `media` (révélation photo), la
 * gateway WS (salles `outing:`/`duo:`) et les jobs du worker.
 */
import { createHmac } from 'node:crypto';
import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import { DEFAULT_TUNING, type Tuning } from '@blowy/tuning';
import type { AppConfig } from '../../config/env.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { EventPublisher } from '../../shared/application/event-publisher.js';
import type { EntitlementsReader } from '../../shared/application/ports/entitlements-reader.port.js';
import { GROUP_CHAT_PORT, type GroupChatPort } from '../../shared/application/ports/group-chat.port.js';
import { OUTING_REVEAL_READER, PHOTO_TOKEN_ISSUER, type OutingRevealReader, type PhotoTokenIssuer } from '../../shared/application/ports/outing-photos.port.js';
import { PET_MEMORY_PORT, type PetMemoryPort } from '../../shared/application/ports/pet-memory.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { APP_CONFIG, CLOCK, COMMAND_BUS, DB, ENTITLEMENTS_READER, EVENT_PUBLISHER, RANDOM, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { hourKey, type RecurringJob } from '../../jobs/scheduler.js';
import { loadAdminConfig } from '../admin/infrastructure/admin-config.js';
import { OutingJobs } from './application/jobs.js';
import { OutingLifecycle } from './application/lifecycle.service.js';
import { OutingEvents } from './application/outing-events.js';
import { OUTINGS_REPOSITORY, type OutingsRepository } from './application/ports/outings.repository.js';
import { SEAT_FUNDING, type SeatFundingPort } from './application/ports/seat-funding.port.js';
import { OutingQueries } from './application/queries.js';
import { OutingRequestsUseCases } from './application/requests.use-cases.js';
import { SeatUseCases } from './application/seats.use-cases.js';
import { TeamUseCases } from './application/teams.use-cases.js';
import { LocalSeatFunding } from './infrastructure/local-seat-funding.js';
import { PrismaOutingsRepository } from './infrastructure/prisma-outings.repository.js';
import { OutingsController, TeamsController } from './interface/outings.controller.js';

export const OUTINGS_TUNING = Symbol('OutingsTuning');
export const OUTINGS_JOBS = Symbol('OutingsJobs');
/** Appartenance aux salles WS V5 (consommé par la gateway temps réel). */
export const OUTING_ROOMS = Symbol('OutingRooms');
export interface OutingRooms {
  outing(userId: string, outingId: string): Promise<boolean>;
  duo(userId: string, duoId: string): Promise<boolean>;
}

const MIN = 60_000;
type R = OutingsRepository;

@Global()
@Module({
  controllers: [OutingsController, TeamsController],
  providers: [
    { provide: OUTINGS_TUNING, useValue: DEFAULT_TUNING },
    { provide: OUTINGS_REPOSITORY, useFactory: (db: Db, t: Tuning) => new PrismaOutingsRepository(db, t), inject: [DB, OUTINGS_TUNING] },
    {
      provide: SEAT_FUNDING,
      useFactory: (e: EntitlementsReader | null, cfg: AppConfig, t: Tuning) => new LocalSeatFunding(e ?? null, !cfg.isProduction, t),
      inject: [{ token: ENTITLEMENTS_READER, optional: true }, APP_CONFIG, OUTINGS_TUNING],
    },
    { provide: OutingEvents, useFactory: (p: EventPublisher, r: RandomSource) => new OutingEvents(p, r), inject: [EVENT_PUBLISHER, RANDOM] },
    {
      provide: OutingLifecycle,
      useFactory: (u: UnitOfWork, r: R, c: GroupChatPort, m: PetMemoryPort, f: SeatFundingPort, e: OutingEvents, rnd: RandomSource, t: Tuning) => new OutingLifecycle(u, r, c, m, f, e, rnd, t),
      inject: [UNIT_OF_WORK, OUTINGS_REPOSITORY, GROUP_CHAT_PORT, PET_MEMORY_PORT, SEAT_FUNDING, OutingEvents, RANDOM, OUTINGS_TUNING],
    },
    {
      provide: OutingRequestsUseCases,
      useFactory: (r: R, b: CommandBus, c: Clock, rnd: RandomSource, t: Tuning) => new OutingRequestsUseCases(r, b, c, rnd, t),
      inject: [OUTINGS_REPOSITORY, COMMAND_BUS, CLOCK, RANDOM, OUTINGS_TUNING],
    },
    {
      provide: SeatUseCases,
      useFactory: (r: R, b: CommandBus, l: OutingLifecycle, f: SeatFundingPort, ch: GroupChatPort, e: OutingEvents, rnd: RandomSource, t: Tuning, cfg: AppConfig) => {
        // Secret d'un lieu = HMAC(base serveur, référence du lieu) : jamais stocké en clair.
        const base = cfg.MEDIA_TOKEN_SECRET ?? cfg.SESSION_SECRET;
        return new SeatUseCases(r, b, l, f, ch, e, rnd, t, (ref) => createHmac('sha256', base).update(`venue-checkin:${ref}`).digest('hex'));
      },
      inject: [OUTINGS_REPOSITORY, COMMAND_BUS, OutingLifecycle, SEAT_FUNDING, GROUP_CHAT_PORT, OutingEvents, RANDOM, OUTINGS_TUNING, APP_CONFIG],
    },
    { provide: OutingQueries, useFactory: (r: R, p: PhotoTokenIssuer, c: Clock) => new OutingQueries(r, p, c), inject: [OUTINGS_REPOSITORY, PHOTO_TOKEN_ISSUER, CLOCK] },
    {
      provide: TeamUseCases,
      useFactory: (r: R, b: CommandBus, c: Clock, rnd: RandomSource, t: Tuning) => new TeamUseCases(r, b, c, rnd, t, loadAdminConfig().publicWebOrigin),
      inject: [OUTINGS_REPOSITORY, COMMAND_BUS, CLOCK, RANDOM, OUTINGS_TUNING],
    },
    {
      provide: OutingJobs,
      useFactory: (r: R, u: UnitOfWork, l: OutingLifecycle, ch: GroupChatPort, e: OutingEvents, rnd: RandomSource, t: Tuning) => new OutingJobs(r, u, l, ch, e, rnd, t),
      inject: [OUTINGS_REPOSITORY, UNIT_OF_WORK, OutingLifecycle, GROUP_CHAT_PORT, OutingEvents, RANDOM, OUTINGS_TUNING],
    },
    { provide: OUTING_REVEAL_READER, useFactory: (r: R): OutingRevealReader => ({ canSeeProfilePhoto: (v, o, at) => r.photoRevealAllowed(v, o, at) }), inject: [OUTINGS_REPOSITORY] },
    { provide: OUTING_ROOMS, useFactory: (r: R, c: Clock): OutingRooms => ({ outing: (u, id) => r.outingRoomMember(u, id, c.now()), duo: (u, id) => r.duoRoomMember(u, id) }), inject: [OUTINGS_REPOSITORY, CLOCK] },
    {
      provide: OUTINGS_JOBS,
      useFactory: (j: OutingJobs): RecurringJob[] => [
        { name: 'outings.compose', everyMs: 5 * MIN, run: (now) => j.composeWeekly(now) },
        { name: 'outings.seeding', everyMs: 15 * MIN, run: (now) => j.composeSeeding(now) },
        { name: 'outings.lifecycle', everyMs: 5 * MIN, run: (now) => j.lifecycleSweep(now) },
        { name: 'outings.purge', everyMs: 60 * MIN, windowKey: hourKey, run: (now) => j.purge(now) },
      ],
      inject: [OutingJobs],
    },
  ],
  exports: [OUTING_REVEAL_READER, OUTING_ROOMS, OUTINGS_JOBS, OUTINGS_REPOSITORY, OutingJobs, OutingLifecycle],
})
export class OutingsModule {}
