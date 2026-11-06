/**
 * Sections V5 du tuning (spec-v5, tout chiffre `[T]`). Chaque section a une valeur par défaut
 * (`defaults-v5.ts`) appliquée par `TuningSchema` quand un payload antérieur (V4) ne la contient
 * pas : une version publiée avant la V5 reste lisible.
 */
import { z } from 'zod';
import { ACCESSORY_EQUIP_CAP, PET_MEMORY_KINDS } from '@blowy/domain';

const prob = z.number().min(0).max(1);
const nonNegInt = z.number().int().min(0);
const posInt = z.number().int().min(1);
const hour = z.number().int().min(0).max(23);
const isoWeekday = z.number().int().min(1).max(7);
const permille = z.number().int().min(0).max(1000);
const accessoryId = z.string().regex(/^[a-z0-9_]{1,48}$/);
const memoryKind = z.enum(PET_MEMORY_KINDS);

export const NeighborhoodsTuningSchema = z.object({
  /** Vérifiés en attente requis pour lancer un quartier (surcharge admin possible). */
  defaultDensityThreshold: posInt,
  changeCooldownDays: posInt,
});

export const OutingCycleTuningSchema = z.object({
  requestOpensIsoWeekday: isoWeekday,
  requestOpensHourLocal: hour,
  requestClosesIsoWeekday: isoWeekday,
  requestClosesHourLocal: hour,
  inviteTtlHours: posInt,
  /** Veille de la sortie à cette heure locale : lieu révélé, effectif figé. */
  lockHourLocal: hour,
  /** photoRevealAt = min(jour J à cette heure, startsAt − photoRevealMinBeforeStartHours). */
  photoRevealHourLocal: hour,
  photoRevealMinBeforeStartHours: posInt,
  /** V5.1 (E.16) : visages révélés au verrouillage (veille 18 h), en même temps que le lieu. */
  photoRevealAtLock: z.boolean(),
  checkinOpensBeforeMinutes: posInt,
  checkinClosesAfterMinutes: posInt,
  inviteReminderBeforeHours: posInt,
  lastCallBeforeHours: posInt,
});

/**
 * V5.2 (B.5–B.6) : garantie « pour toi ». Pour toute personne dont l'intention inclut « une histoire »,
 * le groupe contient au moins `minCompatible` personnes compatibles (genres recherchés réciproques,
 * tranches d'âge fixes compatibles, intention histoire ; hors sa propre team), sinon la proposition
 * est marquée « potes uniquement » pour elle. Le marquage est TOUJOURS calculé (honnêteté) ;
 * `enabled` active l'optimisation de la composition (terme `lambdaGuarantee` de J).
 */
export const StoryGuaranteeTuningSchema = z.object({
  enabled: z.boolean(),
  minCompatible: z.number().int().min(1).max(5),
  /** Poids (milli-points) de la part ‰ des chercheurs d'histoire garantis dans J(G). */
  lambdaGuarantee: nonNegInt,
});
export const STORY_GUARANTEE_DEFAULTS: z.output<typeof StoryGuaranteeTuningSchema> = Object.freeze({ enabled: true, minCompatible: 2, lambdaGuarantee: 16000 });

export const CompositionTuningSchema = z.object({
  algoVersion: z.string().regex(/^groups-\d{4}\.\d{2}\.\d+$/),
  targetSize: posInt,
  /** Score de paire minimal (0–100) pour toute paire d'un groupe. */
  minPairScore: z.number().int().min(0).max(100),
  /** Poids du score de vision en groupe : G (géographie) neutralisé = 0. */
  visionWeights: z.object({ C: prob, P: prob, D: prob, E: prob, R: prob, G: z.literal(0), S: prob, M: prob }),
  lambdaRomance: nonNegInt,
  lambdaFriend: nonNegInt,
  lambdaGender: nonNegInt,
  lambdaSize: nonNegInt,
  maxGenderSharePermille: permille,
  repairToleranceMilli: nonNegInt,
  maxSwapIterations: nonNegInt,
  /** V5.1 (B.7) : une team (1–3 personnes) est une unité indivisible. */
  maxTeamSize: z.number().int().min(1).max(3),
  /** V5.2 (B.5) ; absent d'un payload antérieur → défauts. */
  storyGuarantee: StoryGuaranteeTuningSchema.default(STORY_GUARANTEE_DEFAULTS),
});

/** Sortie d'amorçage (V5.1 B.7) : dans une ville fermée, une team de `triggerTeamSize` vérifiés + une autre team. */
export const SeedingTuningSchema = z.object({
  triggerTeamSize: z.number().int().min(2).max(3),
  minPartnerTeamSize: z.number().int().min(1).max(3),
  maxSize: z.number().int().min(4).max(6),
});

export const OutingChatTuningSchema = z.object({
  messagesPerMinute: posInt,
  threeWordsMaxTokens: posInt,
  threeWordsMaxChars: posInt,
  readOnlyDaysAfterClose: posInt,
  purgeDaysAfterClose: posInt,
});

export const OutingsTuningSchema = z.object({
  minSizeToForm: posInt,
  minSizeToLock: posInt,
  /** Après verrouillage, la sortie tient à ce nombre (D-012). */
  minSizeToHold: posInt,
  /** Capacité d'une sortie (CHECK 4–6 en base). */
  maxSize: z.number().int().min(4).max(6),
  durationMinutes: posInt,
  /** Une sortie CONFIRMED tombée sous `minSizeToHold` est annulée si c'est avant `startsAt − cancelUndersizedBeforeStartHours`. */
  cancelUndersizedBeforeStartHours: posInt,
  /** @deprecated V5.1 : l'annulation se juge au verrouillage (avant = recrédit, après = absence). */
  lateCancelHours: posInt,
  paymentHoldMinutes: posInt,
  backfillInviteTtlHours: posInt,
  disputeWindowDays: posInt,
  cycle: OutingCycleTuningSchema,
  composition: CompositionTuningSchema,
  seeding: SeedingTuningSchema,
  chat: OutingChatTuningSchema,
});

export const VotesTuningSchema = z.object({
  windowHours: posInt,
  /** V5.1 (A.4) : chacun ne voit ses accords qu'à la clôture (date fixe) ; `HOURLY` = paliers horaires de la spec V5. */
  revealMode: z.enum(['AT_CLOSE', 'HOURLY']),
  revealCadenceMinutes: posInt,
  ballotRetentionDays: posInt,
  staffCorrectionGraceHours: posInt,
  reminderBeforeCloseHours: posInt,
  /** Votes ouverts seulement si au moins ce nombre de présents. */
  minAttendees: z.number().int().min(2),
});

export const DuoTuningSchema = z.object({
  maxActive: posInt,
  exchangeHours: posInt,
  dateDeadlineDays: posInt,
  minMessagesEachToUnlock: posInt,
  /** Un RDV doit commencer au plus tard `dateDeadline + dateMaxAfterDeadlineDays`. */
  dateMaxAfterDeadlineDays: nonNegInt,
  afterVoteHours: posInt,
  exchangeEndingNoticeHours: posInt,
  deadlineSoonHours: posInt,
  proposalTtlHours: posInt,
  dailyRunHour: hour,
  /** Une proposition DUO_LANE refusée/expirée exclut la paire pendant ce délai (MET_BEFORE). */
  declinedCooldownDays: posInt,
});

export const ReliabilityV5TuningSchema = z.object({
  noShowWindowDays: posInt,
  noShowsToPause: posInt,
  pauseDays: posInt,
});

export const MemoriesTuningSchema = z.object({
  xpByKind: z.record(memoryKind, nonNegInt),
  /** Paliers de présences cumulées → souvenir PROMISE_KEPT. */
  promiseMilestones: z.array(posInt).min(1),
  /** Seuils de stade du pet V5 (XP en points, alimentée par les souvenirs). */
  stageThresholds: z.object({ YOUNG: posInt, ADULT: posInt }),
  accessoryUnlocks: z.array(z.object({ atMemoryCount: posInt, accessoryId })),
  kindUnlocks: z.array(z.object({ memoryKind, nth: posInt, accessoryId })),
});

export const AccessoriesTuningSchema = z.object({
  maxEquipped: z.number().int().min(0).max(ACCESSORY_EQUIP_CAP),
  reactionTtlMs: posInt,
  /** Accessoires accordés par une source externe (D-031, Blowy+ mensuel). */
  referralAccessoryId: accessoryId,
  plusMonthlyAccessoryIds: z.array(accessoryId).min(1),
});

export const PricingTuningSchema = z.object({
  /** V5.1 (H.23) : 4,99 € la place, consommation non incluse ; le serveur fixe le montant. */
  seat: z.object({ amountCents: posInt, currency: z.literal('EUR') }),
  /** 1ʳᵉ sortie offerte. */
  firstOutingFree: z.boolean(),
});

export const PlusTuningSchema = z.object({
  /** V5.1 (H.23) : 9,99 €/mois (prix de référence ; le prix affiché vient du fournisseur). */
  monthlyPriceCents: posInt,
  /** Toutes les sorties incluses (dans la limite du quota hebdomadaire, identique pour tous). */
  includesAllOutings: z.boolean(),
  /** Utilisé seulement si `includesAllOutings = false`. */
  includedOutingsPerMonth: nonNegInt,
  /** Duo illimité (sinon `duo.maxActive`). */
  duoUnlimited: z.boolean(),
  /** `false` si la revue iOS exige l'IAP pour la part numérique (accessoire). */
  includesMonthlyAccessory: z.boolean(),
});

export const CreditsTuningSchema = z.object({ refundCreditValidityDays: posInt });

export const SafetyTuningSchema = z.object({
  checkinRadiusMeters: posInt,
  checkinMaxAccuracyMeters: posInt,
  venueCodeMaxAttempts: posInt,
  guardianActiveBeforeHours: posInt,
  guardianLinkGraceHours: posInt,
  maxGuardianLinksPerSubject: posInt,
  guardianPushRetentionHours: posInt,
  alertPositionRetentionHours: posInt,
  alertsPerHour: posInt,
  removalAbuseThreshold: posInt,
  removalAbuseWindowDays: posInt,
});

export const NOTIFICATION_PRIORITY_V5 = ['SAFETY', 'OUTING_TRANSACTIONAL', 'HUMAN_MESSAGE', 'CONNECTION', 'VOTE', 'DUO', 'OUTING_MARKETING', 'SYSTEM'] as const;
export type NotificationPriorityClassV5 = (typeof NOTIFICATION_PRIORITY_V5)[number];

export const NotificationsV5TuningSchema = z.object({
  maxPerDay: posInt,
  outingDayMax: posInt,
  quietStartHour: hour,
  quietEndHour: hour,
  /** Un rappel tombant en heures calmes est avancé à cette minute locale (22 h 30 = 1350) ou reporté à la fin. */
  quietAdvanceToMinuteOfDay: z.number().int().min(0).max(1439),
  priority: z.array(z.enum(NOTIFICATION_PRIORITY_V5)).length(NOTIFICATION_PRIORITY_V5.length),
  /** Transactionnels de la sortie du jour, hors plafond `maxPerDay`. */
  transactionalKeys: z.array(z.string().regex(/^[a-z_]+\.[a-z_]+$/)),
  /** V5.1 (D.15) : au plus N notifications de proposition de sortie par semaine. */
  maxOutingProposalsPerWeek: posInt,
});

/** Préférences de sortie V5.1 (B.8, C.10, D.13). */
export const PreferencesTuningSchema = z.object({
  /** Tranche d'âge souhaitée par défaut : âge ± delta. */
  groupAgeDefaultDelta: posInt,
  maxNeighborhoods: posInt,
  maxWeeksOffAhead: posInt,
});
