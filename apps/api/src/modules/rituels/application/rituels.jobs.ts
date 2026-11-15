import { Inject, Injectable, Logger } from '@nestjs/common';
import { dailyById, habitById, rituelsNotificationVars } from '@blowy/content';
import {
  type Day,
  PROOF_PHOTO_HOURS,
  addDays,
  dayOf,
  entitlements,
  habitDay,
  needsOut,
  parisHourOf,
  proofCounts,
  reviewWeekDue,
  settleStreak,
  streakAtRisk,
  weekStartOf,
} from '@blowy/domain';
import type { Storage } from '../../../integrations/storage/ports';
import { PETS, PROFILES, STORAGE } from '../../../shared/tokens';
import { hasPlus } from '../../me/application/plus';
import type { ProfilesRepository } from '../../me/ports';
import { needsNow } from '../../pets/application/pet-catch-up';
import type { PetsRepository } from '../../pets/ports';
import type { TickJob } from '../../tick/tick-job';
import type {
  DailyChallengesRepository,
  HabitChecksRepository,
  HabitsRepository,
  RitualMarker,
  RitualPhotosRepository,
  RitualStateRecord,
  RitualStatesRepository,
} from '../ports';
import { DAILY_CHALLENGES, HABIT_CHECKS, HABITS, RITUAL_PHOTOS, RITUAL_STATES } from '../tokens';
import { ReviewsService } from './reviews.service';
import { RitualNotifications } from './rituals-context';

/** Personnes visées par les tâches : vues dans l'app ces 14 derniers jours. */
export const ACTIVE_DAYS = 14;
const PAGE = 200;
const REVIEW_PAGE = 25;
const PHOTO_PAGE = 200;

/** Fenêtres horaires (Paris) des envois programmés ; heures calmes et plafonds : plateforme. */
export const WINDOWS = {
  dailyChallenge: [9, 21],
  needsOut: [11, 20],
  streakInDanger: [20, 22],
} as const;
const within = (hour: number, [from, to]: readonly [number, number]): boolean => hour >= from && hour < to;

/**
 * Travaux planifiés des rituels, appelés par le minuteur (`POST /internal/tick`). Idempotents : chaque envoi pose
 * un marqueur du jour (ou de la semaine) sur la personne ; une page traitée sort de la requête suivante, donc une tâche
 * coupée par `deadline` reprend où elle en était. Lectures par lots (curseur sur l'identifiant), aucune IA hors bilans actifs.
 */
@Injectable()
export class RituelsJobs implements TickJob {
  private readonly logger = new Logger('RituelsJobs');

  constructor(
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(DAILY_CHALLENGES) private readonly daily: DailyChallengesRepository,
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(HABIT_CHECKS) private readonly checks: HabitChecksRepository,
    @Inject(RITUAL_PHOTOS) private readonly photos: RitualPhotosRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(ReviewsService) private readonly reviews: ReviewsService,
    @Inject(RitualNotifications) private readonly notifications: RitualNotifications,
  ) {}

  async runDue(now: Date, deadline?: number): Promise<number> {
    const over = (): boolean => deadline !== undefined && Date.now() > deadline;
    const today = dayOf(now);
    const hour = parisHourOf(now);
    let done = 0;
    done += await this.purgePhotos(now, over);
    if (!over()) done += await this.askProofs(today, hour, over);
    if (!over() && within(hour, WINDOWS.dailyChallenge)) done += await this.dailyReminders(today, over);
    if (!over() && within(hour, WINDOWS.needsOut)) done += await this.needsOutReminders(now, today, over);
    if (!over() && within(hour, WINDOWS.streakInDanger)) done += await this.streakDanger(now, today, over);
    const week = reviewWeekDue(today, hour);
    if (!over() && week) done += await this.weeklyReviews(now, today, week, over);
    return done;
  }

  /** Photos privées non gardées : supprimées du stockage au-delà de 24 h. */
  async purgePhotos(now: Date, over: () => boolean): Promise<number> {
    const before = new Date(now.getTime() - PROOF_PHOTO_HOURS * 3_600_000).toISOString();
    let n = 0;
    while (!over()) {
      const expired = await this.photos.listExpired(before, PHOTO_PAGE);
      if (expired.length === 0) break;
      await this.storage.remove(expired.map((p) => p.path));
      await this.photos.markDeleted(
        expired.map((p) => p.id),
        now.toISOString(),
      );
      n += expired.length;
      if (expired.length < PHOTO_PAGE) break;
    }
    return n;
  }

  /** « Montre-moi tes baskets. » : à l'heure choisie, si l'habitude est à faire aujourd'hui. Une fois par habitude et par jour. */
  async askProofs(today: Day, hour: number, over: () => boolean): Promise<number> {
    let n = 0;
    let after: string | null = null;
    const activeSince = addDays(today, -ACTIVE_DAYS);
    while (!over()) {
      const page = await this.habits.listToAsk(hour, today, after, PAGE);
      if (page.length === 0) break;
      after = page[page.length - 1]?.id ?? null;
      const states = new Map((await this.states.findMany([...new Set(page.map((h) => h.userId))])).map((s) => [s.userId, s]));
      const checks = await this.checks.listSince(
        page.map((h) => h.id),
        weekStartOf(today),
      );
      for (const habit of page) {
        const seen = states.get(habit.userId)?.lastSeenOn;
        const def = habitById(habit.habitId);
        const kept = checks.filter((c) => c.habitRef === habit.id && proofCounts(c.verdict)).map((c) => c.day);
        if (def && seen && seen >= activeSince && habitDay(habit.rhythm, kept, today).due) {
          await this.notifications.send(habit.userId, 'habit_proof', rituelsNotificationVars.habitProof(def));
          n += 1;
        }
      }
      await this.habits.markAsked(
        page.map((h) => h.id),
        today,
      );
      if (page.length < PAGE) break;
    }
    return n;
  }

  /** Défi du jour, le matin, à qui ne l'a pas encore fait. */
  async dailyReminders(today: Day, over: () => boolean): Promise<number> {
    return this.forActive(today, 'dailyNotifiedOn', today, PAGE, over, async (page) => {
      const rows = new Map((await this.daily.findForDay(page.map((s) => s.userId), today)).map((c) => [c.userId, c]));
      let n = 0;
      for (const s of page) {
        const rec = rows.get(s.userId);
        if (rec?.status === 'done') continue;
        const def = rec ? dailyById(rec.challengeId) : undefined;
        await this.notifications.send(s.userId, 'daily_challenge', def ? rituelsNotificationVars.dailyChallenge(def) : {});
        n += 1;
      }
      return n;
    });
  }

  /** Le minimoa a besoin de sortir : sociabilité basse, une fois par jour au plus. */
  async needsOutReminders(now: Date, today: Day, over: () => boolean): Promise<number> {
    return this.forActive(today, 'needsOutNotifiedOn', today, PAGE, over, async (page) => {
      const pets = await this.pets.findByOwners(page.map((s) => s.userId));
      let n = 0;
      for (const pet of pets) {
        if (!needsOut(needsNow(pet, now))) continue;
        await this.notifications.send(pet.ownerId, 'needs_out', { petName: pet.name });
        n += 1;
      }
      return n;
    });
  }

  /** Série en danger : le soir, seulement si elle existe et que le défi n'est pas fait (jokers comptés). */
  async streakDanger(now: Date, today: Day, over: () => boolean): Promise<number> {
    return this.forActive(today, 'dangerNotifiedOn', today, PAGE, over, async (page) => {
      const profiles = new Map((await this.profiles.findByIds(page.map((s) => s.userId))).map((p) => [p.id, p]));
      let n = 0;
      for (const s of page) {
        const perWeek = entitlements(hasPlus(profiles.get(s.userId) ?? null, now)).jokersPerWeek;
        const settled = settleStreak(s.streak, today, perWeek);
        if (!streakAtRisk(settled, today)) continue;
        await this.notifications.send(s.userId, 'streak_in_danger', rituelsNotificationVars.streakInDanger(settled.current));
        n += 1;
      }
      return n;
    });
  }

  /** Bilans du dimanche soir (rattrapage le lundi), par petits lots : chacun lit l'activité de la semaine. */
  async weeklyReviews(now: Date, today: Day, weekStart: Day, over: () => boolean): Promise<number> {
    // Marqueur « semaine traitée » : le lundi de la dernière semaine racontée ; à traiter tant qu'il est avant ce lundi.
    return this.forActive(today, 'reviewWeek', weekStart, REVIEW_PAGE, over, async (page) => {
      const profiles = new Map((await this.profiles.findByIds(page.map((s) => s.userId))).map((p) => [p.id, p]));
      let n = 0;
      for (const s of page) {
        const profile = profiles.get(s.userId);
        if (!profile) continue;
        try {
          if (await this.reviews.build(s, profile, weekStart)) n += 1;
        } catch (err) {
          this.logger.warn(`bilan non construit : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
        }
      }
      return n;
    }, weekStart);
  }

  /**
   * Parcourt les personnes actives dont le marqueur est vide ou avant `before`, par pages ; chaque page traitée reçoit
   * le marqueur (`mark`, par défaut aujourd'hui) qu'on lui ait envoyé quelque chose ou non.
   */
  private async forActive(
    today: Day,
    marker: RitualMarker,
    before: Day,
    size: number,
    over: () => boolean,
    handle: (page: RitualStateRecord[]) => Promise<number>,
    mark: Day = today,
  ): Promise<number> {
    let n = 0;
    let after: string | null = null;
    const since = addDays(today, -ACTIVE_DAYS);
    while (!over()) {
      const page = await this.states.listActive(since, after, size, { marker, before });
      if (page.length === 0) break;
      after = page[page.length - 1]?.userId ?? null;
      n += await handle(page);
      await this.states.mark(
        page.map((s) => s.userId),
        marker,
        mark,
      );
      if (page.length < size) break;
    }
    return n;
  }
}
