/**
 * Score public de vision = 100·(0,30C + 0,25P + 0,10D + 0,05E + 0,10R + 0,10G + 0,05S + 0,05M).
 * Composition des composantes (un fichier chacune). Pas de LLM, pas de photo, pas d'attirance.
 * M est la réputation du candidat vue par le demandeur (asymétrique) ; `mutualScore` symétrise.
 */
import type { Tuning } from '@blowy/tuning';
import type { MatchProfile, ScoreBreakdown } from '../types.js';
import { characterScore } from './character.js';
import { passionScore } from './passions.js';
import { schoolScore, speciesScore, sundayScore } from './matrices.js';
import { rhythmScore } from './rhythm.js';
import { geographyScore } from './geography.js';
import { reputationScore } from './reputation.js';

export const mutualMaxDistanceKm = (a: MatchProfile, b: MatchProfile): number => Math.min(a.preferences.maxDistanceKm, b.preferences.maxDistanceKm);

export function scoreVision(viewer: MatchProfile, candidate: MatchProfile, distanceKm: number, t: Tuning): ScoreBreakdown {
  const c = {
    C: characterScore(viewer.vision.axes, candidate.vision.axes),
    P: passionScore(viewer.vision.passions, candidate.vision.passions),
    D: sundayScore(viewer.vision.sunday, candidate.vision.sunday, t),
    E: schoolScore(viewer.vision.school, candidate.vision.school, t),
    R: rhythmScore(viewer.activityByHour, candidate.activityByHour, t),
    G: geographyScore(distanceKm, mutualMaxDistanceKm(viewer, candidate), t),
    S: speciesScore(viewer.species, candidate.species, t),
    M: reputationScore(candidate.reputationWords, t),
  };
  const w = t.matching.weights;
  const raw = w.C * c.C + w.P * c.P + w.D * c.D + w.E * c.E + w.R * c.R + w.G * c.G + w.S * c.S + w.M * c.M;
  return { ...c, score: Math.round(100 * Math.min(1, Math.max(0, raw))) };
}
