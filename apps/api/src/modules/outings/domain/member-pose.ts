/**
 * V5.10 (passe 5) : pose du pet de chaque membre dans les vues de groupe. Décorative et DÉTERMINISTE : fonction de la
 * sortie, du membre et du moment seulement (même pose pour tous les lecteurs à un moment donné) — jamais d'un signal
 * sur la personne (humeur, fiabilité, présence, vote). Toujours parmi les poses V5 (jamais SICK / HUNGRY / SAD).
 */
import type { PetPose } from '@blowy/domain';
import type { ViewerPhase } from './visibility.js';

export type MemberPose = Exclude<PetPose, 'SICK' | 'HUNGRY' | 'SAD'>;
export type PoseMoment = 'BEFORE' | 'CONFIRMATION' | 'LIVE' | 'AFTER';

/** Poses possibles par moment (proposition / groupe, confirmation, pendant, après). */
export const POSES_BY_MOMENT: Readonly<Record<PoseMoment, readonly MemberPose[]>> = {
  BEFORE: ['PRESENTATION', 'JOYFUL', 'SURPRISED', 'POUTING', 'AFFECTIONATE', 'PROUD'],
  CONFIRMATION: ['JOYFUL', 'PROUD', 'AFFECTIONATE', 'POUTING', 'SURPRISED', 'LEAP'],
  LIVE: ['JOYFUL', 'LEAP', 'DANCE', 'PROUD', 'AFFECTIONATE'],
  AFTER: ['AFFECTIONATE', 'JOYFUL', 'DANCE', 'ASLEEP', 'PROUD'],
};

export const poseMomentOf = (phase: ViewerPhase): PoseMoment => (phase === 'INVITED' || phase === 'PRE_LOCK' ? 'BEFORE' : phase === 'LOCKED' || phase === 'FACES' ? 'CONFIRMATION' : phase === 'CHECKIN' ? 'LIVE' : 'AFTER');

/** FNV-1a 32 bits : stable entre processus et versions (pas d'aléa, pas de secret). */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function memberPose(outingId: string, userId: string, moment: PoseMoment): MemberPose {
  const pool = POSES_BY_MOMENT[moment];
  return pool[fnv1a(`${outingId}|${userId}|${moment}`) % pool.length]!;
}
