/** P : Jaccard (intersection / union) des passions ; 0 si les deux ensembles sont vides. */
import type { Passion } from '@blowy/domain';

export function passionScore(a: readonly Passion[], b: readonly Passion[]): number {
  const A = new Set(a);
  const B = new Set(b);
  const union = new Set([...A, ...B]).size;
  if (union === 0) return 0;
  let inter = 0;
  for (const p of A) if (B.has(p)) inter++;
  return inter / union;
}
