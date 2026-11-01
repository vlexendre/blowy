/**
 * Gain d'XP du Lien : gain = base · k · m, en milli-points entiers.
 * Les plafonds de base sont appliqués par l'appelant AVANT cette fonction (base déjà plafonnée).
 * Gel si l'un des deux pets principaux est malade, ou si la relation est en pause.
 */
import type { Tuning } from '@blowy/tuning';
import type { EngineContext, EffectSink, GainAction, RelationshipState, World } from '../model/index.js';
import { MILLI, PERMILLE, mulDivFloor } from '../shared/index.js';
import { isSick } from '../gauges/index.js';
import { kPermilleFor } from './contributions.js';
import { petOf } from './location.js';
import { isRelationshipPaused } from './pauses.js';
import { updateProgression } from '../progression/levels.js';

export const affinityMultiplierPermille = (affinity: number, t: Tuning): number =>
  t.link.affinityMultiplier.basePermille + Math.floor((t.link.affinityMultiplier.spanPermille * affinity) / 100);

/** base (points) × k‰ × m‰ → milli-points (arrondi inférieur). */
export const linkGainMilli = (basePoints: number, kPermille: number, mPermille: number): number =>
  mulDivFloor(basePoints * MILLI, kPermille * mPermille, PERMILLE * PERMILLE);

export type FreezeReason = 'SICK' | 'PAUSED' | null;

export function linkFreezeReason(world: World, rel: RelationshipState, nowMs: number, t: Tuning): FreezeReason {
  const sick = [0, 1].some((s) => {
    const pet = petOf(world, rel, s as 0 | 1);
    return !!pet && pet.kind === 'PRIMARY' && isSick(pet, t);
  });
  if (sick) return 'SICK';
  return isRelationshipPaused(world, rel, nowMs) ? 'PAUSED' : null;
}

export interface LinkGainQuote {
  kPermille: number;
  mPermille: number;
  milli: number;
}

/** Devis de gain (snapshot k avant l'événement courant). */
export function quoteLinkGain(rel: RelationshipState, basePoints: number, nowMs: number, t: Tuning): LinkGainQuote {
  const kPermille = kPermilleFor(rel, nowMs, t);
  const mPermille = affinityMultiplierPermille(rel.affinity, t);
  return { kPermille, mPermille, milli: linkGainMilli(basePoints, kPermille, mPermille) };
}

/** Crédite l'XP (si non gelée) et met à jour la progression. Renvoie les milli-points versés. */
export function creditLinkXp(world: World, rel: RelationshipState, source: GainAction, basePoints: number, quote: LinkGainQuote, ctx: EngineContext, out: EffectSink): number {
  if (basePoints <= 0) return 0;
  const frozen = linkFreezeReason(world, rel, ctx.now, ctx.tuning);
  if (frozen) {
    out.push({ type: 'XP_FROZEN', scope: 'LINK', reason: frozen, relationshipId: rel.id, petId: null });
    return 0;
  }
  const before = rel.xpMilli;
  rel.xpMilli += quote.milli;
  out.push({ type: 'LINK_XP_GAINED', relationshipId: rel.id, source, baseXp: basePoints, kPermille: quote.kPermille, mPermille: quote.mPermille, milli: quote.milli });
  updateProgression(rel, ctx.tuning, out, before);
  return quote.milli;
}

/** Raccourci : devis + crédit immédiat. */
export function grantLinkXp(world: World, rel: RelationshipState, source: GainAction, basePoints: number, ctx: EngineContext, out: EffectSink): number {
  return creditLinkXp(world, rel, source, basePoints, quoteLinkGain(rel, basePoints, ctx.now, ctx.tuning), ctx, out);
}
