/**
 * La série : chaque jour où le défi du jour est fait = +1. Un jour manqué est protégé par un joker s'il en reste
 * dans la semaine de ce jour (lundi → dimanche, jours de Paris) ; sinon la série retombe à 0, le record reste.
 * Les jours manqués se rattrapent à la lecture (`settleStreak`) : aucune tâche planifiée n'est nécessaire.
 */
import { type Day, addDays, daysBetween } from '../days';
import { ITEMS } from '../items';
import { sameWeek, weekDaysOf, weekStartOf } from './week';

export interface StreakState {
  /** Jours d'affilée avec le défi fait (le jour même compris s'il est fait). */
  current: number;
  /** Record, jamais perdu. */
  best: number;
  /** Dernier jour avec le défi fait. */
  lastDoneOn: Day | null;
  /** Jours manqués protégés par un joker (gardés deux semaines, pour compter les jokers de la semaine). */
  jokerDays: Day[];
}

export const ZERO_STREAK: StreakState = Object.freeze({ current: 0, best: 0, lastDoneOn: null, jokerDays: [] }) as StreakState;

/** Paliers de la série ; chacun débloque un objet (statistique `ritualStreak`). */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

const jokersUsedIn = (jokerDays: readonly Day[], day: Day): number => jokerDays.filter((d) => sameWeek(d, day)).length;

export const jokersLeft = (state: StreakState, today: Day, perWeek: number): number => Math.max(0, perWeek - jokersUsedIn(state.jokerDays, today));

/** Oublie les jokers de plus de deux semaines. */
const prune = (jokerDays: readonly Day[], today: Day): Day[] => {
  const keepFrom = addDays(weekStartOf(today), -7);
  return jokerDays.filter((d) => d >= keepFrom);
};

const latest = (days: readonly Day[]): Day | null => (days.length === 0 ? null : days.reduce((a, b) => (b > a ? b : a)));

/**
 * Rattrape les jours manqués avant `today` (aujourd'hui n'est pas encore manqué) : chacun prend un joker de sa semaine
 * s'il en reste, sinon la série retombe à 0. Idempotent.
 */
export function settleStreak(state: StreakState, today: Day, perWeek: number): StreakState {
  if (state.current === 0 || state.lastDoneOn === null) {
    const jokerDays = prune(state.jokerDays, today);
    return jokerDays.length === state.jokerDays.length ? state : { ...state, jokerDays };
  }
  const protectedAfter = latest(state.jokerDays.filter((d) => d > (state.lastDoneOn as Day)));
  const cursor = protectedAfter ?? state.lastDoneOn;
  const jokerDays = [...state.jokerDays];
  let changed = false;
  for (let d = addDays(cursor, 1); daysBetween(d, today) > 0; d = addDays(d, 1)) {
    changed = true;
    if (jokersUsedIn(jokerDays, d) < perWeek) {
      jokerDays.push(d);
    } else {
      return { ...state, current: 0, jokerDays: prune(jokerDays, today) };
    }
  }
  const pruned = prune(jokerDays, today);
  return changed || pruned.length !== state.jokerDays.length ? { ...state, jokerDays: pruned } : state;
}

export interface CompleteResult {
  state: StreakState;
  /** Palier atteint pour la première fois (le record le franchit) : un objet se débloque. */
  milestone: number | null;
}

/** Le défi du jour est fait : +1 (une fois par jour), après rattrapage des jours manqués. */
export function completeStreakDay(state: StreakState, today: Day, perWeek: number): CompleteResult {
  const settled = settleStreak(state, today, perWeek);
  if (settled.lastDoneOn === today) return { state: settled, milestone: null };
  const current = settled.current + 1;
  const best = Math.max(settled.best, current);
  const milestone = (STREAK_MILESTONES as readonly number[]).includes(current) && current > settled.best ? current : null;
  return { state: { ...settled, current, best, lastDoneOn: today }, milestone };
}

/** Série en jeu aujourd'hui : elle existe et le défi n'est pas encore fait (état rattrapé). */
export const streakAtRisk = (settled: StreakState, today: Day): boolean => settled.current > 0 && settled.lastDoneOn !== today;

/** Objet débloqué par un palier de série. */
export function streakReward(days: number): string | null {
  return ITEMS.find((i) => i.unlock.kind === 'stat' && i.unlock.stat === 'ritualStreak' && i.unlock.n === days)?.id ?? null;
}

/** Prochain palier au-delà de la série en cours, ou null après 100. */
export function nextStreakMilestone(current: number): { days: number; itemId: string | null } | null {
  const days = STREAK_MILESTONES.find((m) => m > current);
  return days === undefined ? null : { days, itemId: streakReward(days) };
}

export const WEEK_DAY_STATUSES = ['done', 'joker', 'missed', 'today', 'future'] as const;
export type WeekDayStatus = (typeof WEEK_DAY_STATUSES)[number];

/**
 * Les sept jours de la semaine en cours pour l'app et le widget. `doneDays` : jours de la semaine avec le défi fait.
 * Un jour passé sans défi ni joker est « missed » (même s'il n'y avait pas de série à protéger).
 */
export function streakWeek(settled: StreakState, today: Day, doneDays: ReadonlySet<Day>): { day: Day; status: WeekDayStatus }[] {
  return weekDaysOf(today).map((day) => {
    if (day > today) return { day, status: 'future' as const };
    if (doneDays.has(day)) return { day, status: 'done' as const };
    if (day === today) return { day, status: 'today' as const };
    return { day, status: settled.jokerDays.includes(day) ? ('joker' as const) : ('missed' as const) };
  });
}
