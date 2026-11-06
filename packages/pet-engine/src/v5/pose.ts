/**
 * Pose V5 : réaction (TTL) > nuit locale (ASLEEP, cosmétique) > JOYFUL.
 * SICK, HUNGRY et SAD ne sont jamais produites (pas de faim ni de santé).
 */
import type { PetPose } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import { isNightAt } from '../time/index.js';
import type { PetStateV5 } from './model.js';

export function poseForV5(pet: PetStateV5, nowMs: number, tz: string, t: Tuning): PetPose {
  if (pet.reaction && nowMs < pet.reaction.untilMs) return pet.reaction.pose;
  if (isNightAt(nowMs, tz, t.time.night)) return 'ASLEEP';
  return 'JOYFUL';
}
