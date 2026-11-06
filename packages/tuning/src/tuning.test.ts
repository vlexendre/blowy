import { describe, expect, it } from 'vitest';
import { DEFAULT_TUNING, OUTINGS_V5, parseTuning, safeParseTuning, coinRewards } from './index.js';

describe('tuning', () => {
  it('DEFAULT_TUNING passe le schéma', () => {
    expect(parseTuning(structuredClone(DEFAULT_TUNING)).version).toBe('tuning-2026.12.7');
  });
  it('V5.2 B : garantie « pour toi » (seuil 2, activable) ; défauts appliqués à un payload sans la section', () => {
    expect(DEFAULT_TUNING.outings.composition.storyGuarantee).toEqual({ enabled: true, minCompatible: 2, lambdaGuarantee: 16000 });
    const t = structuredClone(DEFAULT_TUNING) as { outings: { composition: Record<string, unknown> } };
    delete t.outings.composition.storyGuarantee;
    expect(parseTuning(t).outings.composition.storyGuarantee).toEqual({ enabled: true, minCompatible: 2, lambdaGuarantee: 16000 });
    const off = structuredClone(DEFAULT_TUNING) as { outings: { composition: { storyGuarantee: { enabled: boolean; minCompatible: number } } } };
    off.outings.composition.storyGuarantee.enabled = false;
    expect(parseTuning(off).outings.composition.storyGuarantee.enabled).toBe(false);
    off.outings.composition.storyGuarantee.minCompatible = 0;
    expect(safeParseTuning(off).success).toBe(false);
  });
  it('est gelé', () => {
    expect(Object.isFrozen(DEFAULT_TUNING.gauges.initial)).toBe(true);
  });
  it('refuse des poids de vision ne sommant pas à 1', () => {
    const t = structuredClone(DEFAULT_TUNING) as { matching: { weights: { C: number } } };
    t.matching.weights.C = 0.5;
    expect(safeParseTuning(t).success).toBe(false);
  });
  it('refuse une matrice asymétrique', () => {
    const t = structuredClone(DEFAULT_TUNING) as { matching: { matrices: { school: Record<string, Record<string, number>> } } };
    t.matching.matrices.school.CIRQUE!.POLYTECHNIQUE = 0.9;
    expect(safeParseTuning(t).success).toBe(false);
  });
  it('refuse un plafond d’action inférieur au plafond de gain', () => {
    const t = structuredClone(DEFAULT_TUNING) as { actions: { hug: { actionCapPerDay: number } } };
    t.actions.hug.actionCapPerDay = 1;
    expect(safeParseTuning(t).success).toBe(false);
  });
  it('expose les constantes de pièces du brief', () => {
    expect(coinRewards(DEFAULT_TUNING)).toMatchObject({ missionDaily: 20, streakMilestoneCoins: 100, referralReferrer: 100, referralReferee: 100, neighborhoodFeed: 10 });
    expect(DEFAULT_TUNING.coins.catalog).toMatchObject({ streakFreeze: 200, visibilityBoost: 300 });
  });
});

type Mutable = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const clone = (): Mutable => structuredClone(DEFAULT_TUNING) as Mutable;

describe('tuning V5', () => {
  it('un payload V4 (sans sections V5) reste lisible : défauts V5 appliqués', () => {
    const v4 = clone();
    for (const k of ['neighborhoods', 'outings', 'votes', 'duo', 'memories', 'accessories', 'pricing', 'plus', 'credits', 'safety', 'preferences']) delete v4[k];
    delete v4.reliability.v5;
    delete v4.notifications.v5;
    delete v4.matching.ghosterLimitMinAttendancePermille;
    delete v4.egg.minDuoDates;
    const parsed = parseTuning({ ...v4, version: 'tuning-2026.11.0' });
    expect(parsed.outings).toEqual(OUTINGS_V5);
    expect(parsed.reliability.v5.pauseDays).toBe(7);
    expect(parsed.matching.ghosterLimitMinAttendancePermille).toBe(700);
  });
  it('valeurs de la spec (D-012, §4.3, §2.9)', () => {
    const t = DEFAULT_TUNING;
    expect([t.outings.minSizeToForm, t.outings.minSizeToLock, t.outings.minSizeToHold, t.outings.maxSize]).toEqual([4, 4, 3, 6]);
    expect(t.outings.composition.visionWeights.G).toBe(0);
    expect(t.votes.windowHours).toBe(72);
    expect(t.duo.maxActive).toBe(3);
    expect(t.safety.checkinRadiusMeters).toBe(150);
    expect(t.neighborhoods.defaultDensityThreshold).toBeUndefined(); // E21 : seuil 120 mort
    // V5.1
    expect(t.outings.composition.targetSize).toBe(5);
    expect(t.pricing.seat.amountCents).toBe(499);
    expect(t.plus).toMatchObject({ monthlyPriceCents: 999, includesAllOutings: true, duoUnlimited: false, billing: 'STRIPE_BILLING' });
    expect(t.votes.revealMode).toBe('AT_CLOSE');
    expect(t.preferences.groupAgeDefaultDelta).toBe(4);
  });
  it('refuse des poids de groupe ne sommant pas à 1 ou une géographie non nulle', () => {
    const a = clone();
    a.outings.composition.visionWeights.C = 0.5;
    expect(safeParseTuning(a).success).toBe(false);
    const b = clone();
    b.outings.composition.visionWeights.G = 0.1;
    b.outings.composition.visionWeights.C = 0.23;
    expect(safeParseTuning(b).success).toBe(false);
  });
  it('refuse des tailles incohérentes, des paliers non croissants, un accessoire à deux sources', () => {
    const a = clone();
    a.outings.minSizeToHold = 5;
    expect(safeParseTuning(a).success).toBe(false);
    const b = clone();
    b.memories.promiseMilestones = [1, 3, 3];
    expect(safeParseTuning(b).success).toBe(false);
    const c = clone();
    c.accessories.referralAccessoryId = c.memories.accessoryUnlocks[0].accessoryId;
    expect(safeParseTuning(c).success).toBe(false);
    const d = clone();
    d.accessories.maxEquipped = 4;
    expect(safeParseTuning(d).success).toBe(false);
  });
});

describe('tuning V5.4 (concept-v5.4)', () => {
  it('Duo gratuit pour tous (3 actifs), Blowy+ = sorties via Stripe Billing, imprévu 1 par mois (V5.5), 3 € si Blowy annule', () => {
    const t = DEFAULT_TUNING;
    expect(t.duo.maxActive).toBe(3);
    expect(t.plus.duoUnlimited).toBe(false);
    expect(t.plus.billing).toBe('STRIPE_BILLING');
    expect(t.outings.emergencyCancelsPerMonth).toBe(1);
    expect(t.outings.emergencyWindowDays).toBe(30);
    expect(t.venues).toEqual({ compensationUnpaidSeatCents: 300, compensationBlowyCancelSeatCents: 300, welcomeMessageMaxChars: 280 });
  });
  it('un payload V5.3 sans les champs V5.4 reste lisible (défauts)', () => {
    const v53 = clone();
    delete v53.outings.emergencyCancelsPerMonth;
    delete v53.plus.billing;
    delete v53.venues.compensationBlowyCancelSeatCents;
    const p = parseTuning({ ...v53, version: 'tuning-2026.12.3' });
    expect(p.outings.emergencyCancelsPerMonth).toBe(1);
    expect(p.plus.billing).toBe('STRIPE_BILLING');
    expect(p.venues.compensationBlowyCancelSeatCents).toBe(300);
  });
});

describe('tuning V5.5 (concept-v5.5)', () => {
  it('composition J − 3 21 h, demande vendredi 21 h W−1, créneaux mar.→dim., parrainage 1/mois, indicateurs ≥ 10', () => {
    const c = DEFAULT_TUNING.outings.cycle;
    expect([c.composeDaysBefore, c.composeHourLocal, c.requestOpensWeeksBefore, c.requestOpensIsoWeekday, c.requestOpensHourLocal]).toEqual([3, 21, 1, 5, 21]);
    expect(c.slotIsoWeekdays).toEqual([2, 3, 4, 5, 6, 7]);
    expect(DEFAULT_TUNING.referral.maxFreePerMonth).toBe(1);
    expect(DEFAULT_TUNING.cityInsights.minCount).toBe(10);
  });
});

describe('tuning V5.6 (concept-v5.6)', () => {
  it('« je connais quelqu\'un » 1 déplacement / 30 j, week-end ven.→dim., pénalité d\'ambiance, RDV Duo confirmé la veille 18 h', () => {
    const t = DEFAULT_TUNING;
    expect(t.version).toBe('tuning-2026.12.7');
    expect([t.outings.knowsSomeoneMovesPerMonth, t.outings.knowsSomeoneWindowDays]).toEqual([1, 30]);
    expect(t.outings.cycle.weekendIsoWeekdays).toEqual([5, 6, 7]);
    expect(t.outings.composition.lambdaAmbiance).toBeGreaterThan(0);
    expect(t.duo.dateLockHourLocal).toBe(18);
  });
  it('E21 : champs morts absents des défauts, mais une version publiée qui les porte reste lisible', () => {
    const t = DEFAULT_TUNING;
    expect(t.duo.maxActiveFree).toBeUndefined();
    expect(t.plus.includedOutingsPerMonth).toBeUndefined();
    expect(t.plus.includesMonthlyAccessory).toBeUndefined();
    expect(t.accessories.plusMonthlyAccessoryIds).toBeUndefined();
    const old = clone();
    old.duo.maxActiveFree = 1;
    old.plus.includedOutingsPerMonth = 0;
    old.plus.includesMonthlyAccessory = false;
    old.accessories.plusMonthlyAccessoryIds = ['hat_beret'];
    old.neighborhoods.defaultDensityThreshold = 120;
    delete old.outings.knowsSomeoneMovesPerMonth;
    delete old.outings.cycle.weekendIsoWeekdays;
    delete old.outings.composition.lambdaAmbiance;
    delete old.duo.dateLockHourLocal;
    const p = parseTuning({ ...old, version: 'tuning-2026.12.5' });
    expect(p.outings.knowsSomeoneMovesPerMonth).toBe(1);
    expect(p.outings.cycle.weekendIsoWeekdays).toEqual([5, 6, 7]);
    expect(p.duo.dateLockHourLocal).toBe(18);
  });
});

describe('tuning V5.7 (concept-v5.7)', () => {
  it('rappel humain visé en 5 min (SLA dossier 60 inchangée) ; message d’accueil ≤ 280 caractères', () => {
    expect(DEFAULT_TUNING.safety.helpCallbackTargetMinutes).toBe(5);
    expect(DEFAULT_TUNING.safety.humanResponseMinutes).toBe(60);
    expect(DEFAULT_TUNING.venues.welcomeMessageMaxChars).toBe(280);
    const old = clone();
    delete old.safety.helpCallbackTargetMinutes;
    delete old.venues.welcomeMessageMaxChars;
    const p = parseTuning({ ...old, version: 'tuning-2026.12.6' });
    expect([p.safety.helpCallbackTargetMinutes, p.venues.welcomeMessageMaxChars]).toEqual([5, 280]);
  });
});
