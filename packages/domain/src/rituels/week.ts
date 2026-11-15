/**
 * Semaines civiles (lundi → dimanche) sur des jours AAAA-MM-JJ déjà ramenés à Paris par `dayOf`.
 * Le jour de la semaine se calcule sur la date seule : aucun fuseau ni changement d'heure n'intervient.
 */
import { APP_TIMEZONE, type Day, addDays } from '../days';

/** 0 = lundi … 6 = dimanche. */
export function weekdayOf(day: Day): number {
  const utc = Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
  return (new Date(utc).getUTCDay() + 6) % 7;
}

/** Lundi de la semaine du jour donné. */
export const weekStartOf = (day: Day): Day => addDays(day, -weekdayOf(day));

/** Les sept jours (lundi → dimanche) de la semaine du jour donné. */
export const weekDaysOf = (day: Day): Day[] => {
  const monday = weekStartOf(day);
  return [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(monday, n));
};

export const sameWeek = (a: Day, b: Day): boolean => weekStartOf(a) === weekStartOf(b);

/** Graine déterministe (FNV-1a 32 bits) : remplace l'aléa dans les règles (défi du jour, choix de phrases). */
export function seedOf(...parts: readonly string[]): number {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Heure (0-23) à Paris à cet instant, comme `dayOf` pour le jour. */
export function parisHourOf(date: Date, timeZone: string = APP_TIMEZONE): number {
  const h = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(date);
  return Number(h) % 24;
}
