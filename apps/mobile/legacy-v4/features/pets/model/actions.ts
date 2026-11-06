/**
 * Règles d'affichage des actions du Nid (pures). La prédiction mobile ne reçoit que des
 * données autorisées : elle n'annonce jamais de gain chiffré avant la réponse serveur.
 */
import type { PetActionResult } from '@blowy/api-contract';
import type { Capability } from '@blowy/domain';

export type PetActionKind = 'CALL' | 'HUG' | 'PLAY' | 'FEED' | 'HEAL';

/** Actions qui peuvent être mises en file hors ligne (soins personnels). Les autres exigent le réseau. */
export const QUEUEABLE_ACTIONS: readonly PetActionKind[] = ['FEED', 'HEAL'];

/** Action à deux : nécessite une relation et les deux pets au même lieu (et la capacité). */
export const PAIR_ACTIONS: readonly PetActionKind[] = ['HUG', 'PLAY'];

const CAPABILITY_FOR: Partial<Record<PetActionKind, Capability>> = { HUG: 'HUG', PLAY: 'PLAY' };

export interface ActionContext {
  hasRelationship: boolean;
  bothHere: boolean;
  myPetHere: boolean;
  capabilities: readonly Capability[];
  online: boolean;
}

export type ActionAvailability = { enabled: true } | { enabled: false; reason: 'NEEDS_PARTNER' | 'NOT_UNLOCKED' | 'NEEDS_NETWORK' | 'NO_RELATIONSHIP' };

export function actionAvailability(kind: PetActionKind, ctx: ActionContext): ActionAvailability {
  if (!ctx.online && !QUEUEABLE_ACTIONS.includes(kind)) return { enabled: false, reason: 'NEEDS_NETWORK' };
  if (kind === 'CALL') return ctx.hasRelationship ? { enabled: true } : { enabled: false, reason: 'NO_RELATIONSHIP' };
  if (PAIR_ACTIONS.includes(kind)) {
    if (!ctx.hasRelationship) return { enabled: false, reason: 'NO_RELATIONSHIP' };
    const cap = CAPABILITY_FOR[kind];
    if (cap && !ctx.capabilities.includes(cap)) return { enabled: false, reason: 'NOT_UNLOCKED' };
    if (!ctx.bothHere) return { enabled: false, reason: 'NEEDS_PARTNER' };
  }
  return { enabled: true };
}

/** Réaction décorative immédiate (aucune jauge modifiée) en attendant le serveur. */
export const anticipatedReaction = (kind: PetActionKind) => (kind === 'HUG' ? 'AFFECTIONATE' : kind === 'PLAY' ? 'LEAP' : kind === 'FEED' ? 'JOYFUL' : kind === 'HEAL' ? 'PROUD' : 'SURPRISED') as 'AFFECTIONATE' | 'LEAP' | 'JOYFUL' | 'PROUD' | 'SURPRISED';

/** Correction : le serveur a refusé, n'a rien donné, ou le pet a dit non. */
export const wasCorrected = (r: PetActionResult): boolean => r.outcome !== 'APPLIED' && r.outcome !== 'MOVED';

export const actionKey = (kind: PetActionKind, relationshipId: string | null) => `${kind}:${relationshipId ?? 'self'}`;
