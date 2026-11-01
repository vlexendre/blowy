/** Fenêtres journalières locales (écrites une seule fois, utilisées par tous les plafonds). */
import { dayKeyFromDays, weekdayFromDays } from './calendar.js';
import { localDay } from './zone.js';

export const localDayKey = (ms: number, tz: string): string => dayKeyFromDays(localDay(ms, tz));

export function isLocalWeekend(ms: number, tz: string): boolean {
  const wd = weekdayFromDays(localDay(ms, tz));
  return wd === 0 || wd === 6;
}
