/**
 * Habitudes : la personne en choisit dans un catalogue (textes et axes dans `@blowy/content`, v7/rituels),
 * avec un rythme. Le minimoa demande une preuve en photo au bon moment ; « pas sûr » compte comme tenu.
 */
import { type Day, addDays } from '../days';
import type { PetStats } from '../items';
import { weekStartOf } from './week';

export const HABIT_RHYTHMS = ['daily', 'three_per_week'] as const;
export type HabitRhythm = (typeof HABIT_RHYTHMS)[number];
export const HABIT_TARGET_PER_WEEK: Record<HabitRhythm, number> = { daily: 7, three_per_week: 3 };

export const PROOF_VERDICTS = ['yes', 'no', 'unsure'] as const;
export type ProofVerdict = (typeof PROOF_VERDICTS)[number];
/** « Pas sûr » : on fait confiance. */
export const proofCounts = (verdict: ProofVerdict): boolean => verdict !== 'no';

/** La photo de preuve est supprimée sous 24 h, sauf si la personne la garde dans ses souvenirs privés. */
export const PROOF_PHOTO_HOURS = 24;

/** Heure (Paris) par défaut à laquelle le minimoa demande la preuve. */
export const DEFAULT_PROOF_HOUR = 18;

export const canAddHabit = (active: number, limit: number): boolean => active < limit;

export interface HabitDay {
  doneToday: boolean;
  /** Jours tenus cette semaine (lundi → aujourd'hui). */
  doneThisWeek: number;
  target: number;
  /** À faire aujourd'hui : pas encore fait, et l'objectif de la semaine n'est pas atteint. */
  due: boolean;
}

/** `doneDays` : jours où l'habitude a été tenue (n'importe quel ordre, doublons tolérés). */
export function habitDay(rhythm: HabitRhythm, doneDays: readonly Day[], today: Day): HabitDay {
  const monday = weekStartOf(today);
  const week = new Set(doneDays.filter((d) => d >= monday && d <= today));
  const doneToday = week.has(today);
  const target = HABIT_TARGET_PER_WEEK[rhythm];
  return { doneToday, doneThisWeek: week.size, target, due: !doneToday && week.size < target };
}

/** Le minimoa demande la preuve : l'habitude est à faire et l'heure choisie est passée. */
export const shouldAskProof = (day: HabitDay, parisHour: number, proofHour: number): boolean => day.due && parisHour >= proofHour;

/**
 * Série d'une habitude. Tous les jours : jours d'affilée (jusqu'à aujourd'hui, ou hier si aujourd'hui n'est pas encore fait).
 * Trois fois par semaine : semaines d'affilée avec l'objectif atteint (la semaine en cours compte dès qu'elle l'atteint).
 */
export function habitStreak(rhythm: HabitRhythm, doneDays: readonly Day[], today: Day): number {
  const set = new Set(doneDays);
  if (rhythm === 'daily') {
    let d = set.has(today) ? today : addDays(today, -1);
    let n = 0;
    while (set.has(d)) {
      n += 1;
      d = addDays(d, -1);
    }
    return n;
  }
  const perWeek = new Map<Day, number>();
  for (const d of set) perWeek.set(weekStartOf(d), (perWeek.get(weekStartOf(d)) ?? 0) + 1);
  const target = HABIT_TARGET_PER_WEEK[rhythm];
  let week = weekStartOf(today);
  if ((perWeek.get(week) ?? 0) < target) week = addDays(week, -7);
  let n = 0;
  while ((perWeek.get(week) ?? 0) >= target) {
    n += 1;
    week = addDays(week, -7);
  }
  return n;
}

/**
 * Évolution visible du minimoa : elle avance avec les habitudes tenues et le record de série.
 * 0 « tout neuf » → 4 « accompli ». Les objets liés suivent les mêmes compteurs (`habitsKept`, `ritualStreak`).
 */
export const EVOLUTION_THRESHOLDS = [0, 5, 20, 50, 120] as const;
export function evolutionOf(stats: Pick<PetStats, 'habitsKept' | 'ritualStreak'>): { stage: number; points: number; next: number | null } {
  const points = stats.habitsKept + stats.ritualStreak;
  let stage = 0;
  for (let i = 0; i < EVOLUTION_THRESHOLDS.length; i++) if (points >= EVOLUTION_THRESHOLDS[i]!) stage = i;
  return { stage, points, next: EVOLUTION_THRESHOLDS[stage + 1] ?? null };
}
