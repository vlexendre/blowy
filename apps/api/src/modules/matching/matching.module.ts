import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { BlockReader } from '../../shared/application/ports/block-reader.port.js';
import type { EngineGateway } from '../../shared/application/ports/engine.gateway.js';
import type { EntitlementsReader } from '../../shared/application/ports/entitlements-reader.port.js';
import { PET_PROFILE_READER, type PetProfileReader } from '../../shared/application/ports/pet-profile.reader.js';
import type { RelationshipCreator } from '../../shared/application/ports/relationship-creator.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { BLOCK_READER, CLOCK, COMMAND_BUS, DB, ENGINE_GATEWAY, ENTITLEMENTS_READER, RANDOM, RELATIONSHIP_CREATOR, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { AcceptProposalUseCase } from './application/accept-proposal.use-case.js';
import { GetMatchFeedQuery } from './application/get-match-feed.query.js';
import { MATCHING_REPOSITORY, type MatchingRepository } from './application/ports/matching.repository.js';
import { RequestOnboardingBatchUseCase } from './application/request-onboarding-batch.use-case.js';
import { RunMatchingBatchUseCase } from './application/run-matching-batch.use-case.js';
import { PrismaMatchingRepository } from './infrastructure/prisma-matching.repository.js';
import { MatchingController } from './interface/matching.controller.js';

type R = MatchingRepository;
@Global()
@Module({
  controllers: [MatchingController],
  providers: [
    { provide: MATCHING_REPOSITORY, useFactory: (db: Db, e: EntitlementsReader) => new PrismaMatchingRepository(db, (u, at) => e.dateSlots(u, at)), inject: [DB, ENTITLEMENTS_READER] },
    { provide: RunMatchingBatchUseCase, useFactory: (u: UnitOfWork, r: R, e: EngineGateway, rnd: RandomSource) => new RunMatchingBatchUseCase(u, r, e, rnd), inject: [UNIT_OF_WORK, MATCHING_REPOSITORY, ENGINE_GATEWAY, RANDOM] },
    { provide: RequestOnboardingBatchUseCase, useFactory: (r: R, run: RunMatchingBatchUseCase, c: Clock) => new RequestOnboardingBatchUseCase(r, run, c), inject: [MATCHING_REPOSITORY, RunMatchingBatchUseCase, CLOCK] },
    { provide: GetMatchFeedQuery, useFactory: (r: R, p: PetProfileReader, e: EngineGateway, c: Clock) => new GetMatchFeedQuery(r, p, e, c), inject: [MATCHING_REPOSITORY, PET_PROFILE_READER, ENGINE_GATEWAY, CLOCK] },
    {
      provide: AcceptProposalUseCase,
      useFactory: (b: CommandBus, r: R, c: RelationshipCreator, e: EntitlementsReader, bl: BlockReader, clk: Clock) => new AcceptProposalUseCase(b, r, c, e, bl, clk),
      inject: [COMMAND_BUS, MATCHING_REPOSITORY, RELATIONSHIP_CREATOR, ENTITLEMENTS_READER, BLOCK_READER, CLOCK],
    },
  ],
  exports: [RunMatchingBatchUseCase, MATCHING_REPOSITORY],
})
export class MatchingModule {}
