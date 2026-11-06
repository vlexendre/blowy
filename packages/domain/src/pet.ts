export const SPECIES = ['GASTON', 'PIA', 'NINO', 'SUZIE'] as const;
export type Species = (typeof SPECIES)[number];

/**
 * Pia et Suzie : adoption soumise à un droit Blowy+ valide (arbitrage 5.11).
 * @deprecated V4 — en V5 les 4 espèces sont gratuites (`FREE_SPECIES_V5`).
 */
export const PREMIUM_SPECIES: readonly Species[] = ['PIA', 'SUZIE'];
/** @deprecated V4 — voir `FREE_SPECIES_V5`. */
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

// ---- V5 (spec-v5 §2.13, §5, D-021) ----
/** V5 : les 4 espèces sont gratuites (D-010, P-5.11 remplacé). `PREMIUM_SPECIES`/`FREE_SPECIES` = V4, dépréciés. */
export const FREE_SPECIES_V5: readonly Species[] = SPECIES;

/** Poses que le moteur V5 ne produit jamais (pas de faim ni de santé, concept §6). */
export const RETIRED_POSES_V5: readonly PetPose[] = ['SICK', 'HUNGRY', 'SAD'];
export const PET_POSES_V5 = PET_POSES.filter((p) => !RETIRED_POSES_V5.includes(p)) as readonly PetPose[];

export const PET_MEMORY_KINDS = ['HATCHED', 'OUTING_LIVED', 'DUO_DATE_LIVED', 'BAND_NEW_MEMBER', 'PROMISE_KEPT', 'EGG'] as const;
export type PetMemoryKind = (typeof PET_MEMORY_KINDS)[number];

/** Clé de déduplication d'un souvenir : `<kind>:<refId>:<petId>`. */
export const memoryDedupKey = (kind: PetMemoryKind, refId: string, petId: string): string => `${kind}:${refId}:${petId}`;

export const ACCESSORY_SOURCES = ['MEMORY', 'PLUS_MONTHLY', 'REFERRAL', 'STAFF'] as const;
export type AccessorySource = (typeof ACCESSORY_SOURCES)[number];

/**
 * Borne dure du nombre d'accessoires portés simultanément (contrat API). Le tuning
 * `accessories.maxEquipped` doit rester ≤ cette borne (vérifié par `TuningSchema`).
 */
export const ACCESSORY_EQUIP_CAP = 3;
