/**
 * La série (une seule par personne) : chaque jour validé = +1. Un jour se valide par le défi du jour (app installée
 * avant « Ton chemin ») ou par une séance de « Ton chemin » terminée (docs/CHEMIN.md). Un jour manqué est protégé par
 * un joker (« gel » dans Ton chemin) s'il en reste dans la période de ce jour ; sinon la série retombe à 0, le record
 * reste. Les jours manqués se rattrapent à la lecture (`settleStreak`) : aucune tâche planifiée n'est nécessaire.
 *
 * Deux jeux de règles (`StreakRule`) :
 * - un nombre : règles historiques, jokers par semaine (lundi → dimanche), paliers STREAK_MILESTONES ;
 * - `StreakRules` : période (semaine ou mois civil), gels par période et paliers (Ton chemin : CHEMIN_STREAK_MILESTONES).
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
/**
 * Paliers fêtés par « Ton chemin ». Les objets de 3, 14 et 60 jours restent gagnés dans la garde-robe (statistique
 * `ritualStreak`) mais ne sont plus annoncés ; 365 n'a pas encore d'objet (à dessiner, `streakReward` rend null).
 */
export const CHEMIN_STREAK_MILESTONES = [7, 30, 100, 365] as const;

export const FREEZE_PERIODS = ['week', 'month'] as const;
export type FreezePeriod = (typeof FREEZE_PERIODS)[number];

/** Règles de la série : jokers (gels) par période, et paliers fêtés. */
export interface StreakRules {
  period: FreezePeriod;
  perPeriod: number;
  milestones: readonly number[];
}
/** Un nombre : jokers par semaine, paliers historiques (app installée avant Ton chemin). */
export type StreakRule = number | StreakRules;

export const streakRulesOf = (rule: StreakRule): StreakRules =>
  typeof rule === 'number' ? { period: 'week', perPeriod: rule, milestones: STREAK_MILESTONES } : rule;

/** Premier jour du mois d'avant (AAAA-MM-01). */
const previousMonthStart = (day: Day): Day => {
  const y = Number(day.slice(0, 4));
  const m = Number(day.slice(5, 7));
  const [py, pm] = m === 1 ? [y - 1, 12] : [y, m - 1];
  return `${py}-${String(pm).padStart(2, '0')}-01` as Day;
};
const samePeriod = (a: Day, b: Day, period: FreezePeriod): boolean => (period === 'week' ? sameWeek(a, b) : a.slice(0, 7) === b.slice(0, 7));

const jokersUsedIn = (jokerDays: readonly Day[], day: Day, period: FreezePeriod): number => jokerDays.filter((d) => samePeriod(d, day, period)).length;

export const jokersLeft = (state: StreakState, today: Day, rule: StreakRule): number => {
  const r = streakRulesOf(rule);
  return Math.max(0, r.perPeriod - jokersUsedIn(state.jokerDays, today, r.period));
};

/** Oublie les jokers de plus de deux semaines (règle par mois : ceux d'avant le mois précédent). */
const prune = (jokerDays: readonly Day[], today: Day, period: FreezePeriod = 'week'): Day[] => {
  const keepFrom = period === 'week' ? addDays(weekStartOf(today), -7) : previousMonthStart(today);
  return jokerDays.filter((d) => d >= keepFrom);
};

const latest = (days: readonly Day[]): Day | null => (days.length === 0 ? null : days.reduce((a, b) => (b > a ? b : a)));

/**
 * Rattrape les jours manqués avant `today` (aujourd'hui n'est pas encore manqué) : chacun prend un joker de sa semaine
 * s'il en reste, sinon la série retombe à 0. Idempotent.
 */
export function settleStreak(state: StreakState, today: Day, rule: StreakRule): StreakState {
  const { period, perPeriod } = streakRulesOf(rule);
  if (state.current === 0 || state.lastDoneOn === null) {
    const jokerDays = prune(state.jokerDays, today, period);
    return jokerDays.length === state.jokerDays.length ? state : { ...state, jokerDays };
  }
  const protectedAfter = latest(state.jokerDays.filter((d) => d > (state.lastDoneOn as Day)));
  const cursor = protectedAfter ?? state.lastDoneOn;
  const jokerDays = [...state.jokerDays];
  let changed = false;
  for (let d = addDays(cursor, 1); daysBetween(d, today) > 0; d = addDays(d, 1)) {
    changed = true;
    if (jokersUsedIn(jokerDays, d, period) < perPeriod) {
      jokerDays.push(d);
    } else {
      return { ...state, current: 0, jokerDays: prune(jokerDays, today, period) };
    }
  }
  const pruned = prune(jokerDays, today, period);
  return changed || pruned.length !== state.jokerDays.length ? { ...state, jokerDays: pruned } : state;
}

export interface CompleteResult {
  state: StreakState;
  /** Palier atteint pour la première fois (le record le franchit) : un objet se débloque. */
  milestone: number | null;
}

/** Le jour est validé (défi du jour ou séance) : +1 (une fois par jour), après rattrapage des jours manqués. */
export function completeStreakDay(state: StreakState, today: Day, rule: StreakRule): CompleteResult {
  const settled = settleStreak(state, today, rule);
  if (settled.lastDoneOn === today) return { state: settled, milestone: null };
  const current = settled.current + 1;
  const best = Math.max(settled.best, current);
  const milestone = streakRulesOf(rule).milestones.includes(current) && current > settled.best ? current : null;
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
export function nextStreakMilestone(current: number, best: number = current, milestones: readonly number[] = STREAK_MILESTONES): { days: number; itemId: string | null } | null {
  const reach = Math.max(current, best);
  const days = milestones.find((m) => m > reach);
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
