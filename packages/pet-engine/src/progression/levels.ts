/**
 * Niveaux du Lien. Distinctions (§5.3) :
 *  - eligibleLevel : ce qu'autorise l'XP seule ;
 *  - reachedLevel  : niveau historique, franchi seulement si les portes de la transition sont
 *    ouvertes ; ne redescend jamais ;
 *  - capacités actuelles : `capabilitiesFor` (révocables).
 */
import type { LinkLevel } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { EffectSink, ProgressionGates, RelationshipState } from '../model/index.js';
import { MILLI } from '../shared/index.js';
import { UNLOCK_LEVEL } from './unlock.js';

export function eligibleLevel(xpMilli: number, t: Tuning): LinkLevel {
  let lvl = 1;
  t.link.levelThresholds.forEach((th, i) => {
    if (xpMilli >= th * MILLI) lvl = i + 1;
  });
  return lvl as LinkLevel;
}

/** Porte de consentement pour ENTRER au niveau `to` (en plus de l'XP). Table, pas de if dispersés. */
const TRANSITION_GATES: Record<LinkLevel, (g: ProgressionGates, t: Tuning) => boolean> = {
  1: () => true,
  2: () => true,
  [UNLOCK_LEVEL.MOVE_IN]: (g) => g.moveInAccepted,
  4: (g) => g.branch !== 'UNDECIDED',
  5: (g) => g.branch === 'FRIEND' || (g.branch === 'PLUS' && g.plusRevealAccepted),
  6: (g) => g.branch === 'FRIEND' || (g.branch === 'PLUS' && g.irlDateConfirmed),
  7: (g, t) => g.branch === 'PLUS' && g.irlDateConfirmed && g.eggAccepted && t.link.friendMaxLevel < UNLOCK_LEVEL.EGG,
};

export const gateOpen = (to: LinkLevel, g: ProgressionGates, t: Tuning): boolean => TRANSITION_GATES[to](g, t);

/** Plus haut niveau atteignable compte tenu de l'XP et des portes (séquentiel, sans saut). */
export function reachableLevel(rel: RelationshipState, t: Tuning): LinkLevel {
  const eligible = eligibleLevel(rel.xpMilli, t);
  let lvl = rel.reachedLevel;
  while (lvl < eligible && gateOpen((lvl + 1) as LinkLevel, rel.gates, t)) lvl = (lvl + 1) as LinkLevel;
  return lvl;
}

/** Met à jour reachedLevel (monotone) et émet les effets d'éligibilité/atteinte. */
export function updateProgression(rel: RelationshipState, t: Tuning, out: EffectSink, previousXpMilli: number): void {
  const prevEligible = eligibleLevel(previousXpMilli, t);
  const nowEligible = eligibleLevel(rel.xpMilli, t);
  for (let l = prevEligible + 1; l <= nowEligible; l++) out.push({ type: 'LEVEL_ELIGIBLE', relationshipId: rel.id, level: l as LinkLevel });
  const target = reachableLevel(rel, t);
  for (let l = rel.reachedLevel + 1; l <= target; l++) out.push({ type: 'LEVEL_REACHED', relationshipId: rel.id, level: l as LinkLevel });
  if (target > rel.reachedLevel) rel.reachedLevel = target;
}
