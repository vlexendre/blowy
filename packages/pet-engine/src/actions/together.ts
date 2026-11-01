/**
 * Actions « à deux » (câlin, jouer) : même lieu, plafond d'action vs plafond de gain, gain
 * du Lien = base·k·m, effets de jauges sur les deux pets. Un template partagé, deux stratégies.
 */
import type { Capability } from '@blowy/domain';
import type { EngineContext, EffectSink, EventOf, GainAction, RelDailyKey, RelationshipState, World } from '../model/index.js';
import { adjustGauge } from '../gauges/index.js';
import { bumpScore, grantLinkXp, petOf, recordContribution, touchInteraction } from '../relationship/index.js';
import { SIDES } from '../shared/index.js';
import { reject } from './handler.js';
import { consumeCaps, requireCapability, liveRelationship, relDaily, requireTogether } from './guards.js';
import { react } from './reactions.js';
import type { ReactionPose } from '@blowy/domain';

export interface TogetherSpec {
  action: GainAction;
  capability: Capability;
  actionKey: RelDailyKey;
  gainKey: RelDailyKey;
  reaction: ReactionPose;
  caps: (ctx: EngineContext) => { actionCapPerDay: number; gainCapPerDay: number };
  linkXp: (ctx: EngineContext) => number;
  /** Préconditions spécifiques (ex. complicité ≥ 20). */
  precheck?: (rel: RelationshipState, ctx: EngineContext, out: EffectSink) => boolean;
  /** Effets non-XP appliqués à chaque réalisation (même sans gain d'XP). */
  apply: (world: World, rel: RelationshipState, ctx: EngineContext) => void;
  /** Compte comme contribution « jeu » de l'acteur. */
  contributes: boolean;
}

export function runTogether(spec: TogetherSpec, world: World, ev: EventOf<'HUG'> | EventOf<'PLAY'>, ctx: EngineContext, out: EffectSink): void {
  const rel = liveRelationship(world, ev.relationshipId, out);
  if (!rel) return;
  if (!requireCapability(world, rel, spec.capability, ctx, out)) return;
  if (!requireTogether(world, rel, out)) return;
  if (spec.precheck && !spec.precheck(rel, ctx, out)) return;
  const verdict = consumeCaps(relDaily(rel, ctx), spec.actionKey, spec.gainKey, spec.caps(ctx));
  if (verdict === 'REJECT') return reject(out, 'ACTION_CAP_REACHED');
  for (const s of SIDES) {
    const pet = petOf(world, rel, s);
    if (pet) react(pet, spec.reaction, ctx, out);
  }
  if (verdict === 'NO_GAIN') {
    out.push({ type: 'NO_GAIN_CAP_REACHED', action: spec.action, relationshipId: rel.id, petId: null });
    return;
  }
  spec.apply(world, rel, ctx);
  touchInteraction(rel, ctx.tuning);
  // Snapshot k AVANT d'enregistrer la contribution de l'événement courant.
  grantLinkXp(world, rel, spec.action, spec.linkXp(ctx), ctx, out);
  if (spec.contributes) recordContribution(rel, ev.actorSide, 'play', ctx.now, ctx.tuning);
}

const eachPet = (world: World, rel: RelationshipState, fn: (pet: NonNullable<ReturnType<typeof petOf>>) => void): void => {
  for (const s of SIDES) {
    const pet = petOf(world, rel, s);
    if (pet) fn(pet);
  }
};

export const HUG_SPEC: TogetherSpec = {
  action: 'HUG',
  capability: 'HUG',
  actionKey: 'hugAction',
  gainKey: 'hugGain',
  reaction: 'AFFECTIONATE',
  caps: (ctx) => ctx.tuning.actions.hug,
  linkXp: (ctx) => ctx.tuning.actions.hug.linkXp,
  precheck: (rel, ctx, out) => (rel.complicity >= ctx.tuning.actions.hug.minComplicity ? true : (reject(out, 'COMPLICITY_TOO_LOW'), false)),
  apply: (world, rel, ctx) => {
    const h = ctx.tuning.actions.hug;
    rel.complicity = bumpScore(rel.complicity, h.complicity);
    rel.tension = bumpScore(rel.tension, h.tension);
    eachPet(world, rel, (p) => adjustGauge(p, 'mood', h.mood, ctx.tuning));
  },
  contributes: true,
};

export const PLAY_SPEC: TogetherSpec = {
  action: 'PLAY',
  capability: 'PLAY',
  actionKey: 'playAction',
  gainKey: 'playGain',
  reaction: 'LEAP',
  caps: (ctx) => ctx.tuning.actions.play,
  linkXp: (ctx) => ctx.tuning.actions.play.linkXp,
  apply: (world, _rel, ctx) => {
    const p = ctx.tuning.actions.play;
    eachPet(world, _rel, (pet) => {
      adjustGauge(pet, 'mood', p.mood, ctx.tuning);
      adjustGauge(pet, 'energy', p.energy, ctx.tuning);
    });
  },
  contributes: true,
};
