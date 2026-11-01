/** Compteurs journaliers (remis à zéro au changement de jour local). Écrits une seule fois. */
export interface DailyCounters<K extends string> {
  dayKey: string;
  counts: Record<K, number>;
}

export function emptyDaily<K extends string>(dayKey: string, keys: readonly K[]): DailyCounters<K> {
  const counts = {} as Record<K, number>;
  for (const k of keys) counts[k] = 0;
  return { dayKey, counts };
}

/** Renvoie les compteurs du jour `dayKey` (réinitialisés si le jour a changé). */
export function rollDaily<K extends string>(d: DailyCounters<K>, dayKey: string, keys: readonly K[]): DailyCounters<K> {
  return d.dayKey === dayKey ? d : emptyDaily(dayKey, keys);
}
