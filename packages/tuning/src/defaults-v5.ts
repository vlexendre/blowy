/**
 * Valeurs initiales V5 (spec-v5 ; « HYPOTHÈSE » = valeur absente de la spec ou à recalibrer, P-5.20).
 * Une nouvelle publication = nouvelle `version` ; jamais de mutation (rejeu).
 */
import type { z } from 'zod';
import type {
  AccessoriesTuningSchema,
  CreditsTuningSchema,
  DuoTuningSchema,
  MemoriesTuningSchema,
  NeighborhoodsTuningSchema,
  NotificationsV5TuningSchema,
  OutingsTuningSchema,
  PlusTuningSchema,
  PreferencesTuningSchema,
  PricingTuningSchema,
  ReliabilityV5TuningSchema,
  SafetyTuningSchema,
  VenuesTuningSchema,
  VotesTuningSchema,
} from './schema-v5.js';
import { deepFreeze } from './freeze.js';

type Out<S extends z.ZodType> = z.output<S>;
/** Gelé : ces objets servent aussi de valeurs par défaut Zod (partagées par référence). */
const frozen = <T>(v: T): T => deepFreeze(v);

export const NEIGHBORHOODS_V5: Out<typeof NeighborhoodsTuningSchema> = frozen({ defaultDensityThreshold: 120, changeCooldownDays: 7 });

export const OUTINGS_V5: Out<typeof OutingsTuningSchema> = frozen({
  minSizeToForm: 4,
  minSizeToLock: 4,
  minSizeToHold: 3,
  maxSize: 6,
  durationMinutes: 120,
  cancelUndersizedBeforeStartHours: 3,
  lateCancelHours: 24,
  paymentHoldMinutes: 15,
  backfillInviteTtlHours: 12,
  disputeWindowDays: 7,
  cycle: {
    /** Demande lundi 9 h → mardi 12 h (heure du quartier), D-012. */
    requestOpensIsoWeekday: 1,
    requestOpensHourLocal: 9,
    requestClosesIsoWeekday: 2,
    requestClosesHourLocal: 12,
    inviteTtlHours: 24,
    lockHourLocal: 18,
    /**
     * V5.2 (C.8) : lieu à la veille 18 h, VISAGES 3 h avant le début. Avec l'heure murale à 23 h,
     * min(jour J 23 h, startsAt − 3 h) = startsAt − 3 h pour toute sortie (paramètres seuls, moteur inchangé).
     */
    photoRevealHourLocal: 23,
    photoRevealMinBeforeStartHours: 3,
    photoRevealAtLock: false,
    checkinOpensBeforeMinutes: 30,
    checkinClosesAfterMinutes: 90,
    inviteReminderBeforeHours: 4,
    lastCallBeforeHours: 3,
  },
  composition: {
    algoVersion: 'groups-2026.12.2',
    /** V5.1 : groupe de 5 (dont toi). */
    targetSize: 5,
    minPairScore: 35,
    /** Poids V4 sans G, renormalisés (somme 1). */
    visionWeights: { C: 0.33, P: 0.28, D: 0.11, E: 0.06, R: 0.11, G: 0, S: 0.05, M: 0.06 },
    lambdaRomance: 8000,
    lambdaFriend: 3000,
    lambdaGender: 10000,
    lambdaSize: 1500,
    maxGenderSharePermille: 670,
    maxSameGender: 3,
    repairToleranceMilli: 2000,
    maxSwapIterations: 200,
    maxTeamSize: 3,
    /** V5.2 (B.5–B.6) : ≥ 2 personnes compatibles « histoire » dans le groupe, sinon « potes uniquement ». */
    storyGuarantee: { enabled: true, minCompatible: 2, lambdaGuarantee: 16000 },
  },
  /** V5.1 (B.7) : team de 3 vérifiés + une autre team (≥ 2) ; jusqu'à 6 (3 + 3). */
  seeding: { triggerTeamSize: 3, minPartnerTeamSize: 2, maxSize: 6 },
  /** readOnly 7 j, purge 90 j (§8.5) ; 20 msg/min (§2.7). */
  chat: { messagesPerMinute: 20, threeWordsMaxTokens: 3, threeWordsMaxChars: 40, readOnlyDaysAfterClose: 7, purgeDaysAfterClose: 90 },
});

export const VOTES_V5: Out<typeof VotesTuningSchema> = frozen({
  windowHours: 72,
  revealMode: 'AT_CLOSE',
  revealCadenceMinutes: 60,
  ballotRetentionDays: 7,
  staffCorrectionGraceHours: 24,
  reminderBeforeCloseHours: 12,
  minAttendees: 2,
});

export const DUO_V5: Out<typeof DuoTuningSchema> = frozen({
  maxActive: 3,
  maxActiveFree: 1,
  maxOpenProposals: 3,
  exchangeHours: 48,
  dateDeadlineDays: 7,
  minMessagesEachToUnlock: 2,
  dateMaxAfterDeadlineDays: 7,
  afterVoteHours: 72,
  exchangeEndingNoticeHours: 12,
  deadlineSoonHours: 24,
  proposalTtlHours: 48,
  dailyRunHour: 21,
  declinedCooldownDays: 90,
});

export const RELIABILITY_V5: Out<typeof ReliabilityV5TuningSchema> = frozen({ noShowWindowDays: 90, noShowsToPause: 2, pauseDays: 7 });

export const MEMORIES_V5: Out<typeof MemoriesTuningSchema> = frozen({
  xpByKind: { HATCHED: 0, OUTING_LIVED: 40, DUO_DATE_LIVED: 30, BAND_NEW_MEMBER: 20, PROMISE_KEPT: 25, EGG: 0 },
  promiseMilestones: [1, 3, 5, 10, 20],
  /**
   * HYPOTHÈSE recalibrée (spec §5.2 : « jeune » après 2 sorties, « adulte » après ~10) :
   * 2 sorties + 1er palier = 105 ≥ 100 ; 10 sorties + 4 paliers + ~5 liens = 600.
   */
  stageThresholds: { YOUNG: 100, ADULT: 600 },
  /** HYPOTHÈSE : accessoires débloqués au fil des souvenirs (clés `@blowy/content` ACCESSORIES). */
  accessoryUnlocks: [
    { atMemoryCount: 2, accessoryId: 'scarf_red' },
    { atMemoryCount: 5, accessoryId: 'cap_blue' },
    { atMemoryCount: 10, accessoryId: 'glasses_round' },
    { atMemoryCount: 20, accessoryId: 'crown_paper' },
  ],
  kindUnlocks: [
    { memoryKind: 'OUTING_LIVED', nth: 1, accessoryId: 'badge_first_outing' },
    { memoryKind: 'BAND_NEW_MEMBER', nth: 1, accessoryId: 'bracelet_friendship' },
    { memoryKind: 'DUO_DATE_LIVED', nth: 1, accessoryId: 'flower_lapel' },
    { memoryKind: 'PROMISE_KEPT', nth: 3, accessoryId: 'medal_promise' },
  ],
});

export const ACCESSORIES_V5: Out<typeof AccessoriesTuningSchema> = frozen({
  maxEquipped: 3,
  /** Réaction cosmétique (check-in, révélation, brise-glace). HYPOTHÈSE */
  reactionTtlMs: 4000,
  referralAccessoryId: 'kite_referral',
  plusMonthlyAccessoryIds: ['hat_beret', 'bow_tie', 'backpack_mini', 'umbrella_yellow', 'headphones', 'bandana_green'],
});

/** V5.1 (H.23) : 4,99 € la place (conso non incluse), 1ʳᵉ sortie offerte. */
export const PRICING_V5: Out<typeof PricingTuningSchema> = frozen({ seat: { amountCents: 499, currency: 'EUR' }, firstOutingFree: true });
/** V5.1 (H.23) : Blowy+ 9,99 €/mois, toutes les sorties incluses + Duo illimité ; aucun accessoire vendu (accessoires uniquement gagnés). */
export const PLUS_V5: Out<typeof PlusTuningSchema> = frozen({ monthlyPriceCents: 999, includesAllOutings: true, includedOutingsPerMonth: 0, duoUnlimited: true, includesMonthlyAccessory: false });
export const CREDITS_V5: Out<typeof CreditsTuningSchema> = frozen({ refundCreditValidityDays: 90 });

export const SAFETY_V5: Out<typeof SafetyTuningSchema> = frozen({
  checkinRadiusMeters: 150,
  checkinMaxAccuracyMeters: 200,
  venueCodeMaxAttempts: 5,
  guardianActiveBeforeHours: 2,
  guardianLinkGraceHours: 3,
  maxGuardianLinksPerSubject: 3,
  guardianPushRetentionHours: 24,
  alertPositionRetentionHours: 72,
  alertsPerHour: 10,
  removalAbuseThreshold: 3,
  removalAbuseWindowDays: 30,
  uncomfortableLeaveWindowDays: 90,
  uneasyLeaveRecontactThreshold: 3,
  humanResponseMinutes: 60,
});

/** V5.3 C.11 / D-045 : 3 € versés par Blowy pour une place offerte/incluse non honorée (place payée : son prix). */
export const VENUES_V5: Out<typeof VenuesTuningSchema> = frozen({ compensationUnpaidSeatCents: 300 });

export const NOTIFICATIONS_V5: Out<typeof NotificationsV5TuningSchema> = frozen({
  maxPerDay: 3,
  outingDayMax: 4,
  quietStartHour: 23,
  quietEndHour: 8,
  quietAdvanceToMinuteOfDay: 22 * 60 + 30,
  priority: ['SAFETY', 'OUTING_TRANSACTIONAL', 'HUMAN_MESSAGE', 'CONNECTION', 'VOTE', 'DUO', 'OUTING_MARKETING', 'SYSTEM'],
  transactionalKeys: ['outing.checkin_open', 'outing.cancelled', 'outing.refund_done', 'duo.checkin_open'],
  maxOutingProposalsPerWeek: 1,
});

export const PREFERENCES_V5: Out<typeof PreferencesTuningSchema> = frozen({ groupAgeDefaultDelta: 4, maxNeighborhoods: 5, maxWeeksOffAhead: 12 });

/** Ajouts V5 à des sections existantes. */
export const MATCHING_V5_ADDITIONS = { ghosterLimitMinAttendancePermille: 700, ghosterLimitMinTotal: 3 } as const;
export const EGG_V5_ADDITIONS = { minDuoDates: 2 } as const;
