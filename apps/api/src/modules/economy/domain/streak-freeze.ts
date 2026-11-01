import { precondition } from './errors.js';

/**
 * Gels de série. Le jour est un jour CALENDAIRE SERVEUR ('YYYY-MM-DD') calculé dans la timezone
 * IANA stable de l'utilisateur au moment de la qualification (jamais une date client).
 * Règles (§16) :
 * - un gel consommé atomiquement protège UN SEUL jour manqué ; il ne crée pas de mission fictive
 *   (la longueur de série n'augmente pas, seul `lastCoveredDay` avance) ;
 * - au-delà d'un jour manqué, la série est déjà rompue : aucun gel n'est consommé ;
 * - jamais de consommation automatique/forcée (pause : série conservée sans consommation).
 */
export interface StreakSnapshot {
  readonly userId: string;
  readonly length: number;
  /** Dernier jour qualifié (mission/soin admissible) ou protégé par gel. */
  readonly lastCoveredDay: string | null;
  readonly version: number;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function dayToOrdinal(day: string): number {
  if (!DAY_RE.test(day)) throw precondition('Jour calendaire invalide.', { day });
  return Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

export function ordinalToDay(ordinal: number): string {
  return new Date(ordinal * 86_400_000).toISOString().slice(0, 10);
}

/** Jour calendaire d'un instant dans une timezone IANA (Intl, pas de dépendance). */
export function calendarDay(at: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export interface FreezePlan {
  readonly protectedDay: string;
  readonly newLastCoveredDay: string;
}

export function planFreezeUse(streak: StreakSnapshot, today: string, availableFreezes: number): FreezePlan {
  if (availableFreezes <= 0) throw precondition('Aucun gel disponible.');
  if (streak.length <= 0 || streak.lastCoveredDay === null) throw precondition('Aucune série à protéger.');
  const last = dayToOrdinal(streak.lastCoveredDay);
  const t = dayToOrdinal(today);
  const missed = t - last - 1; // jours entre le dernier jour couvert et aujourd'hui (exclus)
  if (missed <= 0) throw precondition("Aucun jour manqué à protéger.");
  if (missed > 1) throw precondition('Un gel ne protège qu’un seul jour : la série est déjà rompue.', { missedDays: missed });
  const protectedDay = ordinalToDay(last + 1);
  return { protectedDay, newLastCoveredDay: protectedDay };
}
