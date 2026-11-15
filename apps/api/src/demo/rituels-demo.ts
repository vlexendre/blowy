import { Inject, Injectable } from '@nestjs/common';
import { DAILY_CHALLENGES as DAILY_CATALOGUE } from '@blowy/content';
import { type StreakState, addDays, dayOf, streakRunDays, weekStartOf } from '@blowy/domain';
import { ReviewsService } from '../modules/rituels/application/reviews.service';
import { RitualsContext } from '../modules/rituels/application/rituals-context';
import type { DailyChallengesRepository, HabitsRepository, RitualStatesRepository } from '../modules/rituels/ports';
import { DAILY_CHALLENGES, HABITS, RITUAL_STATES } from '../modules/rituels/tokens';
import type { Clock } from '../shared/clock';
import type { Ids } from '../shared/ids';
import { CLOCK, IDS } from '../shared/tokens';
import { DEMO_LEA, DEMO_MALO, DEMO_SASHA } from './demo';

/** Séries et habitudes des personnes de démo (Léa tient sa série, Malo l'a laissée retomber, Sasha repart). */
const DEMO_RITUALS = [
  { id: DEMO_LEA, current: 12, best: 21, habitsKept: 18, habits: ['marcher', 'voir_un_ami'] },
  { id: DEMO_MALO, current: 0, best: 5, habitsKept: 2, habits: ['sport'] },
  { id: DEMO_SASHA, current: 3, best: 9, habitsKept: 6, habits: ['lire', 'plantes'] },
] as const;

/** Rituels du monde de démo : de quoi remplir la série, les habitudes et le bilan dès l'inscription. */
@Injectable()
export class RituelsDemo {
  constructor(
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(DAILY_CHALLENGES) private readonly daily: DailyChallengesRepository,
    @Inject(ReviewsService) private readonly reviews: ReviewsService,
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  async seed(): Promise<void> {
    const now = this.clock.now();
    const today = dayOf(now);
    for (const d of DEMO_RITUALS) {
      if (await this.states.find(d.id)) continue;
      const streak: StreakState = { current: d.current, best: d.best, lastDoneOn: d.current > 0 ? addDays(today, -1) : addDays(today, -9), jokerDays: [] };
      await this.states.upsert(d.id, { streak, lastSeenOn: today, habitsKept: d.habitsKept });
      // Un défi fait pour chaque jour compté par la série : l'historique dit la même chose que le compteur.
      await this.seedDoneDays(d.id, [...streakRunDays(streak)]);
      for (const habitId of d.habits) {
        await this.habits.create({ id: this.ids.uuid(), userId: d.id, habitId, rhythm: 'daily', proofHour: 18, createdAt: now.toISOString(), archivedAt: null, askedOn: null });
      }
    }
  }

  private async seedDoneDays(userId: string, days: readonly string[]): Promise<void> {
    const question = DAILY_CATALOGUE.find((c) => c.kind === 'question') ?? DAILY_CATALOGUE[0];
    if (!question) return;
    for (const day of days) {
      const at = `${day}T10:00:00.000Z`;
      await this.daily.insertIfAbsent({
        userId,
        day,
        challengeId: question.id,
        kind: question.kind,
        axis: question.axis,
        status: 'done',
        answer: question.kind === 'question' ? 0 : null,
        photoId: null,
        seenAt: at,
        acceptedAt: at,
        doneAt: at,
        createdAt: at,
      });
    }
  }

  /** La nouvelle personne trouve déjà un bilan (celui de la semaine passée) dans son historique. */
  async welcome(userId: string): Promise<void> {
    const profile = await this.ctx.profile(userId);
    const state = await this.ctx.state(userId);
    await this.reviews.build(state, profile, addDays(weekStartOf(dayOf(this.clock.now())), -7));
  }
}
