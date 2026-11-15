import { Inject, Injectable } from '@nestjs/common';
import { rituelsNotificationVars, reviewDetailedAxisLine, reviewNoticedLine, rituelsText, textOf } from '@blowy/content';
import type { WeeklyReview } from '@blowy/contract';
import {
  type Day,
  VISION_AXES,
  type VisionAxis,
  addDays,
  dayOf,
  entitlements,
  isActiveWeek,
  isKindText,
  linkNote,
  noticedMove,
  axisMoves,
  reviewHighlights,
  reviewTip,
  settleStreak,
} from '@blowy/domain';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { IDS, LINKS, PETS, PROFILES } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import { hasPlus } from '../../me/application/plus';
import type { Profile, ProfilesRepository } from '../../me/ports';
import type { PetsRepository } from '../../pets/ports';
import { VISION_READER, type VisionReader } from '../../vision/tokens';
import type {
  Coach,
  DailyChallengesRepository,
  HabitChecksRepository,
  ReviewFacts,
  RitualStateRecord,
  WeeklyReviewRecord,
  WeeklyReviewsRepository,
} from '../ports';
import { COACH, DAILY_CHALLENGES, HABIT_CHECKS, WEEKLY_REVIEWS } from '../tokens';
import { RitualNotifications, RitualsContext } from './rituals-context';
import { requestLocale } from '../../../shared/locale';

export const REVIEWS_PAGE = 10;

/** Ne garde que les phrases qui passent le garde-fou (les modèles le passent tous : c'est vérifié par les tests). */
const kind = (lines: readonly string[]): string[] => lines.filter(isKindText);

export const toReviewDto = (r: WeeklyReviewRecord): WeeklyReview => ({
  id: r.id,
  weekStart: r.weekStart,
  title: rituelsText.in(requestLocale()).review.title,
  did: r.did,
  noticed: r.noticed,
  axisMoves: r.axisMoves.map((m) => ({ ...m })),
  tip: r.tip,
  links: r.links,
  text: r.text,
  facts: { outings: r.facts.outings, habitsKept: r.facts.habitsKept, challengesDone: r.facts.challengesDone, streak: r.facts.streak, bestStreak: r.facts.bestStreak },
  detailed: r.detailed,
  read: r.readAt !== null,
  at: r.createdAt,
});

/**
 * Le bilan de la semaine : assemblé de modèles de phrases (toujours positifs, contrôlés par le garde-fou),
 * reformulé par le port `Coach` seulement pour les personnes actives de la semaine. Le mouvement de la vision
 * se lit par le service public de la vision (profil actuel) comparé aux valeurs gardées dans le bilan précédent.
 */
@Injectable()
export class ReviewsService {
  constructor(
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(WEEKLY_REVIEWS) private readonly reviews: WeeklyReviewsRepository,
    @Inject(DAILY_CHALLENGES) private readonly daily: DailyChallengesRepository,
    @Inject(HABIT_CHECKS) private readonly checks: HabitChecksRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(VISION_READER) private readonly vision: VisionReader,
    @Inject(COACH) private readonly coach: Coach,
    @Inject(RitualNotifications) private readonly notifications: RitualNotifications,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  async list(userId: string, before: Day | null): Promise<{ reviews: WeeklyReview[]; nextBefore: Day | null }> {
    const rows = await this.reviews.list(userId, before, REVIEWS_PAGE);
    return { reviews: rows.map(toReviewDto), nextBefore: rows.length === REVIEWS_PAGE ? (rows[rows.length - 1]?.weekStart ?? null) : null };
  }

  async get(userId: string, id: string): Promise<WeeklyReviewRecord> {
    const review = await this.reviews.find(id);
    if (!review || review.userId !== userId) throw new DomainError('not_found', textOf(rituelsText, (t) => t.errors.reviewNotFound));
    return review;
  }

  async markRead(userId: string, id: string): Promise<WeeklyReviewRecord> {
    const review = await this.get(userId, id);
    if (review.readAt === null) {
      const at = this.ctx.now().toISOString();
      await this.reviews.markRead(id, at);
      return { ...review, readAt: at };
    }
    return review;
  }

  async latestUnreadId(userId: string): Promise<string | null> {
    return (await this.reviews.latestUnread(userId))?.id ?? null;
  }

  /**
   * Construit et enregistre le bilan de la semaine `weekStart` (idempotent : rien si le bilan existe) et prévient la
   * personne. Rend vrai si un bilan a été créé.
   */
  async build(state: RitualStateRecord, profile: Profile, weekStart: Day): Promise<boolean> {
    const userId = state.userId;
    const now = this.ctx.now();
    const weekEnd = addDays(weekStart, 6);
    const plus = hasPlus(profile, now);
    // Le bilan est écrit une fois, dans la langue de la personne.
    const locale = profile.locale ?? 'fr';
    const reviewText = rituelsText.in(locale).review;
    const perWeek = entitlements(plus).jokersPerWeek;
    const pet = await this.pets.findByOwner(userId);
    if (!pet) return false;

    const since = new Date(`${addDays(weekStart, -1)}T00:00:00Z`).toISOString();
    const [outingEvents, habitsKept, challenges, links, visionNow, previous] = await Promise.all([
      this.pets.listEventsSince(pet.id, 'went_out', since),
      this.checks.countKept(userId, weekStart, weekEnd),
      this.daily.listBetween(userId, weekStart, weekEnd),
      this.links.listForUsers([userId]),
      this.vision.profileOf(userId),
      this.reviews.list(userId, weekStart, 4),
    ]);
    const outingDays = new Set(outingEvents.map((e) => dayOf(new Date(e.createdAt))).filter((d) => d >= weekStart && d <= weekEnd));
    // Série telle qu'elle est le dimanche (en rattrapage le lundi, le dimanche n'est pas compté comme manqué).
    const streak = settleStreak(state.streak, weekEnd < dayOf(now) ? weekEnd : dayOf(now), perWeek);
    const facts: ReviewFacts = {
      outings: outingDays.size,
      habitsKept,
      challengesDone: challenges.filter((c) => c.status === 'done').length,
      streak: streak.current,
      bestStreak: streak.best,
      jokersUsed: streak.jokerDays.filter((d) => d >= weekStart && d <= weekEnd).length,
    };

    const vision: Partial<Record<VisionAxis, number>> = {};
    for (const axis of VISION_AXES) if (visionNow[axis].confidence > 0) vision[axis] = visionNow[axis].value;
    const last = previous[0];
    const deltas = last ? deltaOf(last.vision, vision) : null;

    const active = links.filter((l) => l.status === 'active');
    const others = active.map((l) => (l.userA === userId ? l.userB : l.userA));
    const names = new Map((await this.profiles.findByIds(others)).map((p) => [p.id, p.displayName]));
    const vars = { petName: pet.name, outings: facts.outings, habitsKept: facts.habitsKept, challengesDone: facts.challengesDone, streak: facts.streak };

    const did = kind(reviewHighlights(facts).map((h) => reviewText.highlight[h](vars)));
    const move = noticedMove(deltas);
    const noticed = move ? reviewNoticedLine(locale, move.axis, move.direction) : reviewText.noticedSteady;
    const tip = reviewText.tip[reviewTip(facts, active.length)];
    const linkLines = kind(
      active.flatMap((l) => {
        const name = names.get(l.userA === userId ? l.userB : l.userA);
        return name ? [reviewText.link[linkNote(l)](name, l.streak)] : [];
      }),
    );
    const detailed = entitlements(plus).detailedReview
      ? {
          axes: kind(VISION_AXES.map((axis) => reviewDetailedAxisLine(locale, axis, deltaOf(previous[previous.length - 1]?.vision ?? {}, vision)[axis] ?? 0))),
          links: kind(
            active.flatMap((l) => {
              const name = names.get(l.userA === userId ? l.userB : l.userA);
              return name ? [reviewText.detailedLink(name, l.level, l.lives)] : [];
            }),
          ),
        }
      : null;

    const template = [reviewText.intro(pet.name), ...did, kind([noticed])[0] ?? reviewText.noticedSteady, tip, ...linkLines].join('\n');
    // IA seulement pour les personnes actives de la semaine ; le modèle de phrases dès que la passerelle refuse.
    const coached = isActiveWeek(facts) ? await this.coach.rephrase({ userId, locale: profile.locale ?? 'fr', template }) : null;

    const created = await this.reviews.insertIfAbsent({
      id: this.ids.uuid(),
      userId,
      weekStart,
      facts,
      did,
      noticed,
      tip,
      links: linkLines,
      text: coached ?? template,
      coached: coached !== null,
      detailed,
      vision,
      axisMoves: axisMoves(deltas),
      readAt: null,
      createdAt: now.toISOString(),
    });
    if (created) await this.notifications.send(userId, 'weekly_review', rituelsNotificationVars.weeklyReview(pet.name));
    return created;
  }
}

/** Mouvement par axe entre deux relevés (seulement les axes connus des deux côtés). */
function deltaOf(before: Partial<Record<VisionAxis, number>>, after: Partial<Record<VisionAxis, number>>): Partial<Record<VisionAxis, number>> {
  const out: Partial<Record<VisionAxis, number>> = {};
  for (const axis of VISION_AXES) {
    const a = before[axis];
    const b = after[axis];
    if (a !== undefined && b !== undefined) out[axis] = b - a;
  }
  return out;
}
