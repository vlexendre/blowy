/**
 * Mission prouvée (validée par le backend après revue) :
 *  - 1 attribution par personne et par jour (relation) ; +6 XP Lien, faim ou humeur +20, XP pet.
 *  - Mission commune (même mission, même journée de relation) : chacun ×2. Le
 *    MissionRewardContext (relation, mission, jour) est créé à la PREMIÈRE validation et fige
 *    k, m et versions. Le premier reçoit base·k·m ; le second reçoit 2·base·k·m et le premier
 *    le complément (2·base·k·m − déjà versé). Total = 4·base·k·m quel que soit l'ordre.
 *  - Un côté dont le gain a été gelé (maladie) ne reçoit pas de complément (pas de contournement).
 */
import type { EngineContext, EffectSink, MissionRewardContext, PetState, RelationshipState, World } from '../model/index.js';
import { adjustGauge } from '../gauges/index.js';
import { grantPetXp } from '../progression/index.js';
import { creditLinkXp, linkGainMilli, quoteLinkGain, recordContribution, sideOf, touchInteraction, bumpScore, addMemory, MEMORY_KEYS } from '../relationship/index.js';
import { localDayKey } from '../time/index.js';
import { rollDaily } from '../shared/index.js';
import { PET_DAILY_KEYS } from '../model/index.js';
import { otherSide, type Side } from '../shared/index.js';
import { defineHandler, reject } from './handler.js';
import { findPet } from './guards.js';
import { ACTION_REACTIONS, react } from './reactions.js';

function missionContext(rel: RelationshipState, missionId: string, ctx: EngineContext, out: EffectSink): MissionRewardContext {
  const dayKey = localDayKey(ctx.now, rel.tz);
  const key = `${rel.id}:${missionId}:${dayKey}`;
  let c = rel.missionContexts[key];
  if (!c) {
    const q = quoteLinkGain(rel, ctx.tuning.actions.mission.linkXp, ctx.now, ctx.tuning);
    c = {
      key,
      relationshipId: rel.id,
      missionId,
      dayKey,
      kPermille: q.kPermille,
      mPermille: q.mPermille,
      tuningVersion: ctx.tuning.version,
      engineVersion: ctx.engineVersion,
      validated: [false, false],
      creditedMilli: [0, 0],
      forfeited: [false, false],
      createdAtMs: ctx.now,
    };
    rel.missionContexts[key] = c;
    out.push({ type: 'MISSION_CONTEXT_CREATED', relationshipId: rel.id, key, kPermille: c.kPermille, mPermille: c.mPermille });
  }
  return c;
}

function creditFromContext(world: World, rel: RelationshipState, c: MissionRewardContext, side: Side, multiplier: number, ctx: EngineContext, out: EffectSink): void {
  if (c.forfeited[side]) return;
  const base = ctx.tuning.actions.mission.linkXp;
  const due = linkGainMilli(base * multiplier, c.kPermille, c.mPermille) - c.creditedMilli[side];
  if (due <= 0) return;
  const paid = creditLinkXp(world, rel, 'MISSION', base * multiplier, { kPermille: c.kPermille, mPermille: c.mPermille, milli: due }, ctx, out);
  if (paid === 0) c.forfeited[side] = true;
  c.creditedMilli[side] += paid;
}

function relationshipReward(world: World, rel: RelationshipState, pet: PetState, missionId: string, ctx: EngineContext, out: EffectSink): void {
  const side = sideOf(rel, pet.id);
  if (side === null) return reject(out, 'NOT_FOUND');
  const t = ctx.tuning;
  const c = missionContext(rel, missionId, ctx, out);
  if (c.validated[side]) return;
  c.validated[side] = true;
  const joint = c.validated[otherSide(side)];
  const mult = joint ? t.actions.mission.jointMultiplier : 1;
  creditFromContext(world, rel, c, side, mult, ctx, out);
  if (joint) {
    creditFromContext(world, rel, c, otherSide(side), mult, ctx, out); // complément du premier
    rel.tension = bumpScore(rel.tension, t.actions.mission.jointTension);
    addMemory(rel, MEMORY_KEYS.JOINT_MISSION, t, out);
  }
  touchInteraction(rel, t);
  recordContribution(rel, side, 'mission', ctx.now, t);
}

export const missionHandler = defineHandler('MISSION_VALIDATED', (world, ev, ctx, out) => {
  const pet = findPet(world, ev.petId, out);
  if (!pet) return;
  const t = ctx.tuning;
  pet.daily = rollDaily(pet.daily, localDayKey(ctx.now, pet.tz), PET_DAILY_KEYS);
  if (pet.daily.counts.missionReward >= t.actions.mission.perPersonPerDay) {
    out.push({ type: 'NO_GAIN_CAP_REACHED', action: 'MISSION', relationshipId: ev.relationshipId, petId: pet.id });
    return;
  }
  pet.daily.counts.missionReward += 1;
  adjustGauge(pet, ev.boost === 'SATIETY' ? 'satiety' : 'mood', t.actions.mission.gaugeBoost, t);
  react(pet, ACTION_REACTIONS.MISSION, ctx, out);
  grantPetXp(pet, 'MISSION', t.actions.mission.petXp, ev.weekendEntitlement, ctx, out);
  out.push({ type: 'COINS_CREDIT', petId: pet.id, amount: t.coins.missionDaily, reason: 'MISSION_REWARD', idempotencyKey: `mission:${pet.id}:${ev.missionId}:${localDayKey(ctx.now, pet.tz)}` });
  const rel = ev.relationshipId ? world.relationships[ev.relationshipId] : undefined;
  if (rel && rel.status !== 'ENDED') relationshipReward(world, rel, pet, ev.missionId, ctx, out);
});
