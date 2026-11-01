/** Franchissements de seuils sur des accumulateurs monotones (ms admissibles). */

/** Décalage (dans [1, delta]) auquel `acc` atteint `threshold` en avançant de `delta`, sinon null. */
export function crossingOffset(acc: number, delta: number, threshold: number): number | null {
  return acc < threshold && acc + delta >= threshold ? threshold - acc : null;
}

/** Nombre de paliers franchis (premier palier `first`, puis tous les `step`) pour un accumulateur. */
export function stepsReached(acc: number, first: number, step: number): number {
  return acc < first ? 0 : 1 + Math.floor((acc - first) / step);
}
