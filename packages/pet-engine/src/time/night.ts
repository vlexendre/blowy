/**
 * Découpage jour/nuit en heure locale (nuit personnelle, ex. 23 h – 8 h), changements d'heure
 * compris : les bornes sont calculées par `wallToUtc` pour chaque jour local, jamais par un
 * décalage moyen.
 */
import { localParts, wallToUtc } from './zone.js';
import type { Interval } from './intervals.js';

export interface NightWindow {
  startHour: number;
  endHour: number;
}

export interface Segment extends Interval {
  night: boolean;
}

export function isNightHour(hour: number, w: NightWindow): boolean {
  return w.startHour > w.endHour ? hour >= w.startHour || hour < w.endHour : hour >= w.startHour && hour < w.endHour;
}

export const isNightAt = (ms: number, tz: string, w: NightWindow): boolean => isNightHour(localParts(ms, tz).hour, w);

const nightCache = new Map<string, Interval>();

/** Intervalle de nuit qui commence le jour local `day` (cache par fuseau). */
function nightStartingOn(day: number, tz: string, w: NightWindow): Interval {
  const key = `${tz}|${w.startHour}|${w.endHour}|${day}`;
  let iv = nightCache.get(key);
  if (!iv) {
    const endDay = w.startHour > w.endHour ? day + 1 : day;
    iv = { startMs: wallToUtc(day, w.startHour * 60, tz), endMs: wallToUtc(endDay, w.endHour * 60, tz) };
    if (nightCache.size > 100_000) nightCache.clear();
    nightCache.set(key, iv);
  }
  return iv;
}

/** Découpe [from, to) en segments alternés jour/nuit. */
export function splitDayNight(fromMs: number, toMs: number, tz: string, w: NightWindow): Segment[] {
  if (toMs <= fromMs) return [];
  const out: Segment[] = [];
  const push = (startMs: number, endMs: number, night: boolean): void => {
    if (endMs <= startMs) return;
    const last = out[out.length - 1];
    if (last && last.night === night && last.endMs === startMs) last.endMs = endMs;
    else out.push({ startMs, endMs, night });
  };
  let cursor = fromMs;
  for (let day = localParts(fromMs, tz).day - 1; cursor < toMs; day++) {
    const n = nightStartingOn(day, tz, w);
    if (n.endMs <= cursor) continue;
    push(cursor, Math.min(toMs, Math.max(cursor, n.startMs)), false);
    push(Math.max(cursor, n.startMs), Math.min(toMs, n.endMs), true);
    cursor = Math.max(cursor, Math.min(toMs, n.endMs));
  }
  return out;
}
