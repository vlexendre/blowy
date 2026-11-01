/**
 * Conversion IANA déterministe via Intl.DateTimeFormat (données ICU du runtime).
 * - `offsetAt(ms, tz)` : décalage local − UTC en ms.
 * - `wallToUtc(day, minuteOfDay, tz)` : instant UTC d'une heure murale locale. Dans un trou
 *   de changement d'heure (heure inexistante), renvoie l'instant décalé vers l'avant ; pour
 *   une heure ambiguë (repli), la première occurrence.
 * Hypothèse documentée : les transitions de fuseau tombent sur des quarts d'heure (vrai pour
 * toutes les zones actuelles), ce qui permet un cache par quart d'heure.
 */
import { DAY_MS, MINUTE_MS } from '@blowy/domain';
import { daysFromCivil } from './calendar.js';

const QUARTER_MS = 15 * MINUTE_MS;
const CACHE_LIMIT = 200_000;

const formatters = new Map<string, Intl.DateTimeFormat>();
const offsetCache = new Map<string, Map<number, number>>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(tz, f);
  }
  return f;
}

export interface LocalParts {
  day: number;
  hour: number;
  minute: number;
}

function rawOffset(ms: number, tz: string): number {
  const parts = formatter(tz).formatToParts(ms);
  const get = (t: Intl.DateTimeFormatPartTypes): number => Number(parts.find((p) => p.type === t)?.value);
  const local = daysFromCivil(get('year'), get('month'), get('day')) * DAY_MS + get('hour') * 3_600_000 + get('minute') * MINUTE_MS + get('second') * 1000;
  return local - (ms - (((ms % 1000) + 1000) % 1000));
}

export function offsetAt(ms: number, tz: string): number {
  const bucket = Math.floor(ms / QUARTER_MS);
  let zone = offsetCache.get(tz);
  if (!zone) offsetCache.set(tz, (zone = new Map()));
  let off = zone.get(bucket);
  if (off === undefined) {
    off = rawOffset(bucket * QUARTER_MS, tz);
    if (zone.size > CACHE_LIMIT) zone.clear();
    zone.set(bucket, off);
  }
  return off;
}

export function localParts(ms: number, tz: string): LocalParts {
  const local = ms + offsetAt(ms, tz);
  const day = Math.floor(local / DAY_MS);
  const rem = local - day * DAY_MS;
  return { day, hour: Math.floor(rem / 3_600_000), minute: Math.floor((rem % 3_600_000) / MINUTE_MS) };
}

export const localDay = (ms: number, tz: string): number => localParts(ms, tz).day;

export function wallToUtc(day: number, minuteOfDay: number, tz: string): number {
  const wall = day * DAY_MS + minuteOfDay * MINUTE_MS;
  const o1 = offsetAt(wall - offsetAt(wall, tz), tz);
  const candidate = wall - o1;
  if (candidate + offsetAt(candidate, tz) === wall) {
    // Repli : vérifier une occurrence plus précoce avec l'autre décalage.
    const o0 = offsetAt(wall - o1 - DAY_MS / 24, tz);
    const earlier = wall - o0;
    return earlier < candidate && earlier + offsetAt(earlier, tz) === wall ? earlier : candidate;
  }
  // Trou : l'heure n'existe pas ; avancer selon le décalage d'avant la transition.
  return wall - offsetAt(wall - DAY_MS, tz);
}
