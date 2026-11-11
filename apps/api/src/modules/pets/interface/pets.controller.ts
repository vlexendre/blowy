import { Body, Controller, Get, Inject, Patch, Post } from '@nestjs/common';
import { ChallengeBody, type PetView, RenamePetBody } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ZodPipe } from '../../../shared/zod.pipe';
import { AnswerChallenge } from '../application/answer-challenge.usecase';
import { GetPetView } from '../application/get-pet-view.usecase';
import { RenamePet } from '../application/rename-pet.usecase';
import { toPetView } from './pet.presenter';

@Controller('v1/pet')
export class PetsController {
  constructor(
    @Inject(GetPetView) private readonly getView: GetPetView,
    @Inject(RenamePet) private readonly rename: RenamePet,
    @Inject(AnswerChallenge) private readonly answer: AnswerChallenge,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthUser): Promise<PetView> {
    return toPetView(await this.getView.execute(user.userId));
  }

  @Patch()
  async patch(@CurrentUser() user: AuthUser, @Body(new ZodPipe(RenamePetBody)) body: z.infer<typeof RenamePetBody>): Promise<PetView> {
    await this.rename.execute(user.userId, body.name);
    return toPetView(await this.getView.execute(user.userId));
  }

  @Post('challenge')
  async challenge(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ChallengeBody)) body: z.infer<typeof ChallengeBody>): Promise<PetView> {
    await this.answer.execute(user.userId, body.choice);
    return toPetView(await this.getView.execute(user.userId));
  }
}
