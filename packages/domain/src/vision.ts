/**
 * Vision : 4 axes dans [-1, 1].
 * Sens (tests dans pet-engine) :
 *  - kindMischief      : gentil = -1, espiègle = +1
 *  - sportyContemplative : sportif = -1, contemplatif = +1
 *  - scienceArt        : scientifique = -1, artiste = +1
 *  - homeAdventure     : casanier = -1, aventurier = +1
 */
export interface VisionAxes {
  kindMischief: number;
  sportyContemplative: number;
  scienceArt: number;
  homeAdventure: number;
}

export const VISION_AXES = ['kindMischief', 'sportyContemplative', 'scienceArt', 'homeAdventure'] as const;
export type VisionAxis = (typeof VISION_AXES)[number];

export const SCHOOLS = ['BEAUX_ARTS', 'POLYTECHNIQUE', 'CIRQUE', 'AUTODIDACTE'] as const;
export type School = (typeof SCHOOLS)[number];

export const SUNDAYS = ['BRUNCH', 'MUSEE', 'RANDO', 'CANAPE'] as const;
export type Sunday = (typeof SUNDAYS)[number];

export const PASSIONS = [
  'SPORT',
  'MUSIQUE',
  'CUISINE',
  'CINEMA',
  'JEUX',
  'LECTURE',
  'ART',
  'VOYAGE',
  'NATURE',
  'DANSE',
] as const;
export type Passion = (typeof PASSIONS)[number];
export const MAX_PASSIONS = 4;

export const LIMITS = ['GHOSTER', 'MENTIR', 'RETARD', 'JUGER'] as const;
export type Limit = (typeof LIMITS)[number];

export interface Vision {
  axes: VisionAxes;
  school: School;
  sunday: Sunday;
  passions: Passion[];
  limit: Limit;
}

/** Intentions d'onboarding (arbitrage 5.7). Privées, jamais exposées. */
export const INTENTIONS = ['FRIENDS_ONE', 'FRIENDS_GROUP', 'OPEN_TO_MORE', 'LET_IT_HAPPEN'] as const;
export type Intention = (typeof INTENTIONS)[number];

export const GENDERS = ['WOMAN', 'MAN', 'NON_BINARY', 'UNDISCLOSED'] as const;
export type Gender = (typeof GENDERS)[number];

/** Les 12 mots positifs de la page « Décris-moi en 3 mots ». */
export const ANONYMOUS_WORDS = [
  'DROLE',
  'LOYAL',
  'SOLAIRE',
  'CURIEUX',
  'BIENVEILLANT',
  'CREATIF',
  'COURAGEUX',
  'APAISANT',
  'GENEREUX',
  'INSPIRANT',
  'FIABLE',
  'PETILLANT',
] as const;
export type AnonymousWord = (typeof ANONYMOUS_WORDS)[number];
