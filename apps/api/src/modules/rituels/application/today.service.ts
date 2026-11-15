import { Inject, Injectable } from '@nestjs/common';
import { dayOf } from '@blowy/domain';
import type { RitualsToday } from '@blowy/contract';
import { needsOut } from '@blowy/domain';
import { PetCharacter } from '../../pets/application/pet-character';
import type { RitualStatesRepository } from '../ports';
import { RITUAL_STATES } from '../tokens';
import { DailyService, toDailyDto } from './daily.service';
import { HabitsService } from './habits.service';
import { toOutingDto } from './outing.service';
import { ReviewsService } from './reviews.service';
import { RitualsContext } from './rituals-context';
import { StreakService } from './streak.service';

/**
 * L'accueil des rituels en une requête : défi du jour (créé au premier passage du jour, avec le fait « la carte doit
 * monter »), série, sortie du jour, sociabilité, habitudes à faire, bilan non lu.
 * Écrit `last_seen_on` une fois par jour : c'est ce qui rend la personne « active » pour les tâches planifiées.
 */
@Injectable()
export class TodayService {
  constructor(
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(DailyService) private readonly daily: DailyService,
    @Inject(StreakService) private readonly streaks: StreakService,
    @Inject(HabitsService) private readonly habits: HabitsService,
    @Inject(ReviewsService) private readonly reviews: ReviewsService,
    @Inject(PetCharacter) private readonly character: PetCharacter,
  ) {}

  async get(userId: string): Promise<RitualsToday> {
    const today = this.ctx.today();
    const [profile, pet] = await Promise.all([this.ctx.profile(userId), this.character.load(userId)]);
    const perWeek = this.ctx.limitsOf(profile).jokersPerWeek;
    let state = await this.ctx.state(userId);
    if (state.lastSeenOn !== today) await this.states.upsert(userId, { lastSeenOn: today });

    let challenge = await this.daily.ensure(userId, today);
    const auto = await this.daily.autoComplete(userId, challenge, today);
    if (auto) {
      challenge = auto.record;
      state = await this.ctx.state(userId);
    }
    const [streak, habits, unreadReviewId] = await Promise.all([
      this.streaks.view(userId, { state, perWeek, since: dayOf(new Date(profile.createdAt)) }),
      this.habits.todaySummary(userId),
      this.reviews.latestUnreadId(userId),
    ]);
    const sociability = auto ? (await this.character.load(userId)).needs.sociability : pet.needs.sociability;
    return {
      day: today,
      challenge: toDailyDto(challenge),
      streak,
      outing: toOutingDto(state, today),
      sociability,
      needsOut: needsOut({ sociability }),
      habitsDue: habits.due,
      proofAsked: habits.asked,
      unreadReviewId,
    };
  }
}
