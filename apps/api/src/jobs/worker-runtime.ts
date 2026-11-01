/**
 * Graphe du worker (sans HTTP) : relais outbox (consommateurs + effets), jobs récurrents.
 * Partagé par worker.ts et les tests d'intégration (même code, aucune duplication).
 */
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

export interface WorkerGraph {
  dispatcher: OutboxDispatcher;
  jobs: RecurringJob[];
}

export function buildWorkerGraph(ctx: INestApplicationContext, extraEffects: OutboxEffect[] = []): WorkerGraph {
  const db = ctx.get<Db>(DB);
  const uow = ctx.get<UnitOfWork>(UNIT_OF_WORK);
  const logger = ctx.get<Logger>(LOGGER);
  const consumers: OutboxConsumer[] = [...ctx.get<OutboxConsumer[]>(ECONOMY_OUTBOX_CONSUMERS), ...ctx.get(RelationshipConsumers).list()];
  const effects: OutboxEffect[] = [new MessageModerationEffect(ctx.get(ModerateMessageUseCase)), ...extraEffects];
  const dispatcher = new OutboxDispatcher(db, uow, consumers, effects, logger);
  const matching = ctx.get(RunMatchingBatchUseCase);
  const matchingRepo = ctx.get<MatchingRepository>(MATCHING_REPOSITORY);
  const jobs: RecurringJob[] = [
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
  ];
  return { dispatcher, jobs };
}
