/** Composition root relationships. Fournit aussi les ports consommés par pets/matching/conversations. */
import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { EventPublisher } from '../../shared/application/event-publisher.js';
import type { EngineGateway } from '../../shared/application/ports/engine.gateway.js';
import type { ProjectionReader } from '../../shared/application/projection.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import {
  CLOCK,
  COMMAND_BUS,
  DB,
  ENGINE_GATEWAY,
  EVENT_PUBLISHER,
  LINK_PROGRESS_PORT,
  PROJECTION_READER,
  RANDOM,
  RELATIONSHIP_CREATOR,
  RELATIONSHIP_READER,
  SHARED_ACTION_PORT,
  UNIT_OF_WORK,
} from '../../shared/shared.tokens.js';
import { StartPauseUseCase } from '../users/application/pause.use-case.js';
import { BranchVoteUseCase } from './application/branch-vote.use-case.js';
import { GetRelationshipsQuery } from './application/get-relationships.query.js';
import { LeaveRelationshipUseCase } from './application/leave-relationship.use-case.js';
import { LinkProgressService } from './application/link-progress.service.js';
import { MoveInUseCase } from './application/move-in.use-case.js';
import { PauseRelationshipUseCase } from './application/pause-relationship.use-case.js';
import { PET_PROFILE_READER, type PetProfileReader } from '../../shared/application/ports/pet-profile.reader.js';
import { CONVERSATION_ADMIN, PET_PLACEMENT, type ConversationAdmin, type PetPlacement } from './application/ports/relationship-side-effects.port.js';
import { RELATIONSHIP_REPOSITORY, type RelationshipRepository } from './application/ports/relationship.repository.js';
import { RelationshipCreatorService } from './application/relationship-creator.service.js';
import { RelationshipLifecycle } from './application/relationship-lifecycle.service.js';
import { RELIABILITY_LEDGER, ReliabilityJob, type ReliabilityLedger } from './application/reliability.use-case.js';
import { PrismaPetPlacement } from './infrastructure/prisma-pet-placement.js';
import { PrismaRelationshipReader } from './infrastructure/prisma-relationship.reader.js';
import { PrismaReliabilityLedger, PrismaRelationshipRepository } from './infrastructure/prisma-relationship.repository.js';
import { RelationshipsController } from './interface/relationships.controller.js';
import { RelationshipConsumers } from './infrastructure/relationship.consumers.js';

type R = RelationshipRepository;
@Global()
@Module({
  controllers: [RelationshipsController],
  providers: [
    RelationshipConsumers,
    { provide: RELATIONSHIP_REPOSITORY, useFactory: (db: Db) => new PrismaRelationshipRepository(db), inject: [DB] },
    { provide: RELIABILITY_LEDGER, useClass: PrismaReliabilityLedger },
    { provide: PET_PLACEMENT, useFactory: (e: EngineGateway) => new PrismaPetPlacement(e.params.sickHealthBelow), inject: [ENGINE_GATEWAY] },
    { provide: RelationshipLifecycle, useFactory: (r: R, c: ConversationAdmin, p: PetPlacement, e: EventPublisher) => new RelationshipLifecycle(r, c, p, e), inject: [RELATIONSHIP_REPOSITORY, CONVERSATION_ADMIN, PET_PLACEMENT, EVENT_PUBLISHER] },
    { provide: LinkProgressService, useFactory: (r: R, e: EngineGateway, l: RelationshipLifecycle, p: PrismaPetPlacement) => new LinkProgressService(r, e, l, p), inject: [RELATIONSHIP_REPOSITORY, ENGINE_GATEWAY, RelationshipLifecycle, PET_PLACEMENT] },
    { provide: LINK_PROGRESS_PORT, useExisting: LinkProgressService },
    { provide: SHARED_ACTION_PORT, useExisting: LinkProgressService },
    {
      provide: RELATIONSHIP_CREATOR,
      useFactory: (r: R, c: ConversationAdmin, l: RelationshipLifecycle, e: EngineGateway, rnd: RandomSource) => new RelationshipCreatorService(r, c, l, e, rnd),
      inject: [RELATIONSHIP_REPOSITORY, CONVERSATION_ADMIN, RelationshipLifecycle, ENGINE_GATEWAY, RANDOM],
    },
    { provide: RELATIONSHIP_READER, useFactory: (db: Db) => new PrismaRelationshipReader(db), inject: [DB] },
    { provide: GetRelationshipsQuery, useFactory: (r: R, p: PetProfileReader, pr: ProjectionReader, c: Clock) => new GetRelationshipsQuery(r, p, pr, c), inject: [RELATIONSHIP_REPOSITORY, PET_PROFILE_READER, PROJECTION_READER, CLOCK] },
    { provide: LeaveRelationshipUseCase, useFactory: (b: CommandBus, r: R, l: RelationshipLifecycle) => new LeaveRelationshipUseCase(b, r, l), inject: [COMMAND_BUS, RELATIONSHIP_REPOSITORY, RelationshipLifecycle] },
    { provide: PauseRelationshipUseCase, useFactory: (s: StartPauseUseCase) => new PauseRelationshipUseCase(s), inject: [StartPauseUseCase] },
    {
      provide: MoveInUseCase,
      useFactory: (b: CommandBus, r: R, l: RelationshipLifecycle, p: PetPlacement, e: EngineGateway, rnd: RandomSource) => new MoveInUseCase(b, r, l, p, e, rnd),
      inject: [COMMAND_BUS, RELATIONSHIP_REPOSITORY, RelationshipLifecycle, PET_PLACEMENT, ENGINE_GATEWAY, RANDOM],
    },
    { provide: BranchVoteUseCase, useFactory: (b: CommandBus, u: UnitOfWork, r: R, l: RelationshipLifecycle) => new BranchVoteUseCase(b, u, r, l), inject: [COMMAND_BUS, UNIT_OF_WORK, RELATIONSHIP_REPOSITORY, RelationshipLifecycle] },
    {
      provide: ReliabilityJob,
      useFactory: (u: UnitOfWork, r: R, led: ReliabilityLedger, l: RelationshipLifecycle, e: EngineGateway) => new ReliabilityJob(u, r, led, l, e),
      inject: [UNIT_OF_WORK, RELATIONSHIP_REPOSITORY, RELIABILITY_LEDGER, RelationshipLifecycle, ENGINE_GATEWAY],
    },
  ],
  exports: [RelationshipConsumers, LINK_PROGRESS_PORT, SHARED_ACTION_PORT, RELATIONSHIP_CREATOR, RELATIONSHIP_READER, ReliabilityJob, BranchVoteUseCase, RelationshipLifecycle, RELATIONSHIP_REPOSITORY, GetRelationshipsQuery],
})
export class RelationshipsModule {}
