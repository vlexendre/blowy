/**
 * Graphe du worker (sans HTTP) : relais outbox (consommateurs + effets), jobs récurrents.
 * Partagé par worker.ts et les tests d'intégration (même code, aucune duplication).
 */
import { SOCIAL_JOBS, SOCIAL_OUTBOX_EFFECTS } from '../modules/social/social.module.js';
import type { SocialJob } from '../modules/social/interface/social.consumers.js';
import type { INestApplicationContext } from '@nestjs/common';
import type { Db } from '@blowy/database';
import type { OutboxConsumer, OutboxEffect } from '../shared/application/outbox-consumer.js';
import type { UnitOfWork } from '../shared/application/unit-of-work.js';
import { OutboxDispatcher } from '../shared/infrastructure/outbox/outbox-dispatcher.js';
import type { Logger } from '../shared/infrastructure/logging/logger.js';
import { DB, LOGGER, UNIT_OF_WORK } from '../shared/shared.tokens.js';
import { ModerateMessageUseCase } from '../modules/conversations/application/moderate-message.use-case.js';
import { MessageModerationEffect } from '../modules/conversations/infrastructure/message-moderation.consumer.js';
import { ECONOMY_JOBS, ECONOMY_OUTBOX_CONSUMERS } from '../modules/economy/economy.module.js';
import type { EconomyJobs } from '../modules/economy/interface/economy.jobs.js';
import { RunMatchingBatchUseCase } from '../modules/matching/application/run-matching-batch.use-case.js';
import { MATCHING_REPOSITORY, type MatchingRepository } from '../modules/matching/application/ports/matching.repository.js';
import { TickPetsUseCase } from '../modules/pets/application/tick-pets.use-case.js';
import { BranchVoteUseCase } from '../modules/relationships/application/branch-vote.use-case.js';
import { ReliabilityJob } from '../modules/relationships/application/reliability.use-case.js';
import { RelationshipConsumers } from '../modules/relationships/infrastructure/relationship.consumers.js';
import { hourKey, quarterKey, type RecurringJob } from './scheduler.js';
import { TRUST_JOBS, TRUST_OUTBOX } from '../modules/trust/trust.module.js';
import { MEDIA_JOBS } from '../modules/media/media.module.js';
import { NEIGHBORHOODS_JOBS } from '../modules/neighborhoods/neighborhoods.module.js';
import { OUTINGS_JOBS } from '../modules/outings/outings.module.js';
import { SAFETY_JOBS, SAFETY_OUTBOX } from '../modules/safety/safety.module.js';
import { CONNECTIONS_JOBS, CONNECTIONS_OUTBOX_CONSUMERS } from '../modules/connections/connections.module.js';

export interface WorkerGraph {
  dispatcher: OutboxDispatcher;
  jobs: RecurringJob[];
}

export function buildWorkerGraph(ctx: INestApplicationContext, extraEffects: OutboxEffect[] = []): WorkerGraph {
  const db = ctx.get<Db>(DB);
  const uow = ctx.get<UnitOfWork>(UNIT_OF_WORK);
  const logger = ctx.get<Logger>(LOGGER);
  const trust = ctx.get<{ consumers: OutboxConsumer[]; effects: OutboxEffect[] }>(TRUST_OUTBOX);
  // Agent E (T4) : révocations des liens gardien, dossier « je connais quelqu'un », accusé/Web Push d'alerte.
  const safety = ctx.get<{ consumers: OutboxConsumer[]; effects: OutboxEffect[] }>(SAFETY_OUTBOX);
  const consumers: OutboxConsumer[] = [...ctx.get<OutboxConsumer[]>(ECONOMY_OUTBOX_CONSUMERS), ...ctx.get(RelationshipConsumers).list(), ...trust.consumers, ...safety.consumers, ...ctx.get<OutboxConsumer[]>(CONNECTIONS_OUTBOX_CONSUMERS)];
  const effects: OutboxEffect[] = [new MessageModerationEffect(ctx.get(ModerateMessageUseCase)), ...trust.effects, ...safety.effects, ...ctx.get<OutboxEffect[]>(SOCIAL_OUTBOX_EFFECTS), ...extraEffects];
  const dispatcher = new OutboxDispatcher(db, uow, consumers, effects, logger);
  const matching = ctx.get(RunMatchingBatchUseCase);
  const matchingRepo = ctx.get<MatchingRepository>(MATCHING_REPOSITORY);
  const jobs: RecurringJob[] = [
    ...ctx.get<SocialJob[]>(SOCIAL_JOBS).map((j): RecurringJob => ({ name: j.name, everyMs: j.everyMs, run: () => j.run() })),
    { name: 'pets.tick', everyMs: 15 * 60_000, windowKey: quarterKey, run: (now) => ctx.get(TickPetsUseCase).execute(now) },
    { name: 'matching.daily', everyMs: 15 * 60_000, run: (now) => matching.runDueZones(now) },
    {
      name: 'matching.expire',
      everyMs: 15 * 60_000,
      run: (now) => uow.run((scope) => matchingRepo.expireDue(scope, now)),
    },
    { name: 'relationships.reliability', everyMs: 60 * 60_000, windowKey: hourKey, run: (now) => ctx.get(ReliabilityJob).run(now) },
    { name: 'relationships.branch_deadlines', everyMs: 15 * 60_000, run: (now) => ctx.get(BranchVoteUseCase).resolveDue(now) },
    ...ctx.get<EconomyJobs>(ECONOMY_JOBS).list().map((j): RecurringJob => ({ name: j.name, everyMs: j.everyMs, run: () => j.run() })),
    // Agent E : purge médias (rétention versionnée) et comptes supprimés.
    ...ctx.get<RecurringJob[]>(MEDIA_JOBS).map((j) => ({ ...j, windowKey: hourKey })),
    ...ctx.get<RecurringJob[]>(TRUST_JOBS).map((j) => ({ ...j, windowKey: hourKey })),
    // V5 (spec-v5 §7.8) : créneaux, composition hebdo, amorçage, cycle de vie des sorties, rétention.
    ...ctx.get<RecurringJob[]>(NEIGHBORHOODS_JOBS),
    ...ctx.get<RecurringJob[]>(OUTINGS_JOBS),
    // V5 T5 (C2) : cycle de vie des duos, lot quotidien de la voie Duo (21 h locale).
    ...ctx.get<RecurringJob[]>(CONNECTIONS_JOBS),
    // V5 T4 (agent E) : positions d'alerte 72 h, push gardien, métadonnées de liens (§8.5).
    ...ctx.get<RecurringJob[]>(SAFETY_JOBS).map((j) => ({ ...j, windowKey: hourKey })),
  ];
  return { dispatcher, jobs };
}
