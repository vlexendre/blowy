import { Inject, Injectable } from '@nestjs/common';
import { rituelsNotificationVars } from '@blowy/content';
import {
  type Day,
  type StreakState,
  completeStreakDay,
  dayOf,
  jokersLeft,
  nextStreakMilestone,
  settleStreak,
  streakAtRisk,
  streakReward,
  streakWeek,
  weekStartOf,
} from '@blowy/domain';
import type { Streak } from '@blowy/contract';
import type { DailyChallengesRepository, RitualStateRecord, RitualStatesRepository } from '../ports';
import { DAILY_CHALLENGES, RITUAL_STATES } from '../tokens';
import { RitualNotifications, RitualsContext } from './rituals-context';

const sameStreak = (a: StreakState, b: StreakState): boolean =>
  a.current === b.current && a.best === b.best && a.lastDoneOn === b.lastDoneOn && a.jokerDays.join() === b.jokerDays.join();

/** La série : rattrapée à la lecture (jokers ou remise à zéro), +1 quand le défi du jour est fait. */
@Injectable()
export class StreakService {
  constructor(
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(DAILY_CHALLENGES) private readonly daily: DailyChallengesRepository,
    @Inject(RitualNotifications) private readonly notifications: RitualNotifications,
  ) {}

  /** Série rattrapée à `today` ; enregistrée seulement si le rattrapage a changé quelque chose. */
  async settled(state: RitualStateRecord, today: Day, perWeek: number): Promise<StreakState> {
    const settled = settleStreak(state.streak, today, perWeek);
    if (!sameStreak(settled, state.streak)) await this.states.upsert(state.userId, { streak: settled });
    return settled;
  }

  /**
   * Vue légère de la série (accueil, widget) : la ligne d'état, le profil et au plus 7 défis. `since` : premier jour
   * de la personne (jour de création du compte) ; les jours d'avant sont neutres dans la semaine.
   */
  async view(userId: string, known?: { state: RitualStateRecord; perWeek: number; since: Day }): Promise<Streak> {
    const today = this.ctx.today();
    const ctx =
      known ??
      (await (async () => {
        const profile = await this.ctx.profile(userId);
        return { state: await this.ctx.state(userId), perWeek: this.ctx.limitsOf(profile).jokersPerWeek, since: dayOf(new Date(profile.createdAt)) };
      })());
    const streak = await this.settled(ctx.state, today, ctx.perWeek);
    const week = await this.daily.listBetween(userId, weekStartOf(today), today);
    return this.toDto(streak, today, ctx.perWeek, new Set(week.filter((d) => d.status === 'done').map((d) => d.day)), ctx.since);
  }

  toDto(streak: StreakState, today: Day, perWeek: number, doneDays: ReadonlySet<Day>, since: Day | null = null): Streak {
    return {
      current: streak.current,
      best: streak.best,
      doneToday: streak.lastDoneOn === today,
      atRisk: streakAtRisk(streak, today),
      // Le premier palier dont l'objet n'est pas encore gagné (au-delà du record), pas celui de la série en cours.
      nextMilestone: nextStreakMilestone(streak.current, streak.best),
      jokersLeft: jokersLeft(streak, today, perWeek),
      jokersPerWeek: perWeek,
      week: streakWeek(streak, today, doneDays, since),
    };
  }

  /**
   * Le défi du jour vient d'être fait (une seule fois : l'appelant a gagné `markDone`). Rend les objets débloqués
   * par un palier franchi pour la première fois, après avoir prévenu la personne.
   */
  async complete(userId: string, today: Day, perWeek: number): Promise<{ streak: StreakState; newItems: string[] }> {
    const state = await this.ctx.state(userId);
    const { state: streak, milestone } = completeStreakDay(state.streak, today, perWeek);
    await this.states.upsert(userId, { streak });
    const reward = milestone ? streakReward(milestone) : null;
    if (reward && milestone) await this.notifications.send(userId, 'item_unlocked', rituelsNotificationVars.itemUnlocked(reward, `streak_${milestone}`));
    return { streak, newItems: reward ? [reward] : [] };
  }
}
