import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { type EncounterHistory, type Encounters, Iso, type Link, Uuid, WaveBody } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { LinkPresenter } from '../../links/interface/link.presenter';
import { AnswerEncounter } from '../application/answer-encounter.usecase';
import { ListEncounterHistory } from '../application/list-encounter-history.usecase';
import { ListEncounters } from '../application/list-encounters.usecase';
import { Wave } from '../application/wave.usecase';
import { encounterProfiles, toEncounterHistoryDto, toEncountersDto } from './encounters.presenter';
import { AvatarBlurs } from '../../me/application/avatar-blurs';
import type { Locale } from '@blowy/content';
import { ReqLocale } from '../../../shared/locale';
import { HabitSharing } from '../../groups/sharing/habit-sharing';

const EncounterId = new ZodPipe(Uuid);
const Before = new ZodPipe(Iso.datetime({ offset: true }).optional());

@Controller('v1/encounters')
export class EncountersController {
  constructor(
    @Inject(ListEncounters) private readonly listEncounters: ListEncounters,
    @Inject(ListEncounterHistory) private readonly listHistory: ListEncounterHistory,
    @Inject(Wave) private readonly wave: Wave,
    @Inject(AnswerEncounter) private readonly answer: AnswerEncounter,
    @Inject(LinkPresenter) private readonly links: LinkPresenter,
    @Inject(HabitSharing) private readonly sharing: HabitSharing,
    @Inject(AvatarBlurs) private readonly blurs: AvatarBlurs,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale): Promise<Encounters> {
    const result = await this.listEncounters.execute(user.userId);
    const dto = toEncountersDto(result, locale, await this.blurs.urls(encounterProfiles(result)));
    // Habitudes tenues tous les deux (spéc §25) ; à vision égale, une habitude commune passe devant (ordre stable sinon).
    const shown = new Set(dto.suggestions.map((s) => s.user.id));
    const shared = await this.sharing.sharedWith(user.userId, [...shown, ...dto.incoming.map((i) => i.from.id)], shown);
    const count = (id: string): number => shared.get(id)?.habits.length ?? 0;
    const suggestions: Encounters['suggestions'] = [];
    for (const s of dto.suggestions) {
      // Ne remonte que dans une suite de visions de même force, du même côté (amis d'amis, puis autour).
      let at = suggestions.length;
      while (at > 0) {
        const prev = suggestions[at - 1];
        if (!prev || prev.via !== s.via || prev.compatibility !== s.compatibility || count(prev.user.id) >= count(s.user.id)) break;
        at -= 1;
      }
      suggestions.splice(at, 0, { ...s, sharedHabits: shared.get(s.user.id) });
    }
    return { ...dto, suggestions, incoming: dto.incoming.map((inc) => ({ ...inc, sharedHabits: shared.get(inc.from.id) })) };
  }

  @Get('history')
  async history(@CurrentUser() user: AuthUser, @Query('before', Before) before?: string): Promise<EncounterHistory> {
    const page = await this.listHistory.execute(user.userId, before ? new Date(before).toISOString() : null);
    return toEncounterHistoryDto(page, await this.blurs.urls(page.entries.map((e) => e.profile)));
  }

  @RateLimit('write')
  @Post('wave')
  async waveAt(@CurrentUser() user: AuthUser, @Body(new ZodPipe(WaveBody)) body: z.infer<typeof WaveBody>): Promise<{ ok: true }> {
    await this.wave.execute(user.userId, body.userId);
    return { ok: true };
  }

  @RateLimit('write')
  @Post(':id/accept')
  async accept(@CurrentUser() user: AuthUser, @Param('id', EncounterId) id: string): Promise<Link> {
    return this.links.link(await this.answer.accept(id, user.userId), user.userId);
  }

  @RateLimit('write')
  @Post(':id/decline')
  async decline(@CurrentUser() user: AuthUser, @Param('id', EncounterId) id: string): Promise<{ ok: true }> {
    await this.answer.decline(id, user.userId);
    return { ok: true };
  }
}
