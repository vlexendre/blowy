/**
 * Registre des handlers V5 (pattern Command/Strategy, comme `HANDLERS` V4). Un handler mute la
 * copie de travail et pousse ses effets. Retirés de V5 (restent dans `v4`) : CALL_PET, HUG, PLAY,
 * FEED_PET, HEAL_PET, FEED_FRIEND, GIFT, MESSAGE_PUBLISHED, MISSION_VALIDATED, GATES_UPDATED,
 * PAUSE_SET, MOVE_IN, RELATIONSHIP_ENDED, ADVANCE. Œuf sur `duoId` : tranche optionnelle T9.
 */
import { MILLI, REACTION_POSES, type AccessorySource } from '@blowy/domain';
import type { EffectV5, EngineContextV5, PetEventOfV5, PetEventTypeV5, PetStateV5, RejectReasonV5 } from './model.js';
import { maxStage, stageForXpV5 } from './progress.js';

export interface ActionHandlerV5<T extends PetEventTypeV5> {
  readonly type: T;
  handle(pet: PetStateV5, event: PetEventOfV5<T>, ctx: EngineContextV5, out: EffectV5[]): void;
}
export type HandlerRegistryV5 = { [T in PetEventTypeV5]: ActionHandlerV5<T> };

const define = <T extends PetEventTypeV5>(type: T, handle: ActionHandlerV5<T>['handle']): ActionHandlerV5<T> => ({ type, handle });
const reject = (out: EffectV5[], reason: RejectReasonV5): void => {
  out.push({ type: 'ACTION_REJECTED', reason });
};

function unlock(pet: PetStateV5, accessoryId: string, source: AccessorySource, out: EffectV5[]): void {
  if (pet.unlockedAccessories.includes(accessoryId)) return;
  pet.unlockedAccessories.push(accessoryId);
  out.push({ type: 'ACCESSORY_UNLOCKED', petId: pet.id, accessoryId, source });
}

const memoryRecorded = define('MEMORY_RECORDED', (pet, e, ctx, out) => {
  const m = ctx.tuning.memories;
  pet.memoryCount += 1;
  const nthOfKind = (pet.memoriesByKind[e.memoryKind] ?? 0) + 1;
  pet.memoriesByKind[e.memoryKind] = nthOfKind;
  out.push({ type: 'MEMORY_ADDED', petId: pet.id, memoryKind: e.memoryKind });
  const milli = m.xpByKind[e.memoryKind] * MILLI;
  if (milli > 0) {
    pet.xpMilli += milli;
    out.push({ type: 'PET_XP_GAINED', petId: pet.id, milli });
    const stage = maxStage(pet.stage, stageForXpV5(pet.xpMilli, ctx.tuning));
    if (stage !== pet.stage) {
      pet.stage = stage;
      out.push({ type: 'STAGE_GROWN', petId: pet.id, stage });
    }
  }
  for (const u of m.accessoryUnlocks) if (u.atMemoryCount === pet.memoryCount) unlock(pet, u.accessoryId, 'MEMORY', out);
  for (const u of m.kindUnlocks) if (u.memoryKind === e.memoryKind && u.nth === nthOfKind) unlock(pet, u.accessoryId, 'MEMORY', out);
  if (e.attended) {
    pet.attendedCount += 1;
    // Le backend crée alors le souvenir PROMISE_KEPT (qui revient ici comme MEMORY_RECORDED).
    if (m.promiseMilestones.includes(pet.attendedCount)) out.push({ type: 'MILESTONE_REACHED', petId: pet.id, kind: 'PROMISE_KEPT', n: pet.attendedCount });
  }
});

const accessoryGranted = define('ACCESSORY_GRANTED', (pet, e, _ctx, out) => {
  if (pet.unlockedAccessories.includes(e.accessoryId)) return reject(out, 'ACCESSORY_ALREADY_UNLOCKED');
  unlock(pet, e.accessoryId, e.source, out);
});

const accessoryEquip = define('ACCESSORY_EQUIP', (pet, e, ctx, out) => {
  if (new Set(e.accessoryIds).size !== e.accessoryIds.length) return reject(out, 'DUPLICATE_ACCESSORY');
  if (e.accessoryIds.length > ctx.tuning.accessories.maxEquipped) return reject(out, 'TOO_MANY_EQUIPPED');
  if (e.accessoryIds.some((a) => !pet.unlockedAccessories.includes(a))) return reject(out, 'ACCESSORY_NOT_UNLOCKED');
  pet.equipped = [...e.accessoryIds];
});

const react = define('REACT', (pet, e, ctx, out) => {
  if (!(REACTION_POSES as readonly string[]).includes(e.pose)) return reject(out, 'INVALID_POSE');
  const untilMs = ctx.now + ctx.tuning.accessories.reactionTtlMs;
  pet.reaction = { pose: e.pose, untilMs };
  out.push({ type: 'REACTION', petId: pet.id, pose: e.pose, untilMs });
});

export const HANDLERS_V5: HandlerRegistryV5 = {
  MEMORY_RECORDED: memoryRecorded,
  ACCESSORY_GRANTED: accessoryGranted,
  ACCESSORY_EQUIP: accessoryEquip,
  REACT: react,
};
