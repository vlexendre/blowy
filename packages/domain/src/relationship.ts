/** Contextes distincts sur une même paire canonique de pets (§6 Graphe). */
export const RELATIONSHIP_CONTEXTS = ['DATE', 'NEIGHBORHOOD', 'GROUP', 'COPARENT'] as const;
export type RelationshipContextType = (typeof RELATIONSHIP_CONTEXTS)[number];

export const RELATIONSHIP_STATUSES = ['ACTIVE', 'MOVED_IN', 'PAUSED', 'LEGACY', 'ENDED'] as const;
export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];

export type Branch = 'UNDECIDED' | 'FRIEND' | 'PLUS';

export type EndReason =
  | 'CLEAN_LEAVE'
  | 'SILENCE_14D'
  | 'MOVED_IN_ELSEWHERE'
  | 'BLOCK'
  | 'REPORT_SAFETY_EXIT'
  | 'ACCOUNT_DELETED'
  | 'TRANSFERRED_TO_NEIGHBORHOOD'
  | 'MODERATION';

/** Seuils d'XP du Lien, niveaux 1 à 7 (en points entiers ; stockage interne en milli-points). */
export const LINK_LEVEL_THRESHOLDS = [0, 150, 500, 900, 1400, 2000, 3000] as const;
export const MILLI = 1000;

export type LinkLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Distinctions explicites (arbitrage 5.3) :
 *  - xpMilli            : XP accumulée (ne baisse jamais)
 *  - eligibleLevel      : niveau qu'autoriserait l'XP seule
 *  - reachedLevel       : niveau historique atteint (portes franchies), ne redescend pas
 *  - capabilities       : droits actuellement ouverts (révocables)
 */
export interface LinkProgress {
  xpMilli: number;
  eligibleLevel: LinkLevel;
  reachedLevel: LinkLevel;
}

export const CAPABILITIES = [
  'CHAT_TEXT',
  'SHARED_NEST',
  'HUG',
  'GIFT',
  'PLAY',
  'VOICE',
  'MOVE_IN_PROPOSAL',
  'BRANCH_VOTE',
  'PHOTO_CLEAR',
  'PHOTO_BLURRED',
  'PHOTO_ORIGINAL',
  'IRL_QUEST',
  'IRL_DATE',
  'GUARDIAN',
  'EGG',
  'XP_GAIN',
  'NUDGES',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export type PhotoPreference = 'FROM_LEVEL_4_WITH_CONSENT' | 'NEVER';

export type ConsentScope =
  | 'MOVE_IN'
  | 'BRANCH_VOTE'
  | 'PHOTO_REVEAL'
  | 'PHOTO_ORIGINAL'
  | 'IRL_DATE'
  | 'EGG'
  | 'TRANSFER_TO_NEIGHBORHOOD';

export type BallotChoice = 'FRIEND' | 'PLUS';
