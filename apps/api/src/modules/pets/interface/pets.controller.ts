import { Body, Controller, Get, Inject, Patch, Post, Put } from '@nestjs/common';
import { CareBody, ChallengeBody, OutfitBody, type PetView, RenamePetBody, type Wardrobe as WardrobeDto } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ZodPipe } from '../../../shared/zod.pipe';
import { AnswerChallenge } from '../application/answer-challenge.usecase';
import { CarePet } from '../application/care-pet.usecase';
import { GetPetView } from '../application/get-pet-view.usecase';
import { RenamePet } from '../application/rename-pet.usecase';
import { SetOutfit } from '../application/set-outfit.usecase';
import { Wardrobe } from '../application/wardrobe';
import { toPetView, toWardrobe } from './pet.presenter';

@Controller('v1/pet')
export class PetsController {
  constructor(
    @Inject(GetPetView) private readonly getView: GetPetView,
    @Inject(RenamePet) private readonly rename: RenamePet,
    @Inject(AnswerChallenge) private readonly answer: AnswerChallenge,
    @Inject(CarePet) private readonly carePet: CarePet,
    @Inject(SetOutfit) private readonly setOutfit: SetOutfit,
    @Inject(Wardrobe) private readonly wardrobe: Wardrobe,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthUser): Promise<PetView> {
    return this.view(user.userId);
  }

  @Patch()
  async patch(@CurrentUser() user: AuthUser, @Body(new ZodPipe(RenamePetBody)) body: z.infer<typeof RenamePetBody>): Promise<PetView> {
    await this.rename.execute(user.userId, body.name);
    return this.view(user.userId);
  }

  @Post('challenge')
  async challenge(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ChallengeBody)) body: z.infer<typeof ChallengeBody>): Promise<PetView> {
    await this.answer.execute(user.userId, body.choice);
    return this.view(user.userId);
  }

  @Post('care')
  async care(@CurrentUser() user: AuthUser, @Body(new ZodPipe(CareBody)) body: z.infer<typeof CareBody>): Promise<PetView> {
    await this.carePet.execute(user.userId, body.action);
    return this.view(user.userId);
  }

  @Get('wardrobe')
  async getWardrobe(@CurrentUser() user: AuthUser): Promise<WardrobeDto> {
    return toWardrobe(await this.wardrobe.state(user.userId));
  }

  @Put('outfit')
  async outfit(@CurrentUser() user: AuthUser, @Body(new ZodPipe(OutfitBody)) body: z.infer<typeof OutfitBody>): Promise<PetView> {
    await this.setOutfit.execute(user.userId, body.outfit);
    return this.view(user.userId);
  }

  private async view(userId: string): Promise<PetView> {
    return toPetView(await this.getView.execute(userId));
  }
}
