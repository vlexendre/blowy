import { DEFAULT_TUNING } from '@blowy/tuning';
import { PET_MEMORY_PORT } from '../../shared/application/ports/pet-memory.port.js';
import { PrismaPetMemory } from './infrastructure/prisma-pet-memory.js';
import { Global, Module } from '@nestjs/common';
import { PET_PROFILE_READER } from '../../shared/application/ports/pet-profile.reader.js';
import { EnginePetProfileReader } from './infrastructure/pet-profile.reader.js';
import type { Db } from '@blowy/database';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import { ENGINE_GATEWAY, type EngineGateway } from '../../shared/application/ports/engine.gateway.js';
import type { EntitlementsReader } from '../../shared/application/ports/entitlements-reader.port.js';
import { PARTICIPATION_READER, type ParticipationReader } from '../../shared/application/ports/participation.reader.js';
import { SHARED_ACTION_PORT, type SharedActionPort } from '../../shared/application/ports/shared-action.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import { CLOCK, COMMAND_BUS, DB, ENTITLEMENTS_READER, RANDOM, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { CreatePrimaryPetUseCase } from './application/create-primary-pet.use-case.js';
import { GetPetQuery } from './application/get-pet.query.js';
import { MovePetUseCase } from './application/move-pet.use-case.js';
import { PetActionUseCase } from './application/pet-action.use-case.js';
import { PetTimeService } from './application/pet-time.service.js';
import { PET_REPOSITORY, type PetRepository } from './application/ports/pet.repository.js';
import { TickPetsUseCase } from './application/tick-pets.use-case.js';
import { PrismaPetRepository } from './infrastructure/prisma-pet.repository.js';
import { PetsController } from './interface/pets.controller.js';

type R = PetRepository;
export const PETS_PROVIDERS = [
  { provide: PET_REPOSITORY, useFactory: (db: Db) => new PrismaPetRepository(db), inject: [DB] },
  { provide: PetTimeService, useFactory: (e: EngineGateway, r: R) => new PetTimeService(e, r), inject: [ENGINE_GATEWAY, PET_REPOSITORY] },
  {
    provide: CreatePrimaryPetUseCase,
    useFactory: (b: CommandBus, r: R, e: EngineGateway, en: EntitlementsReader, rnd: RandomSource) => new CreatePrimaryPetUseCase(b, r, e, en, rnd),
    inject: [COMMAND_BUS, PET_REPOSITORY, ENGINE_GATEWAY, ENTITLEMENTS_READER, RANDOM],
  },
  {
    provide: GetPetQuery,
    useFactory: (r: R, t: PetTimeService, e: EngineGateway, p: ParticipationReader, c: Clock) => new GetPetQuery(r, t, e, p, c),
    inject: [PET_REPOSITORY, PetTimeService, ENGINE_GATEWAY, PARTICIPATION_READER, CLOCK],
  },
  {
    provide: PetActionUseCase,
    useFactory: (b: CommandBus, r: R, t: PetTimeService, e: EngineGateway, p: ParticipationReader, s: SharedActionPort) => new PetActionUseCase(b, r, t, e, p, s),
    inject: [COMMAND_BUS, PET_REPOSITORY, PetTimeService, ENGINE_GATEWAY, PARTICIPATION_READER, SHARED_ACTION_PORT],
  },
  { provide: MovePetUseCase, useFactory: (b: CommandBus, r: R, p: ParticipationReader) => new MovePetUseCase(b, r, p), inject: [COMMAND_BUS, PET_REPOSITORY, PARTICIPATION_READER] },
  {
    provide: TickPetsUseCase,
    useFactory: (u: UnitOfWork, r: R, t: PetTimeService, e: EngineGateway) => new TickPetsUseCase(u, r, t, e.params.lazyCatchUpAfterDays),
    inject: [UNIT_OF_WORK, PET_REPOSITORY, PetTimeService, ENGINE_GATEWAY],
  },
  { provide: PET_MEMORY_PORT, useFactory: () => new PrismaPetMemory(DEFAULT_TUNING) },
  { provide: PET_PROFILE_READER, useFactory: (r: R, t: PetTimeService, e: EngineGateway) => new EnginePetProfileReader(r, t, e), inject: [PET_REPOSITORY, PetTimeService, ENGINE_GATEWAY] },
];

@Global()
@Module({ controllers: [PetsController], providers: PETS_PROVIDERS, exports: [PET_MEMORY_PORT, TickPetsUseCase, GetPetQuery, PET_REPOSITORY, PET_PROFILE_READER] })
export class PetsModule {}
