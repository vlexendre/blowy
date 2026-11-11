import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { type Encounters, type Link, Uuid, WaveBody } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ZodPipe } from '../../../shared/zod.pipe';
import { LinkPresenter } from '../../links/interface/link.presenter';
import { AnswerEncounter } from '../application/answer-encounter.usecase';
import { ListEncounters } from '../application/list-encounters.usecase';
import { Wave } from '../application/wave.usecase';
import { toEncountersDto } from './encounters.presenter';

const EncounterId = new ZodPipe(Uuid);

@Controller('v1/encounters')
export class EncountersController {
  constructor(
    @Inject(ListEncounters) private readonly listEncounters: ListEncounters,
    @Inject(Wave) private readonly wave: Wave,
    @Inject(AnswerEncounter) private readonly answer: AnswerEncounter,
    @Inject(LinkPresenter) private readonly links: LinkPresenter,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<Encounters> {
    return toEncountersDto(await this.listEncounters.execute(user.userId));
  }

  @Post('wave')
  async waveAt(@CurrentUser() user: AuthUser, @Body(new ZodPipe(WaveBody)) body: z.infer<typeof WaveBody>): Promise<{ ok: true }> {
    await this.wave.execute(user.userId, body.userId);
    return { ok: true };
  }

  @Post(':id/accept')
  async accept(@CurrentUser() user: AuthUser, @Param('id', EncounterId) id: string): Promise<Link> {
    return this.links.link(await this.answer.accept(id, user.userId), user.userId);
  }

  @Post(':id/decline')
  async decline(@CurrentUser() user: AuthUser, @Param('id', EncounterId) id: string): Promise<{ ok: true }> {
    await this.answer.decline(id, user.userId);
    return { ok: true };
  }
}
