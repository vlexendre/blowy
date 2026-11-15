/**
 * Le bilan de la semaine (dimanche soir) : ce que la personne a fait, ce que le minimoa a remarqué de sa vision,
 * un conseil, un mot par lien actif. Toujours positif : on nomme ce qui a marché, le conseil est une proposition.
 * Ici : les règles (quoi dire, quand) et le garde-fou ; les phrases sont dans `@blowy/content` (v7/rituels).
 */
import { type Day, addDays } from '../days';
import { VISION_AXES, type VisionAxis } from '../vision';
import { weekStartOf, weekdayOf } from './week';

/** Dimanche, à partir de 19 h (Paris). */
export const REVIEW_WEEKDAY = 6;
export const REVIEW_HOUR = 19;
export const reviewDue = (today: Day, parisHour: number): boolean => weekdayOf(today) === REVIEW_WEEKDAY && parisHour >= REVIEW_HOUR;

export interface WeekFacts {
  /** Jours avec une sortie déclarée. */
  outings: number;
  /** Habitudes tenues (preuves qui comptent). */
  habitsKept: number;
  /** Défis du jour faits. */
  challengesDone: number;
  /** Série en cours en fin de semaine, et record. */
  streak: number;
  bestStreak: number;
  /** Jokers utilisés cette semaine. */
  jokersUsed: number;
}

/** Semaine active : au moins deux gestes. Seules ces personnes peuvent avoir un bilan reformulé par l'IA. */
export const isActiveWeek = (f: WeekFacts): boolean => f.outings + f.habitsKept + f.challengesDone >= 2;

export const REVIEW_HIGHLIGHTS = ['outings', 'habits', 'challenges', 'streak', 'calm'] as const;
export type ReviewHighlight = (typeof REVIEW_HIGHLIGHTS)[number];

/** Ce qui a marché, dans l'ordre ; « calm » seulement si rien d'autre (une semaine calme, ça compte aussi). */
export function reviewHighlights(f: WeekFacts): ReviewHighlight[] {
  const out: ReviewHighlight[] = [];
  if (f.outings > 0) out.push('outings');
  if (f.habitsKept > 0) out.push('habits');
  if (f.challengesDone > 0) out.push('challenges');
  if (f.streak >= 3) out.push('streak');
  return out.length > 0 ? out : ['calm'];
}

export const REVIEW_TIPS = ['go_out', 'habit', 'challenge', 'write', 'keep_going'] as const;
export type ReviewTip = (typeof REVIEW_TIPS)[number];

/** Un seul conseil : une proposition sur ce qui a le plus de place pour grandir. */
export function reviewTip(f: WeekFacts, activeLinks: number): ReviewTip {
  if (f.outings < 2) return 'go_out';
  if (f.habitsKept < 2) return 'habit';
  if (f.challengesDone < 4) return 'challenge';
  if (activeLinks > 0) return 'write';
  return 'keep_going';
}

/** Mouvement de la vision sur la semaine (par axe, en points). Seuil sous lequel on parle de stabilité. */
export const NOTICE_MIN_DELTA = 5;
export function noticedMove(deltas: Partial<Record<VisionAxis, number>> | null): { axis: VisionAxis; direction: 'up' | 'down' } | null {
  if (!deltas) return null;
  let best: VisionAxis | null = null;
  for (const axis of VISION_AXES) {
    const v = Math.abs(deltas[axis] ?? 0);
    if (v >= NOTICE_MIN_DELTA && (best === null || v > Math.abs(deltas[best] ?? 0))) best = axis;
  }
  return best === null ? null : { axis: best, direction: (deltas[best] ?? 0) > 0 ? 'up' : 'down' };
}

/**
 * Mouvement de chaque axe sur la semaine, en gros (pour faire bouger la barre de l'axe à l'écran, jamais un chiffre) :
 * direction (up : vers le pôle + · down : vers le pôle − · steady : moins de NOTICE_MIN_DELTA) et taille
 * (small : moins de 10 points · medium : 10 à 19 · large : 20 et plus ; null quand l'axe ne bouge pas).
 * Seulement les axes connus des deux relevés ; dans l'ordre des axes.
 */
export const AXIS_MOVE_SIZES = ['small', 'medium', 'large'] as const;
export type AxisMoveSize = (typeof AXIS_MOVE_SIZES)[number];
export interface AxisMove {
  axis: VisionAxis;
  direction: 'up' | 'down' | 'steady';
  size: AxisMoveSize | null;
}
export const MOVE_MEDIUM = 10;
export const MOVE_LARGE = 20;
export function axisMoves(deltas: Partial<Record<VisionAxis, number>> | null): AxisMove[] {
  if (!deltas) return [];
  return VISION_AXES.flatMap((axis): AxisMove[] => {
    const d = deltas[axis];
    if (d === undefined) return [];
    const abs = Math.abs(d);
    if (abs < NOTICE_MIN_DELTA) return [{ axis, direction: 'steady', size: null }];
    return [{ axis, direction: d > 0 ? 'up' : 'down', size: abs >= MOVE_LARGE ? 'large' : abs >= MOVE_MEDIUM ? 'medium' : 'small' }];
  });
}

export const LINK_NOTES = ['streak', 'close', 'steady', 'growing'] as const;
export type LinkNote = (typeof LINK_NOTES)[number];

/** Un mot par lien actif, toujours sur ce qui va bien. */
export function linkNote(link: { streak: number; level: number; lives: number }): LinkNote {
  if (link.streak >= 3) return 'streak';
  if (link.level >= 4) return 'close';
  if (link.lives >= 6) return 'steady';
  return 'growing';
}

/**
 * Garde-fou : refuse un texte qui reproche, culpabilise ou dramatise. Utilisé sur les modèles de phrases (tests)
 * et sur tout texte reformulé par l'IA (sinon on garde le modèle).
 */
/** Débuts de mots (ou expressions) interdits ; « $ » en fin d'entrée : le mot entier. */
const NEGATIVE_STEMS: readonly string[] = [
  'pas assez$',
  'jamais$',
  'dommage$',
  'abandon',
  'échec',
  'échou',
  'raté',
  'rater$',
  'mauvais',
  'décev',
  'déçu',
  'manqu',
  'nul$',
  'nulle$',
  'paresse',
  'honte',
  'tu dois$',
  'il faut$',
  'il te faut$',
  'faudrait$',
  'devrais$',
  "tu n'as pas$",
  'tu n’as pas$',
  "tu n'as rien$",
  'tu n’as rien$',
  'seulement$',
  'négli',
  'oubli',
  'pire$',
  'triste',
  'reproch',
  'culpab',
  'faible',
  'peine$',
  'personne ne$',
  'moins que$',
];

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Bornes de mots qui comprennent les lettres accentuées (`\b` de JavaScript ne les voit pas). */
export const NEGATIVE_WORDING: readonly RegExp[] = NEGATIVE_STEMS.map((stem) => {
  const whole = stem.endsWith('$');
  const body = escape(whole ? stem.slice(0, -1) : stem).replace(/ /g, '\\s+');
  return new RegExp(`(?<![\\p{L}])${body}${whole ? '(?![\\p{L}])' : ''}`, 'iu');
});

export const REVIEW_TEXT_MAX = 700;

export function isKindText(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > REVIEW_TEXT_MAX) return false;
  return !NEGATIVE_WORDING.some((re) => re.test(t));
}

/**
 * Semaine dont le bilan est dû à cet instant (son lundi), ou null : dimanche à partir de 19 h pour la semaine qui
 * s'achève, et tout le lundi en rattrapage (si le minuteur n'a pas pu finir dimanche soir).
 */
export function reviewWeekDue(today: Day, parisHour: number): Day | null {
  if (reviewDue(today, parisHour)) return weekStartOf(today);
  if (weekdayOf(today) === 0) return weekStartOf(addDays(today, -1));
  return null;
}
