/**
 * Pose prioritaire : malade > endormi > affamé > réaction (TTL) > triste > joyeux > présentation.
 * La réaction ne masque jamais maladie, sommeil ni faim.
 */
import type { PetPose } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { PetState } from '../model/index.js';
import { isNightAt } from '../time/index.js';
import { gaugePoints } from './adjust.js';

type PoseRule = (pet: PetState, nowMs: number, t: Tuning) => PetPose | null;

/** Chaîne de responsabilité ordonnée (première règle qui répond gagne). */
const POSE_RULES: readonly PoseRule[] = [
  (p, _n, t) => (gaugePoints(p, 'health') < t.poses.sickHealthBelow ? 'SICK' : null),
  (p, n, t) => (isNightAt(n, p.tz, t.time.night) || gaugePoints(p, 'energy') < t.poses.asleepEnergyBelow ? 'ASLEEP' : null),
  (p, _n, t) => (gaugePoints(p, 'satiety') < t.poses.hungrySatietyBelow ? 'HUNGRY' : null),
  (p, n) => (p.reaction && n < p.reaction.untilMs ? p.reaction.pose : null),
  (p, _n, t) => (gaugePoints(p, 'mood') < t.poses.sadMoodBelow ? 'SAD' : null),
  (p, _n, t) => (gaugePoints(p, 'mood') > t.poses.joyfulMoodAbove ? 'JOYFUL' : null),
];

export function poseFor(pet: PetState, nowMs: number, t: Tuning): PetPose {
  for (const rule of POSE_RULES) {
    const pose = rule(pet, nowMs, t);
    if (pose) return pose;
  }
  return 'PRESENTATION';
}
