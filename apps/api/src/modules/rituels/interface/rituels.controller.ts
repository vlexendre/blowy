import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import {
  AddHabitBody,
  DailyAnswerBody,
  type DailyResult,
  DayStr,
  type HabitCatalogue,
  type Habits,
  Iso,
  KeepPhotoBody,
  OkZ,
  OutingBody,
  type OutingResult,
  type PrivateMemories,
  type ProofResult,
  RitualPhotoBody,
  RitualPhotoTicketBody,
  type RitualsToday,
  type Streak,
  UpdateHabitBody,
  type UploadTicket,
  Uuid,
  type WeeklyReview,
  type WeeklyReviews,
} from '@blowy/contract';
import { rituelsText } from '@blowy/content';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { DailyService, type DoneResult, toDailyDto } from '../application/daily.service';
import { HabitsService } from '../application/habits.service';
import { OutingService, toOutingDto } from '../application/outing.service';
import { ReviewsService, toReviewDto } from '../application/reviews.service';
import { RitualsContext } from '../application/rituals-context';
import { StreakService } from '../application/streak.service';
import { TodayService } from '../application/today.service';
import { PetCharacter } from '../../pets/application/pet-character';
import { requestLocale } from '../../../shared/locale';

const Ref = new ZodPipe(Uuid);
const BeforeIso = new ZodPipe(Iso.datetime({ offset: true }).optional());
const BeforeDay = new ZodPipe(DayStr.optional());
const MEMORIES_PAGE = 30;
type Ok = z.infer<typeof OkZ>;

/** Rituels (V7) : sortie du jour, défi du jour, série, habitudes et preuves, souvenirs privés, bilans. */
@Controller('v1/rituals')
export class RituelsController {
  constructor(
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(TodayService) private readonly todayService: TodayService,
    @Inject(StreakService) private readonly streaks: StreakService,
    @Inject(DailyService) private readonly daily: DailyService,
    @Inject(OutingService) private readonly outings: OutingService,
    @Inject(HabitsService) private readonly habits: HabitsService,
    @Inject(ReviewsService) private readonly reviews: ReviewsService,
    @Inject(PetCharacter) private readonly character: PetCharacter,
  ) {}

  @Get('today')
  today(@CurrentUser() user: AuthUser): Promise<RitualsToday> {
    return this.todayService.get(user.userId);
  }

  @Get('streak')
  streak(@CurrentUser() user: AuthUser): Promise<Streak> {
    return this.streaks.view(user.userId);
  }

  // ── Sortie du jour ──
  @RateLimit('write')
  @Post('outing')
  async outing(@CurrentUser() user: AuthUser, @Body(new ZodPipe(OutingBody)) body: z.infer<typeof OutingBody>): Promise<OutingResult> {
    const outcome = await this.outings.answer(user.userId, body.answer, body.awayFromHome);
    const [challenge, streak, pet] = await Promise.all([this.daily.ensure(user.userId, this.ctx.today()), this.streaks.view(user.userId), this.character.load(user.userId)]);
    return {
      outing: toOutingDto(outcome.state, this.ctx.today()),
      line: outcome.line,
      sociability: pet.needs.sociability,
      challenge: toDailyDto(challenge),
      streak,
      newItems: outcome.done?.newItems ?? [],
    };
  }

  // ── Défi du jour ──
  @RateLimit('write')
  @Post('today/seen')
  async seen(@CurrentUser() user: AuthUser): Promise<DailyResult> {
    return this.dailyResult(user.userId, { record: await this.daily.mark(user.userId, 'seen'), newItems: [], justDone: false });
  }

  @RateLimit('write')
  @Post('today/accept')
  async accept(@CurrentUser() user: AuthUser): Promise<DailyResult> {
    return this.dailyResult(user.userId, { record: await this.daily.mark(user.userId, 'accepted'), newItems: [], justDone: false });
  }

  @RateLimit('write')
  @Post('today/answer')
  async answer(@CurrentUser() user: AuthUser, @Body(new ZodPipe(DailyAnswerBody)) body: z.infer<typeof DailyAnswerBody>): Promise<DailyResult> {
    return this.dailyResult(user.userId, await this.daily.answer(user.userId, body.choice));
  }

  @RateLimit('write')
  @Post('today/photo/ticket')
  dailyTicket(@CurrentUser() user: AuthUser, @Body(new ZodPipe(RitualPhotoTicketBody)) body: z.infer<typeof RitualPhotoTicketBody>): Promise<UploadTicket> {
    return this.daily.photoTicket(user.userId, body.contentType);
  }

  @RateLimit('write')
  @Post('today/photo')
  async dailyPhoto(@CurrentUser() user: AuthUser, @Body(new ZodPipe(RitualPhotoBody)) body: z.infer<typeof RitualPhotoBody>): Promise<DailyResult> {
    return this.dailyResult(user.userId, await this.daily.photo(user.userId, body.path, body.keep));
  }

  @RateLimit('write')
  @Post('today/complete')
  async complete(@CurrentUser() user: AuthUser): Promise<DailyResult> {
    return this.dailyResult(user.userId, await this.daily.complete(user.userId));
  }

  // ── Habitudes ──
  @Get('habits/catalogue')
  catalogue(@CurrentUser() user: AuthUser): Promise<HabitCatalogue> {
    return this.habits.catalogue(user.userId);
  }

  @Get('habits')
  listHabits(@CurrentUser() user: AuthUser): Promise<Habits> {
    return this.habits.list(user.userId);
  }

  @RateLimit('write')
  @Post('habits')
  async addHabit(@CurrentUser() user: AuthUser, @Body(new ZodPipe(AddHabitBody)) body: z.infer<typeof AddHabitBody>): Promise<Habits> {
    await this.habits.add(user.userId, body.habitId, body.rhythm, body.proofHour);
    return this.habits.list(user.userId);
  }

  @RateLimit('write')
  @Patch('habits/:ref')
  async updateHabit(
    @CurrentUser() user: AuthUser,
    @Param('ref', Ref) ref: string,
    @Body(new ZodPipe(UpdateHabitBody)) body: z.infer<typeof UpdateHabitBody>,
  ): Promise<Habits> {
    await this.habits.update(user.userId, ref, body);
    return this.habits.list(user.userId);
  }

  @RateLimit('write')
  @Delete('habits/:ref')
  async removeHabit(@CurrentUser() user: AuthUser, @Param('ref', Ref) ref: string): Promise<Habits> {
    await this.habits.remove(user.userId, ref);
    return this.habits.list(user.userId);
  }

  @RateLimit('write')
  @Post('habits/:ref/proof/ticket')
  proofTicket(
    @CurrentUser() user: AuthUser,
    @Param('ref', Ref) ref: string,
    @Body(new ZodPipe(RitualPhotoTicketBody)) body: z.infer<typeof RitualPhotoTicketBody>,
  ): Promise<UploadTicket> {
    return this.habits.proofTicket(user.userId, ref, body.contentType);
  }

  // Peut appeler le modèle de vision (`habit_proof`) : quota « ai » par personne, en plus du budget de la passerelle.
  @RateLimit('ai')
  @Post('habits/:ref/proof')
  async proof(@CurrentUser() user: AuthUser, @Param('ref', Ref) ref: string, @Body(new ZodPipe(RitualPhotoBody)) body: z.infer<typeof RitualPhotoBody>): Promise<ProofResult> {
    const r = await this.habits.proof(user.userId, ref, body.path, body.keep);
    return { photoId: r.photo.id, verdict: r.verdict, counted: r.counted, line: r.line, kept: r.photo.keep, habit: r.habit, newItems: r.newItems };
  }

  // ── Photos privées ──
  @RateLimit('write')
  @Post('photos/:id/keep')
  async keep(@CurrentUser() user: AuthUser, @Param('id', Ref) id: string, @Body(new ZodPipe(KeepPhotoBody)) body: z.infer<typeof KeepPhotoBody>): Promise<Ok> {
    await this.habits.keepPhoto(user.userId, id, body.keep);
    return { ok: true };
  }

  @Get('memories')
  async memories(@CurrentUser() user: AuthUser, @Query('before', BeforeIso) before?: string): Promise<PrivateMemories> {
    const page = await this.habits.memories(user.userId, before ? new Date(before).toISOString() : null, MEMORIES_PAGE);
    return {
      items: page.items.map((p) => ({ id: p.id, day: p.day, source: p.source, caption: p.caption, url: p.url, at: p.createdAt })),
      nextBefore: page.nextBefore,
    };
  }

  // ── Bilans ──
  @Get('reviews')
  listReviews(@CurrentUser() user: AuthUser, @Query('before', BeforeDay) before?: string): Promise<WeeklyReviews> {
    return this.reviews.list(user.userId, before ?? null);
  }

  @Get('reviews/:id')
  async review(@CurrentUser() user: AuthUser, @Param('id', Ref) id: string): Promise<WeeklyReview> {
    return toReviewDto(await this.reviews.get(user.userId, id));
  }

  @RateLimit('write')
  @Post('reviews/:id/read')
  async readReview(@CurrentUser() user: AuthUser, @Param('id', Ref) id: string): Promise<WeeklyReview> {
    return toReviewDto(await this.reviews.markRead(user.userId, id));
  }

  private async dailyResult(userId: string, r: DoneResult): Promise<DailyResult> {
    return {
      challenge: toDailyDto(r.record),
      streak: await this.streaks.view(userId),
      line: r.justDone ? rituelsText.in(requestLocale()).daily.done : null,
      newItems: r.newItems,
      // Défi photo : de quoi proposer « la garder dans mes souvenirs privés » après coup.
      photoId: r.record.photoId,
    };
  }
}
