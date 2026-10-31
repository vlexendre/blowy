export const SPECIES = ['GASTON', 'PIA', 'NINO', 'SUZIE'] as const;
export type Species = (typeof SPECIES)[number];

/** Pia et Suzie : adoption soumise à un droit Blowy+ valide (arbitrage 5.11). */
export const PREMIUM_SPECIES: readonly Species[] = ['PIA', 'SUZIE'];
export const FREE_SPECIES: readonly Species[] = ['GASTON', 'NINO'];

export const SPECIES_LABEL_KEY: Record<Species, string> = {
  GASTON: 'species.gaston',
  PIA: 'species.pia',
  NINO: 'species.nino',
  SUZIE: 'species.suzie',
};

export const STAGES = ['BABY', 'YOUNG', 'ADULT'] as const;
export type Stage = (typeof STAGES)[number];

/** Les 12 états du pack de sprites (stade jeune). */
export const PET_POSES = [
  'PRESENTATION',
  'JOYFUL',
  'SAD',
  'SICK',
  'ASLEEP',
  'HUNGRY',
  'POUTING',
  'PROUD',
  'SURPRISED',
  'AFFECTIONATE',
  'LEAP',
  'DANCE',
] as const;
export type PetPose = (typeof PET_POSES)[number];

/** Réactions événementielles temporaires (TTL), ne masquent jamais maladie/sommeil/faim. */
export const REACTION_POSES = ['POUTING', 'PROUD', 'SURPRISED', 'AFFECTIONATE', 'LEAP', 'DANCE'] as const;
export type ReactionPose = (typeof REACTION_POSES)[number];

/** Jauges [0,100]. `satiety` est affichée comme « faim » (100 = rassasié). */
export interface PetGauges {
  satiety: number;
  energy: number;
  mood: number;
  health: number;
}

export type PetKind = 'PRIMARY' | 'CHILD';

export type VirtualLocationKind = 'HOME' | 'DATE_SPOT' | 'SHARED_HOME' | 'FRIEND_HOME' | 'GROUP_LOCAL' | 'CUSTODY_HOME';

export interface VirtualLocationRef {
  kind: VirtualLocationKind;
  /** Contexte relationnel lié (rendez-vous, bande, ami) — jamais exposé à un tiers. */
  contextId: string | null;
}
