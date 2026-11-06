/**
 * Tuning initial versionné. Les valeurs reprises du brief (§6, §7, §8, §16, §17) sont des
 * paramètres produit de départ ; celles absentes du brief sont marquées « HYPOTHÈSE ».
 * Une nouvelle publication = nouvelle `version`, jamais une mutation de celle-ci (replay).
 */
import type { Tuning } from './schema.js';
import { deepFreeze } from './freeze.js';
import {
  ACCESSORIES_V5,
  CREDITS_V5,
  DUO_V5,
  EGG_V5_ADDITIONS,
  MATCHING_V5_ADDITIONS,
  MEMORIES_V5,
  NEIGHBORHOODS_V5,
  NOTIFICATIONS_V5,
  OUTINGS_V5,
  PLUS_V5,
  PREFERENCES_V5,
  PRICING_V5,
  RELIABILITY_V5,
  SAFETY_V5,
  VOTES_V5,
} from './defaults-v5.js';

/** V5 : `tuning-2026.12.0` (sections sorties, composition, duo, votes, souvenirs, paiements, sécurité). */
/** V5.2 : `tuning-2026.12.1` (visages révélés startsAt − 3 h, concept-v5.2 C.8). */
/** V5.2 : `tuning-2026.12.2` (garantie « pour toi » : composition.storyGuarantee, algo groups-2026.12.1). */
export const DEFAULT_TUNING_VERSION = 'tuning-2026.12.2';

export const DEFAULT_TUNING: Readonly<Tuning> = deepFreeze({
  version: DEFAULT_TUNING_VERSION,
  time: {
    tickMinutes: 15,
    lazyCatchUpAfterDays: 7,
    /** Nuit personnelle 23 h – 8 h (heure locale IANA). */
    night: { startHour: 23, endHour: 8 },
    /** Rattrapage : notifications plus anciennes que cette fenêtre avant `to` abandonnées. HYPOTHÈSE */
    catchUpCoalesceAfterMinutes: 60,
    /** Identifiants d'événements récents conservés pour l'idempotence du moteur (la clé unique DB reste l'autorité). HYPOTHÈSE */
    dedupeEventIds: 256,
  },
  gauges: {
    initial: { satiety: 100, energy: 100, mood: 80, health: 100 },
    decayPerHour: {
      satiety: 4,
      energy: 3,
      mood: 2,
      /** Santé : seulement après le seuil de famine. */
      health: 2,
    },
    speciesSatietyDecayPerHour: { GASTON: 5, PIA: 4, NINO: 4, SUZIE: 4 },
    nightDecayDivisor: 4,
    /** Récupération nocturne nette (remplace la baisse diurne, pas en plus d'une baisse réduite). */
    nightEnergyRecoveryPerHour: 6,
    starvation: { satietyBelow: 15, graceHours: 12 },
    healthFloor: 1,
  },
  poses: {
    sickHealthBelow: 30,
    asleepEnergyBelow: 15,
    hungrySatietyBelow: 25,
    sadMoodBelow: 30,
    joyfulMoodAbove: 75,
    /** Durée d'une réaction événementielle. HYPOTHÈSE (« quelques secondes ») */
    reactionTtlMs: 4000,
  },
  care: {
    /** Nourrir (gratuit). HYPOTHÈSE */
    feed: { satiety: 30, petXp: 5, petXpGainsPerDay: 3 },
    /** Soin gratuit suffisant pour sortir de maladie depuis la borne 1 (1 + 40 > 30). Aucun XP (gel). HYPOTHÈSE */
    heal: { health: 40, petXp: 0 },
  },
  refusal: {
    base: 0.1,
    mischiefWeight: 0.15,
    desireWeight: 0.35,
    waitingWeight: -0.25,
    waitingHoursCap: 100,
    min: 0,
    max: 0.6,
    speciesBonus: { NINO: 0.1, SUZIE: 0.05, PIA: 0, GASTON: -0.05 },
    maxConsecutiveRefusals: 1,
    /** « refus répétés » font monter la tension. HYPOTHÈSE */
    tensionOnRefusal: 2,
  },
  relationshipInitial: { complicity: 20, tension: 0, desire: 40 },
  actions: {
    /** actionCapPerDay : animation encore possible sans gain (UI honnête). HYPOTHÈSE pour actionCap. */
    hug: { minLevel: 2, minComplicity: 20, linkXp: 4, complicity: 6, tension: -10, mood: 10, gainCapPerDay: 3, actionCapPerDay: 10 },
    play: { linkXp: 2, mood: 8, energy: -5, gainCapPerDay: 5, actionCapPerDay: 15 },
    messages: { roundTripXp: 2, firstRoundTripBonusXp: 10, dailyXpCap: 20, replyWindowHours: 24 },
    /** petXp mission : HYPOTHÈSE */
    mission: { linkXp: 6, gaugeBoost: 20, perPersonPerDay: 1, jointMultiplier: 2, petXp: 20, jointTension: -5, contextRetentionDays: 3 },
    /** tension cadeau −5 : HYPOTHÈSE (« redescend avec un cadeau ») */
    gift: { minLevel: 2, complicity: 10, tension: -5, gainCapPerDay: 2, actionCapPerDay: 2 },
    visit: { linkXp: 3, minWaitingHours: 6 },
    /** satiety donnée au pet ami : HYPOTHÈSE */
    feedFriend: { friendship: 5, friendshipMax: 100000, satiety: 15, rewardedPerDonorPerDay: 3, rewardedPerPairPerDay: 1 },
    absence: { graceHours: 24, complicityPerDay: -5, tensionPerDay: 5 },
    /** Souvenirs conservés par relation (les plus récents). HYPOTHÈSE */
    memoriesMax: 20,
    /** −10 humeur au franchissement des 48 h (une fois par épisode) ; plafond quotidien global par pet : HYPOTHÈSE 20 */
    inactivity: { thresholdHours: 48, moodPenalty: 10, dailyMoodPenaltyCap: 20 },
    /** Envie : +2 par action partagée, max 100. HYPOTHÈSE */
    desire: { perSharedAction: 2, max: 100 },
    /** Notification « X attend Y » après 2 h ; tension +5 une fois si attente > 48 h. HYPOTHÈSE (valeur tension) */
    waiting: { notifyAfterHours: 2, tensionAfterHours: 48, tensionIncrease: 5 },
  },
  link: {
    levelThresholds: [0, 150, 500, 900, 1400, 2000, 3000],
    contributionWindowDays: 7,
    contributionWeights: { message: 1, play: 1, mission: 3 },
    /** Plafonds journaliers de contributions comptées par côté (anti-spam). HYPOTHÈSE */
    dailyContributionCaps: { message: 20, play: 8, mission: 3 },
    balancePenaltyPermille: 500,
    /** m = 0.8 + 0.4 · affinité/100 */
    affinityMultiplier: { basePermille: 800, spanPermille: 400 },
    friendMaxLevel: 6,
    /** Sans branche (avant vote au N3), le niveau atteint plafonne à 3. */
    undecidedMaxLevel: 3,
  },
  petXp: {
    /** Croissance de stade (XP pet en points). HYPOTHÈSE */
    stageThresholds: { YOUNG: 300, ADULT: 1500 },
    /** Bonus Blowy+ week-end : XP pet uniquement. */
    weekendPremiumMultiplier: 2,
    /** Part d'XP de soin reversée à un pet enfant. HYPOTHÈSE */
    childCareShare: 1,
  },
  coins: {
    missionDaily: 20,
    streakMilestone: { days: 7, coins: 100 },
    referral: { referrer: 100, referee: 100 },
    neighborhoodFeed: 10,
    /** giftBasic : prix d'un cadeau simple. HYPOTHÈSE */
    catalog: { streakFreeze: 200, visibilityBoost: 300, giftBasic: 60 },
    plusMonthly: { coins: 200, streakFreezes: 2 },
  },
  reliability: {
    initial: 100,
    max: 100,
    ghostingAfterHours: 72,
    ghostingPenalty: 8,
    dailyRecovery: 1,
    recoveryReplyWithinHours: 24,
    silenceCloseDays: 14,
    v5: RELIABILITY_V5,
  },
  pause: { maxDays: 14 },
  egg: {
    sessionHour: 21,
    proposedWindowEndHour: 23,
    nights: 3,
    questionsPerNight: 4,
    heatSame: 15,
    heatDifferent: 8,
    heatCap: 180,
    /** Une séance courante + une de rattrapage. */
    maxOpenNights: 2,
    maxValidationsPerRelationDay: 2,
    hatchTapWindowSeconds: 60,
    /** Décalage maximal d'un axe hérité par les réponses. HYPOTHÈSE */
    heredityMaxDeltaPerAxis: 0.3,
    nameMaxLength: 24,
    nameSeparator: '-',
    minDuoDates: EGG_V5_ADDITIONS.minDuoDates,
  },
  group: { min: 3, max: 5, missionMinParticipants: 3 },
  notifications: {
    maxPerDay: 3,
    quietStartHour: 23,
    quietEndHour: 8,
    priority: ['HUMAN_MESSAGE', 'REAL_WAITING', 'STREAK', 'NEIGHBORHOOD', 'MISSION'],
    v5: NOTIFICATIONS_V5,
  },
  matching: {
    weights: { C: 0.3, P: 0.25, D: 0.1, E: 0.05, R: 0.1, G: 0.1, S: 0.05, M: 0.05 },
    dailyRunHour: 21,
    proposalTtlHours: 48,
    /** discoveryMinScore : score minimal d'une « découverte compatible ». HYPOTHÈSE */
    batch: { size: 3, strong: 2, discovery: 1, discoveryMinScore: 40 },
    /** Quota de propositions en cours (entrantes + sortantes). HYPOTHÈSE */
    maxPendingProposals: 6,
    minAge: 18,
    inactiveAfterDays: 7,
    ghosterLimitMinReliability: 70,
    ...MATCHING_V5_ADDITIONS,
    geography: { fullScoreKm: 1 },
    /** R : nombre minimal d'événements d'activité par personne, sinon 0.5. HYPOTHÈSE */
    rhythm: { minEvents: 20, neutral: 0.5 },
    /** M : mots positifs reçus ; neutre 0.5 sous 3 mots, saturation à 30. HYPOTHÈSE */
    reputation: { neutral: 0.5, minWords: 3, saturationWords: 30 },
    /** Équité d'exposition : ajustement de priorité (pas du % affiché). HYPOTHÈSE */
    exposure: { windowDays: 7, targetImpressions: 6, maxAdjustment: 10, boostAdjustment: 8 },
    matrices: {
      version: 'matrices-2026.11.0',
      /** Dimanches : brunch~musée et rando~canapé opposés ; compatibilités partielles 0.5 / 0.25. HYPOTHÈSE */
      sunday: {
        BRUNCH: { BRUNCH: 1, MUSEE: 0.5, RANDO: 0.25, CANAPE: 0.5 },
        MUSEE: { BRUNCH: 0.5, MUSEE: 1, RANDO: 0.25, CANAPE: 0.25 },
        RANDO: { BRUNCH: 0.25, MUSEE: 0.25, RANDO: 1, CANAPE: 0 },
        CANAPE: { BRUNCH: 0.5, MUSEE: 0.25, RANDO: 0, CANAPE: 1 },
      },
      /** Écoles : petite table d'affinités. HYPOTHÈSE */
      school: {
        BEAUX_ARTS: { BEAUX_ARTS: 1, POLYTECHNIQUE: 0.4, CIRQUE: 0.7, AUTODIDACTE: 0.6 },
        POLYTECHNIQUE: { BEAUX_ARTS: 0.4, POLYTECHNIQUE: 1, CIRQUE: 0.3, AUTODIDACTE: 0.6 },
        CIRQUE: { BEAUX_ARTS: 0.7, POLYTECHNIQUE: 0.3, CIRQUE: 1, AUTODIDACTE: 0.7 },
        AUTODIDACTE: { BEAUX_ARTS: 0.6, POLYTECHNIQUE: 0.6, CIRQUE: 0.7, AUTODIDACTE: 1 },
      },
      /** Chimie des espèces, ludique. HYPOTHÈSE */
      species: {
        GASTON: { GASTON: 0.7, PIA: 0.8, NINO: 0.9, SUZIE: 0.8 },
        PIA: { GASTON: 0.8, PIA: 0.6, NINO: 0.7, SUZIE: 0.9 },
        NINO: { GASTON: 0.9, PIA: 0.7, NINO: 0.6, SUZIE: 1 },
        SUZIE: { GASTON: 0.8, PIA: 0.9, NINO: 1, SUZIE: 0.6 },
      },
    },
  },
  /** Carte : cellule de généralisation minimale (jamais de point exact). */
  map: { cellMinMeters: 500 },
  // ---- V5 (spec-v5) — valeurs dans defaults-v5.ts
  neighborhoods: NEIGHBORHOODS_V5,
  outings: OUTINGS_V5,
  votes: VOTES_V5,
  duo: DUO_V5,
  memories: MEMORIES_V5,
  accessories: ACCESSORIES_V5,
  pricing: PRICING_V5,
  plus: PLUS_V5,
  credits: CREDITS_V5,
  safety: SAFETY_V5,
  preferences: PREFERENCES_V5,
});
