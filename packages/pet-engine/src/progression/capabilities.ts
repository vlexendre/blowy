/**
 * Matrice de capacités (§5.3) : droits ACTUELS, dérivés du niveau atteint, de la branche
 * effective, du statut, des portes et des préférences. Atteindre un seuil ne fabrique aucun
 * consentement ; « jamais » (photos) l'emporte sur tout niveau ; aucun paiement n'intervient.
 *
 * Transitions spéciales :
 *  - PAUSE      : conserve texte/vocaux déjà autorisés ; suspend XP_GAIN et NUDGES.
 *  - TRANSFERT  : Ami N6 → Quartier : conserve la communication consentie, sans exclusivité.
 *  - ENTRÉE PLUS: exige toutes les portes Plus (révélation, RDV confirmé…) même avec un
 *                 niveau historique élevé atteint en Ami.
 */
import type { Capability, RelationshipStatus } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { ProgressionGates, RelationshipState } from '../model/index.js';
import { UNLOCK_LEVEL } from './unlock.js';

export interface CapabilityInput {
  reachedLevel: number;
  status: RelationshipStatus;
  gates: ProgressionGates;
  /** Pause effective (relation ou globale d'un côté). */
  paused: boolean;
  /** Relation transférée au Quartier (Ami N6, accord mutuel). */
  transferred: boolean;
}

type Rule = (i: CapabilityInput, t: Tuning) => boolean;

const both = (v: readonly [boolean, boolean]): boolean => v[0] && v[1];
const photoAllowed = (g: ProgressionGates): boolean => g.photoPreference.every((p) => p === 'FROM_LEVEL_4_WITH_CONSENT') && both(g.photoConsent);
const live = (i: CapabilityInput): boolean => i.status !== 'ENDED';
const atLeast = (i: CapabilityInput, n: number): boolean => i.reachedLevel >= n;
const plus = (i: CapabilityInput): boolean => i.gates.branch === 'PLUS' && !i.transferred;
const friend = (i: CapabilityInput): boolean => i.gates.branch === 'FRIEND';

/** Une règle par capacité (table de stratégies). */
export const CAPABILITY_RULES: Record<Capability, Rule> = {
  CHAT_TEXT: (i) => live(i),
  SHARED_NEST: (i) => live(i) && !i.transferred,
  PLAY: (i) => live(i) && !i.paused,
  HUG: (i, t) => live(i) && !i.paused && atLeast(i, t.actions.hug.minLevel),
  GIFT: (i, t) => live(i) && !i.paused && atLeast(i, t.actions.gift.minLevel),
  MOVE_IN_PROPOSAL: (i) => live(i) && !i.paused && i.status === 'ACTIVE' && !i.gates.moveInAccepted && !i.transferred,
  /** Voix : débloquées à l'emménagement, conservées pendant une pause et après transfert. */
  VOICE: (i) => live(i) && atLeast(i, UNLOCK_LEVEL.MOVE_IN),
  BRANCH_VOTE: (i) => live(i) && !i.paused && atLeast(i, UNLOCK_LEVEL.MOVE_IN) && !i.transferred,
  PHOTO_CLEAR: (i) => live(i) && friend(i) && atLeast(i, UNLOCK_LEVEL.PHOTO) && photoAllowed(i.gates),
  PHOTO_BLURRED: (i) => live(i) && plus(i) && atLeast(i, UNLOCK_LEVEL.PHOTO) && photoAllowed(i.gates),
  PHOTO_ORIGINAL: (i) => live(i) && plus(i) && atLeast(i, UNLOCK_LEVEL.IRL_QUEST_OR_REVEAL) && i.gates.plusRevealAccepted && photoAllowed(i.gates) && both(i.gates.photoOriginalConsent),
  IRL_QUEST: (i) => live(i) && friend(i) && atLeast(i, UNLOCK_LEVEL.IRL_QUEST_OR_REVEAL) && !i.paused,
  IRL_DATE: (i) => live(i) && plus(i) && atLeast(i, UNLOCK_LEVEL.INSEPARABLE_OR_IRL_DATE) && i.gates.plusRevealAccepted && !i.paused,
  GUARDIAN: (i) => live(i) && plus(i) && atLeast(i, UNLOCK_LEVEL.INSEPARABLE_OR_IRL_DATE) && !i.paused,
  EGG: (i, t) => live(i) && plus(i) && atLeast(i, UNLOCK_LEVEL.EGG) && i.gates.irlDateConfirmed && i.gates.eggAccepted && !i.paused && t.link.friendMaxLevel < UNLOCK_LEVEL.EGG,
  XP_GAIN: (i) => live(i) && !i.paused,
  NUDGES: (i) => live(i) && !i.paused,
};

export function capabilitiesFor(rel: Pick<RelationshipState, 'reachedLevel' | 'status' | 'gates'>, ctx: { paused: boolean; tuning: Tuning }): Set<Capability> {
  const input: CapabilityInput = {
    reachedLevel: rel.reachedLevel,
    status: rel.status,
    gates: rel.gates,
    paused: ctx.paused || rel.status === 'PAUSED',
    transferred: rel.gates.transferToNeighborhoodAccepted,
  };
  const out = new Set<Capability>();
  for (const [cap, rule] of Object.entries(CAPABILITY_RULES) as Array<[Capability, Rule]>) if (rule(input, ctx.tuning)) out.add(cap);
  return out;
}

/** Transfert Ami N6 → Quartier possible ? (accord mutuel requis en plus, côté backend). */
export const canTransferToNeighborhood = (rel: Pick<RelationshipState, 'reachedLevel' | 'gates' | 'status'>, t: Tuning): boolean =>
  rel.status !== 'ENDED' && rel.gates.branch === 'FRIEND' && rel.reachedLevel >= t.link.friendMaxLevel;
