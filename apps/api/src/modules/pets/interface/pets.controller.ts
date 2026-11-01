import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import {
  CreatePrimaryPetRequestSchema,
  MovePetRequestSchema,
  OwnPetViewSchema,
  PetActionRequestSchema,
  PetActionResultSchema,
  UuidSchema,
  type CreatePrimaryPetRequest,
  type MovePetRequest,
  type PetActionRequest,
} from '@blowy/api-contract';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { CreatePrimaryPetUseCase } from '../application/create-primary-pet.use-case.js';
import { GetPetQuery } from '../application/get-pet.query.js';
import { MovePetUseCase } from '../application/move-pet.use-case.js';
import { PetActionUseCase } from '../application/pet-action.use-case.js';

@Controller('v1/pets')
export class PetsController {
  constructor(
    @Inject(CreatePrimaryPetUseCase) private readonly create: CreatePrimaryPetUseCase,
    @Inject(GetPetQuery) private readonly get: GetPetQuery,
    @Inject(PetActionUseCase) private readonly act: PetActionUseCase,
    @Inject(MovePetUseCase) private readonly move: MovePetUseCase,
  ) {}

  @Post()
  async createPrimary(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(CreatePrimaryPetRequestSchema)) body: CreatePrimaryPetRequest) {
    await this.create.execute(u.userId, cid, body);
    return OwnPetViewSchema.parse(await this.get.mine(u.userId));
  }

  @Get('mine')
  async mine(@CurrentUser() u: AuthenticatedUser) {
    return OwnPetViewSchema.parse(await this.get.mine(u.userId));
  }

  @Get(':id')
  async byId(@CurrentUser() u: AuthenticatedUser, @Param('id', new ZodPipe(UuidSchema)) id: string) {
    return this.get.own(u.userId, id);
  }

  @Post(':id/actions')
  async action(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', new ZodPipe(UuidSchema)) id: string, @Body(new ZodPipe(PetActionRequestSchema)) body: PetActionRequest) {
    return PetActionResultSchema.parse(await this.act.execute(u.userId, id, cid, body));
  }

  @Post(':id/move')
  async moveTo(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', new ZodPipe(UuidSchema)) id: string, @Body(new ZodPipe(MovePetRequestSchema)) body: MovePetRequest) {
    await this.move.execute(u.userId, id, cid, body);
    return OwnPetViewSchema.parse(await this.get.own(u.userId, id));
  }
}
