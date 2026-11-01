/** M : réputation positive agrégée ; neutre 0,5 si trop peu de mots ; jamais les répondants. */
import { clamp01, type Tuning } from '@blowy/tuning';

export function reputationScore(words: number, t: Tuning): number {
  const r = t.matching.reputation;
  if (words < r.minWords) return r.neutral;
  return clamp01(r.neutral + (1 - r.neutral) * Math.min(1, (words - r.minWords) / Math.max(1, r.saturationWords - r.minWords)));
}
