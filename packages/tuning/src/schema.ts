/**
 * Schéma Zod du tuning Blowy. Toute règle chiffrée du moteur, du matching et de l'économie
 * est lue d'ici : aucun nombre magique dans les packages consommateurs.
 * Unités : points entiers sauf mention ; durées suffixées (Hours, Ms, Days, Seconds).
 */
import { z } from 'zod';
import { SCHOOLS, SPECIES, SUNDAYS } from '@blowy/domain';

const prob = z.number().min(0).max(1);
const gauge = z.number().int().min(0).max(100);
const nonNegInt = z.number().int().min(0);
const posInt = z.number().int().min(1);
const hour = z.number().int().min(0).max(23);
const signedPoints = z.number().int().min(-100).max(100);

/** Matrice symétrique complète K×K à valeurs dans [0,1]. */
function symmetricMatrix<const K extends readonly [string, ...string[]]>(keys: K, unitDiagonal: boolean) {
  const row = z.record(z.enum(keys), prob);
  return z.record(z.enum(keys), row).superRefine((m, ctx) => {
    const mm = m as Record<string, Record<string, number>>;
    for (const a of keys) {
      for (const b of keys) {
        const ab = mm[a]?.[b];
        const ba = mm[b]?.[a];
        if (ab !== ba) ctx.addIssue({ code: 'custom', message: `matrice non symétrique ${a}/${b}` });
      }
      if (unitDiagonal && mm[a]?.[a] !== 1) ctx.addIssue({ code: 'custom', message: `diagonale ≠ 1 pour ${a}` });
    }
  });
}

const speciesRecord = <T extends z.ZodType>(v: T) => z.record(z.enum(SPECIES), v);

/** Plafonds d'une action : possible (anti-spam) vs rémunérée (gain). */
const caps = z.object({ gainCapPerDay: posInt, actionCapPerDay: posInt }).refine((c) => c.actionCapPerDay >= c.gainCapPerDay, {
  message: 'le plafond d’action doit être ≥ au plafond de gain',
});

export const GaugesSchema = z.object({
  initial: z.object({ satiety: gauge, energy: gauge, mood: gauge, health: gauge }),
  decayPerHour: z.object({ satiety: nonNegInt, energy: nonNegInt, mood: nonNegInt, health: nonNegInt }),
  speciesSatietyDecayPerHour: speciesRecord(nonNegInt),
  /** Doit diviser 12 : le moteur intègre les jauges en entiers exacts (unités = points × 12 h⁻¹ × ms). */
  nightDecayDivisor: posInt.refine((d) => 12 % d === 0, { message: 'nightDecayDivisor doit diviser 12' }),
  nightEnergyRecoveryPerHour: nonNegInt,
  starvation: z.object({ satietyBelow: gauge, graceHours: z.number().min(0) }),
  healthFloor: gauge,
});

export const TuningSchema = z
  .object({
    version: z.string().regex(/^tuning-\d{4}\.\d{2}\.\d+$/),
    time: z.object({
      tickMinutes: posInt,
      lazyCatchUpAfterDays: posInt,
      night: z.object({ startHour: hour, endHour: hour }),
      catchUpCoalesceAfterMinutes: posInt,
      dedupeEventIds: posInt,
    }),
    gauges: GaugesSchema,
    poses: z.object({
      sickHealthBelow: gauge,
      asleepEnergyBelow: gauge,
      hungrySatietyBelow: gauge,
      sadMoodBelow: gauge,
      joyfulMoodAbove: gauge,
      reactionTtlMs: posInt,
    }),
    care: z.object({
      feed: z.object({ satiety: gauge, petXp: nonNegInt, petXpGainsPerDay: nonNegInt }),
      heal: z.object({ health: gauge, petXp: nonNegInt }),
    }),
    refusal: z.object({
      base: prob,
      mischiefWeight: z.number(),
      desireWeight: z.number(),
      waitingWeight: z.number(),
      waitingHoursCap: posInt,
      min: prob,
      max: prob,
      speciesBonus: speciesRecord(z.number().min(-1).max(1)),
      maxConsecutiveRefusals: nonNegInt,
      tensionOnRefusal: gauge,
    }),
    relationshipInitial: z.object({ complicity: gauge, tension: gauge, desire: gauge }),
    actions: z.object({
      hug: caps.and(z.object({ minLevel: posInt, minComplicity: gauge, linkXp: nonNegInt, complicity: signedPoints, tension: signedPoints, mood: signedPoints })),
      play: caps.and(z.object({ linkXp: nonNegInt, mood: signedPoints, energy: signedPoints })),
      messages: z.object({ roundTripXp: nonNegInt, firstRoundTripBonusXp: nonNegInt, dailyXpCap: nonNegInt, replyWindowHours: posInt }),
      mission: z.object({ linkXp: nonNegInt, gaugeBoost: gauge, perPersonPerDay: posInt, jointMultiplier: posInt, petXp: nonNegInt, jointTension: signedPoints, contextRetentionDays: posInt }),
      gift: caps.and(z.object({ minLevel: posInt, complicity: signedPoints, tension: signedPoints })),
      visit: z.object({ linkXp: nonNegInt, minWaitingHours: z.number().min(0) }),
      feedFriend: z.object({ friendship: nonNegInt, friendshipMax: posInt, satiety: gauge, rewardedPerDonorPerDay: nonNegInt, rewardedPerPairPerDay: nonNegInt }),
      absence: z.object({ graceHours: z.number().min(0), complicityPerDay: signedPoints, tensionPerDay: signedPoints }),
      memoriesMax: posInt,
      inactivity: z.object({ thresholdHours: posInt, moodPenalty: gauge, dailyMoodPenaltyCap: gauge }),
      desire: z.object({ perSharedAction: signedPoints, max: gauge }),
      waiting: z.object({ notifyAfterHours: z.number().min(0), tensionAfterHours: z.number().min(0), tensionIncrease: gauge }),
    }),
    link: z.object({
      levelThresholds: z.array(nonNegInt).length(7),
      contributionWindowDays: posInt,
      contributionWeights: z.object({ message: nonNegInt, play: nonNegInt, mission: nonNegInt }),
      dailyContributionCaps: z.object({ message: nonNegInt, play: nonNegInt, mission: nonNegInt }),
      /** k = 1 − balancePenaltyPermille/1000 · |a−b|/(a+b) ; k = 1 si a+b = 0. */
      balancePenaltyPermille: z.number().int().min(0).max(1000),
      /** m = (basePermille + spanPermille · affinité/100) / 1000. */
      affinityMultiplier: z.object({ basePermille: nonNegInt, spanPermille: nonNegInt }),
      friendMaxLevel: posInt,
      undecidedMaxLevel: posInt,
    }),
    petXp: z.object({
      stageThresholds: z.object({ YOUNG: nonNegInt, ADULT: nonNegInt }),
      weekendPremiumMultiplier: posInt,
      childCareShare: prob,
    }),
    coins: z.object({
      missionDaily: nonNegInt,
      streakMilestone: z.object({ days: posInt, coins: nonNegInt }),
      referral: z.object({ referrer: nonNegInt, referee: nonNegInt }),
      neighborhoodFeed: nonNegInt,
      catalog: z.object({ streakFreeze: posInt, visibilityBoost: posInt, giftBasic: posInt }),
      plusMonthly: z.object({ coins: nonNegInt, streakFreezes: nonNegInt }),
    }),
    reliability: z.object({
      initial: gauge,
      max: gauge,
      ghostingAfterHours: posInt,
      ghostingPenalty: gauge,
      dailyRecovery: gauge,
      recoveryReplyWithinHours: posInt,
      silenceCloseDays: posInt,
    }),
    pause: z.object({ maxDays: posInt }),
    egg: z.object({
      sessionHour: hour,
      proposedWindowEndHour: hour,
      nights: posInt,
      questionsPerNight: posInt,
      heatSame: nonNegInt,
      heatDifferent: nonNegInt,
      heatCap: posInt,
      maxOpenNights: posInt,
      maxValidationsPerRelationDay: posInt,
      hatchTapWindowSeconds: posInt,
      heredityMaxDeltaPerAxis: z.number().min(0).max(1),
      nameMaxLength: posInt,
      nameSeparator: z.string().min(1).max(3),
    }),
    group: z.object({ min: posInt, max: posInt, missionMinParticipants: posInt }),
    notifications: z.object({
      maxPerDay: posInt,
      quietStartHour: hour,
      quietEndHour: hour,
      priority: z.array(z.enum(['HUMAN_MESSAGE', 'REAL_WAITING', 'STREAK', 'NEIGHBORHOOD', 'MISSION'])).length(5),
    }),
    matching: z.object({
      weights: z.object({ C: prob, P: prob, D: prob, E: prob, R: prob, G: prob, S: prob, M: prob }),
      dailyRunHour: hour,
      proposalTtlHours: posInt,
      batch: z.object({ size: posInt, strong: nonNegInt, discovery: nonNegInt, discoveryMinScore: z.number().min(0).max(100) }),
      maxPendingProposals: posInt,
      minAge: posInt,
      inactiveAfterDays: posInt,
      ghosterLimitMinReliability: gauge,
      geography: z.object({ fullScoreKm: z.number().positive() }),
      rhythm: z.object({ minEvents: posInt, neutral: prob }),
      reputation: z.object({ neutral: prob, minWords: posInt, saturationWords: posInt }),
      exposure: z.object({ windowDays: posInt, targetImpressions: posInt, maxAdjustment: z.number().min(0).max(50), boostAdjustment: z.number().min(0).max(50) }),
      matrices: z.object({
        version: z.string().min(1),
        sunday: symmetricMatrix(SUNDAYS, true),
        school: symmetricMatrix(SCHOOLS, true),
        species: symmetricMatrix(SPECIES, false),
      }),
    }),
    map: z.object({ cellMinMeters: z.number().int().min(500) }),
  })
  .superRefine((t, ctx) => {
    const w = t.matching.weights;
    const sum = w.C + w.P + w.D + w.E + w.R + w.G + w.S + w.M;
    if (Math.abs(sum - 1) > 1e-9) ctx.addIssue({ code: 'custom', message: `poids du score de vision = ${sum}, attendu 1` });
    const th = t.link.levelThresholds;
    if (th[0] !== 0 || th.some((v, i) => i > 0 && v <= (th[i - 1] ?? 0))) ctx.addIssue({ code: 'custom', message: 'seuils de niveaux non croissants depuis 0' });
    const b = t.matching.batch;
    if (b.strong + b.discovery !== b.size) ctx.addIssue({ code: 'custom', message: 'lot : strong + discovery ≠ size' });
    if (t.group.min > t.group.max) ctx.addIssue({ code: 'custom', message: 'bande : min > max' });
    if (t.egg.heatCap > t.egg.nights * t.egg.questionsPerNight * t.egg.heatSame) ctx.addIssue({ code: 'custom', message: 'plafond de chaleur inatteignable' });
  });

export type Tuning = z.infer<typeof TuningSchema>;
export type NotificationCategory = Tuning['notifications']['priority'][number];
