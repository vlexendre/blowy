/** Intervalles semi-ouverts [startMs, endMs) en ms UTC. */
export interface Interval {
  startMs: number;
  endMs: number;
}

/** Union triée et fusionnée (pauses chevauchantes). */
export function unionIntervals(list: readonly Interval[]): Interval[] {
  const sorted = list.filter((i) => i.endMs > i.startMs).sort((a, b) => a.startMs - b.startMs);
  const out: Interval[] = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.startMs <= last.endMs) last.endMs = Math.max(last.endMs, i.endMs);
    else out.push({ startMs: i.startMs, endMs: i.endMs });
  }
  return out;
}

/** [from, to) privé de l'union des intervalles exclus. */
export function subtractIntervals(fromMs: number, toMs: number, excluded: readonly Interval[]): Interval[] {
  const out: Interval[] = [];
  let cursor = fromMs;
  for (const e of unionIntervals(excluded)) {
    if (e.endMs <= cursor) continue;
    if (e.startMs >= toMs) break;
    if (e.startMs > cursor) out.push({ startMs: cursor, endMs: e.startMs });
    cursor = Math.max(cursor, e.endMs);
  }
  if (cursor < toMs) out.push({ startMs: cursor, endMs: toMs });
  return out;
}

export const isInside = (ms: number, list: readonly Interval[]): boolean => list.some((i) => ms >= i.startMs && ms < i.endMs);

/** Durée totale couverte par une liste d'intervalles disjoints. */
export const totalMs = (list: readonly Interval[]): number => list.reduce((s, i) => s + (i.endMs - i.startMs), 0);

/** Retire les intervalles terminés avant `beforeMs` (bornage de l'état persistant). */
export const pruneIntervals = (list: readonly Interval[], beforeMs: number): Interval[] => list.filter((i) => i.endMs > beforeMs);
