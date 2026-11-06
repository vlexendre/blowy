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
import { RELIABILITY_PORT, type ReliabilityPort } from '../../shared/application/ports/reliability.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { APP_CONFIG, BLOCK_READER, CLOCK, COMMAND_BUS, DB, ENTITLEMENTS_READER, EVENT_PUBLISHER, RANDOM, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { MESSAGE_AUTHOR_RESOLVER } from '../../shared/application/ports/message-author.port.js';
import type { BlockReader } from '../../shared/application/ports/block-reader.port.js';
import { PrismaMessageAuthors } from './infrastructure/message-authors.js';
import { ONCALL_COVERAGE, type OnCallCoverage } from '../../shared/application/ports/oncall-coverage.port.js';
import { selectOnCallCoverage } from '../../shared/infrastructure/oncall/prisma-oncall-coverage.js';
import { hourKey, type RecurringJob } from '../../jobs/scheduler.js';
import { loadAdminConfig } from '../admin/infrastructure/admin-config.js';
import { isPaused } from './domain/reliability.js';
import { OutingJobs } from './application/jobs.js';
import { OutingLifecycle } from './application/lifecycle.service.js';
import { OutingEvents } from './application/outing-events.js';
import { OUTINGS_REPOSITORY, type OutingsRepository } from './application/ports/outings.repository.js';
import { SEAT_FUNDING, type SeatFundingPort } from './application/ports/seat-funding.port.js';
import { OutingQueries } from './application/queries.js';
import { OutingRequestsUseCases } from './application/requests.use-cases.js';
import { SeatUseCases } from './application/seats.use-cases.js';
import { OutingSafetyService } from './application/safety-port.service.js';
import { OUTING_SAFETY_PORT } from '../../shared/application/ports/outing-safety.port.js';
import { OUTING_ADMIN_PORT } from '../../shared/application/ports/outing-admin.port.js';
import { OutingAdminService, venueSecretFrom } from './application/admin-port.service.js';
import { TeamUseCases } from './application/teams.use-cases.js';
import { LocalSeatFunding } from './infrastructure/local-seat-funding.js';
import { OutingsSeatPaymentSink } from './infrastructure/seat-payment-sink.js';
import { SEAT_PAYMENT_SINK, type SeatPaymentSink } from '../../shared/application/ports/seat-payment-sink.port.js';
/** Jeton fourni par EconomyModule (T3) — `Symbol.for` : aucun import du module économie. */
const ECONOMY_SEAT_FUNDING = Symbol.for('blowy.economy.seat_funding');
import { PrismaOutingsRepository } from './infrastructure/prisma-outings.repository.js';
import { OutingsController, TeamsController } from './interface/outings.controller.js';
import { OnCallController } from './interface/oncall.controller.js';
import { CityInsightsController } from './interface/city-insights.controller.js';
import { CityInsights } from './infrastructure/city-insights.js';

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
  controllers: [OutingsController, TeamsController, OnCallController, CityInsightsController],
  providers: [
    // V5.5 (D-059) : indicateurs de ville (photographie quotidienne).
    { provide: CityInsights, useFactory: (db: Db, t: Tuning, cfg: AppConfig) => new CityInsights(db, t, cfg.MEDIA_TOKEN_SECRET ?? cfg.SESSION_SECRET), inject: [DB, OUTINGS_TUNING, APP_CONFIG] },
    // V5.5 (D-058) : couverture d'astreinte (aussi consommée par connections pour les RDV duo).
    { provide: ONCALL_COVERAGE, useFactory: (db: Db, cfg: AppConfig) => selectOnCallCoverage(db, cfg), inject: [DB, APP_CONFIG] },
    { provide: OUTINGS_TUNING, useValue: DEFAULT_TUNING },
    { provide: OUTINGS_REPOSITORY, useFactory: (db: Db, t: Tuning) => new PrismaOutingsRepository(db, t), inject: [DB, OUTINGS_TUNING] },
    // V5 (§2.8) : auteurs du chat de sortie signés par leur pet (prénom à la confirmation), lu par `conversations`.
    { provide: MESSAGE_AUTHOR_RESOLVER, useFactory: (db: Db, b: BlockReader) => new PrismaMessageAuthors(db, b), inject: [DB, BLOCK_READER] },
    {
      provide: SEAT_FUNDING,
      // T3 (G) : financement réel fourni par `economy` (crédits, Stripe, remboursements) ; repli T2 si absent.
      useFactory: (economy: SeatFundingPort | null, e: EntitlementsReader | null, cfg: AppConfig, t: Tuning) => economy ?? new LocalSeatFunding(e ?? null, !cfg.isProduction, t),
      inject: [{ token: ECONOMY_SEAT_FUNDING, optional: true }, { token: ENTITLEMENTS_READER, optional: true }, APP_CONFIG, OUTINGS_TUNING],
    },
    {
      provide: SEAT_PAYMENT_SINK,
      useFactory: (r: R, l: OutingLifecycle, e: OutingEvents): SeatPaymentSink => new OutingsSeatPaymentSink(r, l, e),
      inject: [OUTINGS_REPOSITORY, OutingLifecycle, OutingEvents],
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
    { provide: OutingQueries, useFactory: (r: R, p: PhotoTokenIssuer, c: Clock, t: Tuning) => new OutingQueries(r, p, c, t), inject: [OUTINGS_REPOSITORY, PHOTO_TOKEN_ISSUER, CLOCK, OUTINGS_TUNING] },
    {
      provide: TeamUseCases,
      useFactory: (r: R, b: CommandBus, c: Clock, rnd: RandomSource, t: Tuning) => new TeamUseCases(r, b, c, rnd, t, loadAdminConfig().publicWebOrigin),
      inject: [OUTINGS_REPOSITORY, COMMAND_BUS, CLOCK, RANDOM, OUTINGS_TUNING],
    },
    {
      provide: OutingJobs,
      useFactory: (r: R, u: UnitOfWork, l: OutingLifecycle, ch: GroupChatPort, e: OutingEvents, rnd: RandomSource, t: Tuning, oc: OnCallCoverage) => new OutingJobs(r, u, l, ch, e, rnd, t, oc),
      inject: [OUTINGS_REPOSITORY, UNIT_OF_WORK, OutingLifecycle, GROUP_CHAT_PORT, OutingEvents, RANDOM, OUTINGS_TUNING, ONCALL_COVERAGE],
    },
    // T4 (agent E) : retrait système au blocage et décision « je connais quelqu'un » (port, ajout minimal).
    { provide: OUTING_SAFETY_PORT, useFactory: (r: R, s: SeatUseCases) => new OutingSafetyService(r, s), inject: [OUTINGS_REPOSITORY, SeatUseCases] },
    // T6 (agent F) : exploitation staff / lieu partenaire (annulation, retrait, contestations, pause, code du chevalet).
    {
      provide: OUTING_ADMIN_PORT,
      useFactory: (r: R, l: OutingLifecycle, s: SeatUseCases, cfg: AppConfig) => new OutingAdminService(r, l, s, venueSecretFrom(cfg.MEDIA_TOKEN_SECRET ?? cfg.SESSION_SECRET)),
      inject: [OUTINGS_REPOSITORY, OutingLifecycle, SeatUseCases, APP_CONFIG],
    },
    { provide: OUTING_REVEAL_READER, useFactory: (r: R): OutingRevealReader => ({ canSeeProfilePhoto: (v, o, at) => r.photoRevealAllowed(v, o, at) }), inject: [OUTINGS_REPOSITORY] },
    // T5 (C2) : fiabilité des RDV duo, écrite ici (seul écrivain de ReliabilityStat).
    {
      provide: RELIABILITY_PORT,
      useFactory: (l: OutingLifecycle, r: R): ReliabilityPort => ({
        recordDuoDate: (scope, i) => (i.outcome === 'ATTENDED' ? l.attendance(scope, i.userId, i.key) : l.absence(scope, i.userId, i.outcome, i.key, true)),
        isPaused: async (scope, userId, at) => isPaused(await r.reliability(scope, userId), at),
      }),
      inject: [OutingLifecycle, OUTINGS_REPOSITORY],
    },
    { provide: OUTING_ROOMS, useFactory: (r: R, c: Clock): OutingRooms => ({ outing: (u, id) => r.outingRoomMember(u, id, c.now()), duo: (u, id) => r.duoRoomMember(u, id) }), inject: [OUTINGS_REPOSITORY, CLOCK] },
    {
      provide: OUTINGS_JOBS,
      useFactory: (j: OutingJobs, req: OutingRequestsUseCases, ci: CityInsights): RecurringJob[] => [
        // V5.5 (D-059) : photographie quotidienne des indicateurs de ville (idempotente par jour).
        { name: 'neighborhoods.city_insights', everyMs: 60 * MIN, windowKey: hourKey, run: (now) => ci.snapshot(now) },
        // D-052 : demande hebdo automatique depuis les créneaux cochés (pendant la fenêtre de demande).
        { name: 'outings.auto_requests', everyMs: 60 * MIN, windowKey: hourKey, run: (now) => req.autoRequests(now) },
        // V5.5 (D-053) : composition glissante par (ville, jour) à J − 3 21 h.
        { name: 'outings.compose', everyMs: 5 * MIN, run: (now) => j.composeRolling(now) },
        { name: 'outings.seeding', everyMs: 15 * MIN, run: (now) => j.composeSeeding(now) },
        { name: 'outings.lifecycle', everyMs: 5 * MIN, run: (now) => j.lifecycleSweep(now) },
        { name: 'outings.purge', everyMs: 60 * MIN, windowKey: hourKey, run: (now) => j.purge(now) },
      ],
      inject: [OutingJobs, OutingRequestsUseCases, CityInsights],
    },
  ],
  exports: [ONCALL_COVERAGE, MESSAGE_AUTHOR_RESOLVER, SEAT_PAYMENT_SINK, OUTING_SAFETY_PORT, OUTING_ADMIN_PORT, OUTING_REVEAL_READER, OUTING_ROOMS, RELIABILITY_PORT, OUTINGS_JOBS, OUTINGS_REPOSITORY, OutingJobs, OutingLifecycle],
})
export class OutingsModule {}
