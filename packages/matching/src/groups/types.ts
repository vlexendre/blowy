/**
 * Entrées / sorties de la composition des sorties (spec-v5 §4.1). Aucune donnée de paiement :
 * le financement n'existe pas en entrée, il ne peut donc rien influencer (§4.7, D-013).
 */
import type { ActivityKind, Gender, UnplacedReason } from '@blowy/domain';
import type { Tuning } from '@blowy/tuning';
import type { MatchProfile } from '../types.js';

export interface OutingCandidate {
  /** Profil existant (vision, âge, genre, espèce, activité, réputation, éligibilité). */
  profile: MatchProfile;
  seeks: { friends: boolean; romance: boolean };
  /** « Qui je veux rencontrer » ; [] = tout le monde. */
  meetGenders: Gender[];
  /** [] si !romance. */
  romanceGenders: Gender[];
  /** = MatchPreferences.ageMin / ageMax. */
  groupAge: { min: number; max: number };
  /** Créneaux disponibles cette semaine (epoch ms) : disponibilités cochées, semaines off exclues par le backend. */
  slotStartsAtMs: number[];
  /** Quartiers acceptables (V5.1 B.8) ; le créneau proposé doit être dans l'un d'eux. */
  neighborhoodIds: string[];
  /** Activités préférées (V5.1 D.14) ; [] = toutes. */
  activities: ActivityKind[];
  /** Team (V5.1 B.7) : 1–3 personnes composées comme une unité indivisible ; null = seul·e. */
  teamId: string | null;
  attendance: { attended: number; noShows: number };
  priority: { missedWeeks: number; firstOuting: boolean; requestedAtMs: number };
}

/** Faits de paire fournis par le backend ; clé `pairKey(a, b)` = "min|max". */
export interface CompositionFacts {
  /** Blocage dans un sens ou l'autre, ou signalement non clos. */
  blockedPairs: ReadonlySet<string>;
  /** Déjà co-présents, lien de bande (même retiré), duo, proposition Duo refusée < 90 j. */
  metPairs: ReadonlySet<string>;
}

export interface SlotOffer {
  venueSlotId: string;
  venueId: string;
  neighborhoodId: string;
  activity: ActivityKind;
  startsAtMs: number;
  /** Tables-sorties encore réservables sur ce créneau. */
  remainingOutings: number;
}

export interface ComposeInput {
  candidates: readonly OutingCandidate[];
  facts: CompositionFacts;
  slots: readonly SlotOffer[];
  /** `"outings|<neighborhoodId>|<weekKey>|<tuningVersion>"`. */
  seed: string;
  tuning: Tuning;
}

export interface ComposedGroup {
  venueSlotId: string;
  venueId: string;
  neighborhoodId: string;
  activity: ActivityKind;
  startsAtMs: number;
  /** Triés par userId. */
  memberUserIds: string[];
  /** Objectif J(G) en milli-points. */
  objectiveMilli: number;
  /** Score de paire minimal du groupe (0–100). */
  pairMinScore: number;
  /** Teams (≥ 2 personnes) du groupe, pour l'aperçu anonyme. */
  teamCount: number;
}

export interface CompositionStats {
  candidates: number;
  placed: number;
  groups: number;
  /** Moyenne des scores de paire des groupes, arrondie (0–100). */
  meanPairScore: number;
  /** Part (‰) des chercheurs romance placés ayant ≥ 1 personne romance-compatible dans leur groupe. */
  romanceCoverage: number;
  /** Groupes dont la part du genre majoritaire dépasse `maxGenderSharePermille` (pénalisés). */
  genderImbalancedGroups: number;
  /** Passes d'amélioration locale effectuées. */
  iterations: number;
}

export interface CompositionResult {
  algoVersion: string;
  groups: ComposedGroup[];
  unplaced: Array<{ userId: string; reason: UnplacedReason }>;
  stats: CompositionStats;
}

export interface BackfillInput {
  /** Places invitées + confirmées de la sortie. */
  outingMembers: readonly OutingCandidate[];
  /** Créneau de la sortie (instant, quartier, activité). */
  slot: Pick<SlotOffer, 'startsAtMs' | 'neighborhoodId' | 'activity'>;
  /** Demandes UNPLACED de la semaine disponibles sur ce créneau. */
  pool: readonly OutingCandidate[];
  facts: CompositionFacts;
  seed: string;
  tuning: Tuning;
}
