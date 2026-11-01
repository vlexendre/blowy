/** R : recouvrement des distributions d'activité horaire (Σ min des parts) ; neutre si historique insuffisant. */
import { clamp01, type Tuning } from '@blowy/tuning';

export function rhythmScore(a: readonly number[], b: readonly number[], t: Tuning): number {
  const sa = a.reduce((s, v) => s + Math.max(0, v), 0);
  const sb = b.reduce((s, v) => s + Math.max(0, v), 0);
  if (a.length !== 24 || b.length !== 24 || sa < t.matching.rhythm.minEvents || sb < t.matching.rhythm.minEvents) return t.matching.rhythm.neutral;
  let overlap = 0;
  for (let h = 0; h < 24; h++) overlap += Math.min(Math.max(0, a[h]!) / sa, Math.max(0, b[h]!) / sb);
  return clamp01(overlap);
}
