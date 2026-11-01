/**
 * États persistables du moteur (JSON pur, entiers). Les jauges sont stockées en « unités »
 * (points × GAUGE_UNIT, voir shared/units.ts) ; les XP en milli-points.
 */
import type { Branch, LinkLevel, PetKind, PetPose, RelationshipContextType, RelationshipStatus, Species, Stage, VirtualLocationRef, VisionAxes, PhotoPreference } from '@blowy/domain';
import type { DailyCounters, PerSide, Side } from '../shared/index.js';
import type { Interval } from '../time/index.js';

export const GAUGE_KEYS = ['satiety', 'energy', 'mood', 'health'] as const;
export type GaugeKey = (typeof GAUGE_KEYS)[number];
export type GaugeUnits = Record<GaugeKey, number>;

export const PET_DAILY_KEYS = ['moodPenalty', 'feedXp', 'missionReward', 'feedFriendRewards'] as const;
export type PetDailyKey = (typeof PET_DAILY_KEYS)[number];

export interface Reaction {
  pose: PetPose;
  untilMs: number;
}

export interface PetState {
  id: string;
  kind: PetKind;
  species: Species;
  axes: VisionAxes;
  /** Fuseau IANA du propriétaire (nuit personnelle). */
  tz: string;
  stage: Stage;
  gauges: GaugeUnits;
  /** ms admissibles cumulées avec satiété sous le seuil de famine (remis à 0 en la nourrissant). */
  starvedMs: number;
  xpMilli: number;
  location: VirtualLocationRef;
  reaction: Reaction | null;
  /** Séquence d'appels : nombre de refus consécutifs, et compteur d'appels (graine). */
  consecutiveRefusals: number;
  callCount: number;
  /** Relation emménagée : lieu verrouillé sur la maison commune (sauf visite Quartier). */
  movedInRelationshipId: string | null;
  /** Pauses globales du propriétaire (≤ 14 j chacune). */
  pauses: Interval[];
  daily: DailyCounters<PetDailyKey>;
  advancedToMs: number;
}

/** Portes de consentement (vérité dans les tables de consentement du backend, recopiées ici). */
export interface ProgressionGates {
  moveInAccepted: boolean;
  /** Branche effective publiée (le vote secret n'est jamais transmis au moteur). */
  branch: Branch;
  plusRevealAccepted: boolean;
  irlDateConfirmed: boolean;
  eggAccepted: boolean;
  /** Préférences photo des deux côtés et consentement photo de la relation. */
  photoPreference: PerSide<PhotoPreference>;
  photoConsent: PerSide<boolean>;
  photoOriginalConsent: PerSide<boolean>;
  transferToNeighborhoodAccepted: boolean;
}

export const CONTRIBUTION_KINDS = ['message', 'play', 'mission'] as const;
export type ContributionKind = (typeof CONTRIBUTION_KINDS)[number];

export interface SideState {
  /** Envie de ce pet pour l'autre [0,100]. */
  desire: number;
  /** ms admissibles d'attente (ce pet présent au lieu, l'autre absent). */
  waitingMs: number;
  waitingNotified: boolean;
  waitingTensionApplied: boolean;
  /** Contributions comptées par jour local de relation (fenêtre glissante). */
  contributions: Record<string, Record<ContributionKind, number>>;
  /** Dette de réponse : ms admissibles depuis un message humain de l'autre (null si rien n'attend). */
  replyDebtMs: number | null;
  ghostPenalized: boolean;
  /** Dernier jour local où la récupération de fiabilité a été signalée. */
  recoveryDayKey: string | null;
}

export const REL_DAILY_KEYS = ['hugGain', 'hugAction', 'playGain', 'playAction', 'giftGain', 'giftAction', 'messageXp', 'firstRoundTrip'] as const;
export type RelDailyKey = (typeof REL_DAILY_KEYS)[number];

export interface MissionRewardContext {
  key: string;
  relationshipId: string;
  missionId: string;
  dayKey: string;
  kPermille: number;
  mPermille: number;
  tuningVersion: string;
  engineVersion: string;
  validated: PerSide<boolean>;
  /** Crédit effectivement versé par côté (y compris complément). */
  creditedMilli: PerSide<number>;
  /** Côté dont le gain a été gelé (maladie/pause) : aucun complément ne contourne le gel. */
  forfeited: PerSide<boolean>;
  createdAtMs: number;
}

export interface RelationshipState {
  id: string;
  context: RelationshipContextType;
  /** Paire canonique (petIds[0] < petIds[1]). */
  petIds: PerSide<string>;
  tz: string;
  status: RelationshipStatus;
  /** Affinité figée au match (score de vision 0–100). */
  affinity: number;
  xpMilli: number;
  reachedLevel: LinkLevel;
  gates: ProgressionGates;
  complicity: number;
  tension: number;
  spot: VirtualLocationRef;
  sides: PerSide<SideState>;
  idleMs: number;
  inactivityCrossed: boolean;
  absenceStepsApplied: number;
  silenceMs: number;
  silenceClosed: boolean;
  messageTurn: { authorSide: Side; atMs: number } | null;
  daily: DailyCounters<RelDailyKey>;
  missionContexts: Record<string, MissionRewardContext>;
  memories: string[];
  pauses: Interval[];
  advancedToMs: number;
}

export interface NeighborhoodPairState {
  id: string;
  petIds: PerSide<string>;
  friendship: number;
  rewardDayKey: string;
  rewardsToday: number;
}

export interface EggSession {
  night: number;
  openedDayKey: string;
  answers: Array<PerSide<string | null>>;
  heatAwarded: boolean[];
  completedDayKey: string | null;
}

export interface EggState {
  id: string;
  relationshipId: string;
  tz: string;
  status: 'INCUBATING' | 'READY_TO_HATCH' | 'HATCHED';
  heat: number;
  sessions: EggSession[];
  taps: PerSide<number | null>;
  nameVotes: PerSide<string | null>;
  babyName: string | null;
  hatchedAtMs: number | null;
}

/** Tranche de monde chargée sous verrou par le backend pour un événement. */
export interface World {
  pets: Record<string, PetState>;
  relationships: Record<string, RelationshipState>;
  neighborhood: Record<string, NeighborhoodPairState>;
  eggs: Record<string, EggState>;
  recentEventIds: string[];
}
