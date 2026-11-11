/**
 * Un lien = la relation entre deux personnes (et leurs deux pets).
 * 7 vies : un jour sans échange en coûte une. À 0, le lien devient fantôme ;
 * on peut le ranimer une seule fois. 7 niveaux débloqués par l'expérience.
 * Moteur pur : le rattrapage des jours passés se fait à la lecture (`tickLink`).
 */
import { type Day, daysBetween } from './days';

export const MAX_LIVES = 7;
export const REVIVE_LIVES = 3;
export const MAX_LEVEL = 7;

export const LINK_STATUSES = ['active', 'ghost', 'archived'] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export interface LinkState {
  status: LinkStatus;
  lives: number;
  xp: number;
  level: number;
  /** Jours consécutifs où les deux ont envoyé leur photo du jour. */
  streak: number;
  /** Dernier jour où quelqu'un a écrit ou envoyé une photo. */
  lastActiveOn: Day;
  /** Dernier jour déjà pris en compte pour les vies. */
  lastTickOn: Day;
  /** Dernier jour où la photo du jour a été faite par les deux. */
  lastDuoPhotoOn: Day | null;
  /** Vrai si le lien a déjà été ranimé. */
  revived: boolean;
}

/** Niveau n atteint à partir de LEVEL_XP[n-1] points. */
export const LEVEL_XP = [0, 40, 120, 260, 480, 800, 1200] as const;
export const LEVEL_KEYS = ['rendezvous', 'jouent', 'emmenagent', 'visage_flou', 'revelation', 'irl', 'oeuf'] as const;
export type LevelKey = (typeof LEVEL_KEYS)[number];

/** Les visages sont cachés avant le niveau 4, flous au niveau 4, nets à partir du 5. */
export type FaceVisibility = 'hidden' | 'blurred' | 'clear';
export const faceVisibility = (level: number): FaceVisibility => (level >= 5 ? 'clear' : level >= 4 ? 'blurred' : 'hidden');

export const levelForXp = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= (LEVEL_XP[i] ?? Infinity)) level = i + 1;
  return level;
};

export function levelProgress(xp: number): { level: number; into: number; span: number; ratio: number } {
  const level = levelForXp(xp);
  const base = LEVEL_XP[level - 1] ?? 0;
  const next = LEVEL_XP[level];
  if (next === undefined) return { level, into: xp - base, span: 0, ratio: 1 };
  return { level, into: xp - base, span: next - base, ratio: (xp - base) / (next - base) };
}

export function newLink(today: Day): LinkState {
  return { status: 'active', lives: MAX_LIVES, xp: 0, level: 1, streak: 0, lastActiveOn: today, lastTickOn: today, lastDuoPhotoOn: null, revived: false };
}

/** Applique les jours écoulés : chaque jour entier sans activité coûte une vie. */
export function tickLink(s: LinkState, today: Day): LinkState {
  if (s.status !== 'active') return s;
  const elapsed = daysBetween(s.lastTickOn, today);
  if (elapsed <= 0) return s;
  // Jours entiers de silence comptés jusqu'à un jour donné, moins ceux déjà facturés.
  const silentUntil = (d: Day): number => Math.max(0, daysBetween(s.lastActiveOn, d) - 1);
  const lost = Math.min(s.lives, silentUntil(today) - silentUntil(s.lastTickOn));
  const lives = s.lives - lost;
  const streak = s.lastDuoPhotoOn && daysBetween(s.lastDuoPhotoOn, today) <= 1 ? s.streak : 0;
  return { ...s, lives, streak, lastTickOn: today, status: lives === 0 ? 'ghost' : 'active' };
}

export const LINK_EVENT_KINDS = ['message', 'photo', 'duo_photo', 'challenge'] as const;
export type LinkEventKind = (typeof LINK_EVENT_KINDS)[number];

const XP: Record<LinkEventKind, number> = { message: 1, photo: 8, duo_photo: 12, challenge: 10 };
/** Plafond d'expérience gagnée par jour avec les seuls messages. */
export const MESSAGE_XP_PER_DAY = 20;

export interface LinkEffect {
  state: LinkState;
  leveledUp: boolean;
  lifeGained: boolean;
}

/**
 * Applique une activité du jour. `messageXpToday` = expérience déjà gagnée aujourd'hui par messages.
 * `duo_photo` est émis quand la deuxième personne envoie sa photo du jour : +1 vie, série +1.
 */
export function applyLinkEvent(prev: LinkState, kind: LinkEventKind, today: Day, messageXpToday = 0): LinkEffect {
  const s = tickLink(prev, today);
  if (s.status !== 'active') return { state: s, leveledUp: false, lifeGained: false };
  let gain = XP[kind];
  if (kind === 'message') gain = messageXpToday >= MESSAGE_XP_PER_DAY ? 0 : gain;
  const xp = s.xp + gain;
  const level = Math.max(s.level, levelForXp(xp));
  let { lives, streak, lastDuoPhotoOn } = s;
  let lifeGained = false;
  if (kind === 'duo_photo' && lastDuoPhotoOn !== today) {
    streak += 1;
    lastDuoPhotoOn = today;
    if (lives < MAX_LIVES) {
      lives += 1;
      lifeGained = true;
    }
  }
  return {
    state: { ...s, xp, level, lives, streak, lastDuoPhotoOn, lastActiveOn: today, lastTickOn: today },
    leveledUp: level > s.level,
    lifeGained,
  };
}

/** Ranimer un lien fantôme : possible une seule fois. */
export function reviveLink(prev: LinkState, today: Day): LinkState | null {
  const s = tickLink(prev, today);
  if (s.status !== 'ghost' || s.revived) return null;
  return { ...s, status: 'active', lives: REVIVE_LIVES, revived: true, lastActiveOn: today, lastTickOn: today };
}
export const canRevive = (s: LinkState): boolean => s.status === 'ghost' && !s.revived;
