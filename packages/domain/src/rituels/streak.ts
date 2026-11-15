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

/**
 * Prochain palier à montrer : le premier dont l'objet n'est pas encore gagné. Un palier ne se gagne qu'une fois
 * (quand le record le franchit, voir `completeStreakDay`), donc tout palier au plus égal au record est déjà acquis :
 * après une série retombée puis repartie, on vise le premier palier au-delà du record, pas au-delà de la série en
 * cours. null quand les six sont gagnés. (`best` absent : la série en cours fait office de record.)
 */
export function nextStreakMilestone(current: number, best: number = current): { days: number; itemId: string | null } | null {
  const reach = Math.max(current, best);
  const days = STREAK_MILESTONES.find((m) => m > reach);
  return days === undefined ? null : { days, itemId: streakReward(days) };
}

/** not_yet : jour d'avant le premier jour de la personne (rien à reprocher, rien à compter). */
export const WEEK_DAY_STATUSES = ['done', 'joker', 'missed', 'today', 'future', 'not_yet'] as const;
export type WeekDayStatus = (typeof WEEK_DAY_STATUSES)[number];

/**
 * Jours comptés par la série en cours : en remontant depuis le dernier jour fait, `current` jours faits, en sautant
 * les jours protégés par un joker. C'est ce que la série affirme : la semaine l'affiche même si un jour fait n'a pas
 * d'enregistrement (série reprise, monde de démo).
 */
export function streakRunDays(settled: StreakState): Set<Day> {
  const out = new Set<Day>();
  if (settled.current <= 0 || settled.lastDoneOn === null) return out;
  const jokers = new Set(settled.jokerDays);
  let d = settled.lastDoneOn;
  // Garde-fou : jamais plus de `current` jours faits, ni plus de `current` + jokers jours examinés.
  for (let seen = 0; out.size < settled.current && seen < settled.current + jokers.size + 1; seen++, d = addDays(d, -1)) {
    if (!jokers.has(d)) out.add(d);
  }
  return out;
}

/**
 * Les sept jours de la semaine en cours pour l'app et le widget. `doneDays` : jours de la semaine avec le défi fait.
 * Un jour passé sans défi ni joker est « missed » (même s'il n'y avait pas de série à protéger), sauf s'il précède
 * `since`, le premier jour de la personne (création du compte) : il est alors « not_yet ». Un jour compté par la
 * série en cours est « done ».
 */
export function streakWeek(settled: StreakState, today: Day, doneDays: ReadonlySet<Day>, since: Day | null = null): { day: Day; status: WeekDayStatus }[] {
  const run = streakRunDays(settled);
  return weekDaysOf(today).map((day) => {
    if (day > today) return { day, status: 'future' as const };
    if (doneDays.has(day) || run.has(day)) return { day, status: 'done' as const };
    if (day === today) return { day, status: 'today' as const };
    if (settled.jokerDays.includes(day)) return { day, status: 'joker' as const };
    if (since !== null && day < since) return { day, status: 'not_yet' as const };
    return { day, status: 'missed' as const };
  });
}
