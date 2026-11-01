/** Réaction temporaire (pose TTL) déclenchée par une action. Table unique action → pose. */
import type { ReactionPose } from '@blowy/domain';
import type { EngineContext, EffectSink, PetState } from '../model/index.js';

export const ACTION_REACTIONS = {
  REFUSAL: 'POUTING',
  HUG: 'AFFECTIONATE',
  PLAY: 'LEAP',
  MISSION: 'PROUD',
  GIFT: 'SURPRISED',
  REUNION: 'DANCE',
} as const satisfies Record<string, ReactionPose>;

export function react(pet: PetState, pose: ReactionPose, ctx: EngineContext, out: EffectSink): void {
  pet.reaction = { pose, untilMs: ctx.now + ctx.tuning.poses.reactionTtlMs };
  out.push({ type: 'REACTION', petId: pet.id, pose, untilMs: pet.reaction.untilMs });
}
