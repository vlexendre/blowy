/**
 * G : 1 jusqu'à `fullScoreKm` (1 km), puis décroissance linéaire jusqu'à 0 à la distance
 * maximale mutuellement admissible (min des deux préférences). Si cette limite ≤ 1 km,
 * aucune division : 1 dans la limite, 0 au-delà.
 */
import { clamp01, type Tuning } from '@blowy/tuning';

export function geographyScore(distanceKm: number, mutualMaxKm: number, t: Tuning): number {
  const full = t.matching.geography.fullScoreKm;
  if (distanceKm > mutualMaxKm) return 0;
  if (distanceKm <= full) return 1;
  if (mutualMaxKm <= full) return 0;
  return clamp01(1 - (distanceKm - full) / (mutualMaxKm - full));
}
