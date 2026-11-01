/**
 * XP du pet (séparée du Lien) et croissance de stade. Gelée si le pet est malade.
 * Bonus week-end Blowy+ uniquement ici (jamais sur le Lien, un vote, la fiabilité, une révélation).
 */
import type { Stage } from '@blowy/domain';
import { petXpWeekendMultiplier } from '@blowy/tuning';
import type { EngineContext, EffectSink, GainAction, PetState } from '../model/index.js';
import { MILLI } from '../shared/index.js';
import { isSick } from '../gauges/index.js';
import { isLocalWeekend } from '../time/index.js';

export function stageFor(xpMilli: number, ctx: EngineContext): Stage {
  const th = ctx.tuning.petXp.stageThresholds;
  return xpMilli >= th.ADULT * MILLI ? 'ADULT' : xpMilli >= th.YOUNG * MILLI ? 'YOUNG' : 'BABY';
}

export function grantPetXp(pet: PetState, source: GainAction, basePoints: number, weekendEntitlement: boolean, ctx: EngineContext, out: EffectSink): number {
  if (basePoints <= 0) return 0;
  if (isSick(pet, ctx.tuning)) {
    out.push({ type: 'XP_FROZEN', scope: 'PET', reason: 'SICK', relationshipId: null, petId: pet.id });
    return 0;
  }
  const mult = petXpWeekendMultiplier(ctx.tuning, weekendEntitlement, isLocalWeekend(ctx.now, pet.tz));
  const milli = basePoints * MILLI * mult;
  pet.xpMilli += milli;
  out.push({ type: 'PET_XP_GAINED', petId: pet.id, source, milli, weekendMultiplier: mult });
  const stage = stageFor(pet.xpMilli, ctx);
  if (stage !== pet.stage) {
    pet.stage = stage;
    out.push({ type: 'STAGE_GROWN', petId: pet.id, stage });
  }
  return milli;
}
