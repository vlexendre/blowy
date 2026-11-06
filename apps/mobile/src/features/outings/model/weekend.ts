/**
 * « Un week-end sur deux » (V5.6 B.13, `everyOtherWeekendOffFrom`) : le week-end de la semaine ISO de départ
 * est off, puis un sur deux. Une sortie un samedi/dimanche des semaines intercalaires tombe sur un week-end libre.
 */
import { civil, DEFAULT_TZ } from '../../../core/format/dates';

/** Lundi 00:00 UTC de la semaine ISO « 2026-W46 ». */
export function isoWeekMonday(key: string): number {
  const m = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!m) throw new Error(`semaine ISO invalide : ${key}`);
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = Date.UTC(year, 0, 4);
  const dow = (new Date(jan4).getUTCDay() + 6) % 7; // 0 = lundi
  return jan4 - dow * 86_400_000 + (week - 1) * 7 * 86_400_000;
}

/** Samedi (midi UTC, sans ambiguïté de fuseau) du week-end off de départ. */
export const firstOffSaturday = (key: string): number =>
  isoWeekMonday(key) + 5 * 86_400_000 + 12 * 3_600_000;

/** La sortie tombe-t-elle sur un week-end LIBRE de la garde alternée ? */
export function onFreeWeekend(
  startsAt: string,
  fromKey: string | null | undefined,
  tz = DEFAULT_TZ,
): boolean {
  if (!fromKey) return false;
  const c = civil(startsAt, tz);
  if (c.weekday !== 6 && c.weekday !== 0) return false;
  const day = Date.UTC(c.year, c.month - 1, c.day);
  const weeks = Math.floor((day - isoWeekMonday(fromKey)) / (7 * 86_400_000));
  return weeks > 0 && weeks % 2 === 1;
}
