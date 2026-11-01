/**
 * Équité d'exposition : ajustement de PRIORITÉ (classement), jamais du % affiché.
 * Un profil peu montré récemment remonte, un profil très sollicité descend ; un boost acheté
 * ajoute un bonus borné (n'altère ni score, ni filtres, ni accord).
 */
import { clamp, type Tuning } from '@blowy/tuning';

export interface ExposureStats {
  /** Impressions reçues sur la fenêtre (propositions montrées). */
  recentImpressions: number;
  boostActive: boolean;
}

export function exposureAdjustment(s: ExposureStats, t: Tuning): number {
  const e = t.matching.exposure;
  const gap = (e.targetImpressions - s.recentImpressions) / e.targetImpressions;
  return clamp(gap * e.maxAdjustment, -e.maxAdjustment, e.maxAdjustment) + (s.boostActive ? e.boostAdjustment : 0);
}
