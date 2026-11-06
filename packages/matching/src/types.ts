/**
 * DTO candidat déjà collecté par le backend : uniquement ce qui sert aux filtres et au score.
 * Aucune donnée privée superflue (pas de nom, photo, message, position exacte : seulement une
 * distance déjà calculée côté serveur et arrondie).
 */
import type { Gender, Intention, Species, Vision } from '@blowy/domain';

export interface MatchProfile {
  userId: string;
  petId: string;
  species: Species;
  vision: Vision;
  age: number;
  gender: Gender;
  intention: Intention;
  /** Préférences déclarées (jamais inférées). Liste vide = aucune restriction de genre. */
  preferences: { minAge: number; maxAge: number; genders: Gender[]; maxDistanceKm: number };
  /** Contrôles d'éligibilité calculés par le backend. */
  eligibility: { adult: boolean; verified: boolean; active: boolean; lastActiveDaysAgo: number; hasFreeSlot: boolean; exclusive: boolean };
  /** Fiabilité 0–100 (comportementale, §7). */
  reliability: number;
  /** Histogramme d'activité agrégé : 24 compteurs horaires (heure locale), sans horodatage. */
  activityByHour: number[];
  /** Mots positifs reçus, agrégés (jamais les répondants). */
  reputationWords: number;
  /**
   * V5 (facultatif) : « qui je veux rencontrer » en groupe (vide = tout le monde) et présences
   * réelles (fiabilité « N sur M »). Fournis par le backend pour la composition et la voie Duo.
   */
  meetGenders?: Gender[];
  attendance?: { attended: number; noShows: number };
}

/** Faits relationnels sur la paire, fournis par le backend (blocages, historique, distance). */
export interface PairFacts {
  distanceKm: number;
  blockedOrReported: boolean;
  metBefore: boolean;
  /** Propositions en cours (entrantes + sortantes) pour chacun. */
  pendingProposals: [number, number];
}

export interface ScoreBreakdown {
  C: number;
  P: number;
  D: number;
  E: number;
  R: number;
  G: number;
  S: number;
  M: number;
  /** Score public de vision 0–100 (entier arrondi). */
  score: number;
}

export type ExclusionReason =
  | 'NOT_ADULT'
  | 'NOT_VERIFIED'
  | 'INACTIVE_ACCOUNT'
  | 'STALE_ACTIVITY'
  | 'NO_SLOT'
  | 'EXCLUSIVE'
  | 'AGE_PREFERENCE'
  | 'GENDER_PREFERENCE'
  | 'DISTANCE'
  | 'INTENTION'
  | 'LIMIT_GHOSTER'
  | 'BLOCKED_OR_REPORTED'
  | 'MET_BEFORE'
  | 'PROPOSAL_QUOTA'
  | 'SELF'
  /** V5 : genre hors de « qui je veux rencontrer ». */
  | 'MEET_GENDER';
