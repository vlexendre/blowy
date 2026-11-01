/** Projection temps admissible (hors pauses) ↔ temps réel. */
import { subtractIntervals, totalMs, type Interval } from './intervals.js';

/** ms admissibles dans [from, to). */
export const admissibleMs = (fromMs: number, toMs: number, pauses: readonly Interval[]): number => totalMs(subtractIntervals(fromMs, toMs, pauses));

/** Instant réel où `amount` ms admissibles se sont écoulées depuis `fromMs` (≤ toMs), sinon null. */
export function realTimeAfter(fromMs: number, amount: number, toMs: number, pauses: readonly Interval[]): number | null {
  let left = amount;
  for (const iv of subtractIntervals(fromMs, toMs, pauses)) {
    const len = iv.endMs - iv.startMs;
    if (left <= len) return iv.startMs + left;
    left -= len;
  }
  return null;
}
