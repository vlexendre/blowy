/**
 * Port vers le moteur pur (@blowy/pet-engine, @blowy/matching, @blowy/tuning — agent B).
 * Le backend ne recopie AUCUNE règle de jeu : l'adapter (shared/infrastructure/engine/) délègue
 * aux packages purs. L'état moteur est opaque (`engineState`), persisté et versionné.
 */
import type { PetPose, Species, Vision } from '@blowy/domain';

export interface Gauges {
  satiety: number;
  energy: number;
  mood: number;
  health: number;
}

export interface PetSnapshot {
  gauges: Gauges;
  petXpMilli: number;
  /** Instant jusqu'auquel le temps est intégré. */
  asOf: Date;
  /** État moteur sérialisable (opaque pour le backend). */
  engineState: unknown;
  engineVersion: string;
  tuningVersion: string;
}

export interface PetTimeContext {
  timezone: string;
  /** Intervalles de pause globale (decay suspendu). */
  pauses: readonly { from: Date; to: Date }[];
}

export type PetCareAction = 'FEED' | 'HEAL';
export type SharedAction = 'PLAY' | 'HUG';

export interface CareResult {
  snapshot: PetSnapshot;
  petXpGainMilli: number;
  reaction: PetPose | null;
}

export interface RelationshipSnapshot {
  xpMilli: number;
  reachedLevel: number;
  branch: 'UNDECIDED' | 'FRIEND' | 'PLUS';
  affinity: number;
  complicity: number;
  tension: number;
  /** Contributions sur la fenêtre (k) avant l'événement courant. */
  contributions: { mine: number; theirs: number };
  /** Gains déjà attribués aujourd'hui (plafonds), par clé de compteur. */
  todayCounters: Readonly<Record<string, { count: number; xpMilli: number }>>;
  eitherPetSick: boolean;
  paused: boolean;
}

export interface LinkGain {
  xpMilli: number;
  complicityDelta: number;
  tensionDelta: number;
  /** Compteurs journaliers à incrémenter (plafonds appliqués avant multiplicateurs). */
  counters: Readonly<Record<string, { count: number; xpMilli: number }>>;
  /** Contribution humaine valide à enregistrer pour k. */
  contributionWeight: number;
  /** Effets de jauge pour chacun des deux pets. */
  moodDelta: number;
  energyDelta: number;
}

export interface CallInput {
  species: Species;
  vision: Vision;
  desire: number;
  waitingHours: number;
  lastCallRefused: boolean;
  petSick: boolean;
  seed: string;
  counter: number;
}

export interface VisionCandidate {
  petId: string;
  species: Species;
  vision: Vision;
  distanceKm: number | null;
  maxMutualDistanceKm: number;
  rhythm: number | null;
  reputation: number | null;
}

export interface VisionScore {
  score: number;
  breakdown: Record<string, number>;
}

export interface EngineGateway {
  readonly engineVersion: string;
  readonly tuningVersion: string;
  /** Plafonds et durées lus depuis le tuning (aucune constante côté backend). */
  readonly params: EngineParams;
  initialPet(species: Species, now: Date): PetSnapshot;
  advancePet(s: PetSnapshot, to: Date, species: Species, ctx: PetTimeContext): PetSnapshot;
  care(s: PetSnapshot, action: PetCareAction, species: Species, now: Date, ctx: PetTimeContext): CareResult;
  poseFor(s: PetSnapshot, now: Date, ctx: PetTimeContext): PetPose;
  isSick(s: PetSnapshot): boolean;
  /** Gain d'action partagée (jeu/câlin) — `null` = action impossible (précondition moteur). */
  sharedActionGain(action: SharedAction, r: RelationshipSnapshot, relDay: string): LinkGain | null;
  /** Aller-retour de messages humains publiés (réponse de l'autre ≤ fenêtre). */
  messageRoundTripGain(r: RelationshipSnapshot, relDay: string): LinkGain;
  resolveCall(input: CallInput): { refused: boolean };
  levelFor(xpMilli: number, branch: RelationshipSnapshot['branch']): number;
  visionScore(a: VisionCandidate, b: VisionCandidate): VisionScore;
}

export interface EngineParams {
  proposalTtlHours: number;
  matchingRunHour: number;
  batchSize: number;
  messageReplyWindowHours: number;
  reliabilityGhostingAfterHours: number;
  reliabilityGhostingPenalty: number;
  silenceCloseDays: number;
  relationshipInitial: { complicity: number; tension: number; desire: number };
  moveInMinLevel: number;
  inactiveAfterDays: number;
  ghosterLimitMinReliability: number;
  branchVoteDeadlineHours: number;
  consentOfferTtlHours: number;
  lazyCatchUpAfterDays: number;
  sickHealthBelow: number;
}
export const ENGINE_GATEWAY = Symbol('EngineGateway');
