/**
 * Matrice de capacités (P-5.3) : droits ACTUELS dérivés du niveau atteint, de la branche,
 * du statut et des consentements. Atteindre un seuil ne fabrique aucun consentement.
 */
import type { Capability } from '@blowy/domain';

export interface CapabilityInput {
  status: 'ACTIVE' | 'MOVED_IN' | 'PAUSED' | 'LEGACY' | 'ENDED';
  branch: 'UNDECIDED' | 'FRIEND' | 'PLUS';
  reachedLevel: number;
  paused: boolean;
  /** Préférence photo des deux côtés compatible (aucun « NEVER »). */
  photosAllowedByBoth: boolean;
  movedIn: boolean;
}

export function capabilitiesOf(c: CapabilityInput): Capability[] {
  if (c.status === 'ENDED') return [];
  const caps: Capability[] = ['CHAT_TEXT', 'SHARED_NEST'];
  const L = c.reachedLevel;
  if (!c.paused) caps.push('XP_GAIN', 'NUDGES', 'PLAY');
  if (L >= 2) caps.push('HUG', 'GIFT');
  if (L >= 3) {
    if (c.movedIn) caps.push('VOICE');
    if (!c.movedIn && c.status !== 'LEGACY') caps.push('MOVE_IN_PROPOSAL');
    if (c.movedIn) caps.push('BRANCH_VOTE');
  }
  if (L >= 4 && c.photosAllowedByBoth) caps.push(c.branch === 'PLUS' ? 'PHOTO_BLURRED' : 'PHOTO_CLEAR');
  if (L >= 5) {
    if (c.branch === 'PLUS' && c.photosAllowedByBoth) caps.push('PHOTO_ORIGINAL');
    if (c.branch === 'FRIEND') caps.push('IRL_QUEST');
  }
  if (L >= 6 && c.branch === 'PLUS') caps.push('IRL_DATE', 'GUARDIAN');
  if (L >= 7 && c.branch === 'PLUS') caps.push('EGG');
  // Pause : texte/voix déjà autorisés conservés, XP et relances suspendues (filtré plus haut).
  return caps;
}
