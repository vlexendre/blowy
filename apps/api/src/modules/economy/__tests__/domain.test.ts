import { describe, expect, it } from 'vitest';
import {
  applyEntry,
  planReversal,
  planCatalogPurchase,
  planFreezeUse,
  calendarDay,
  effectiveKeys,
  planDerivedGrant,
  dateSlotsFor,
  deriveStateFromSnapshot,
  shouldApplyHint,
  isMonthlyBenefitEligible,
  weekendPetXpMultiplier,
  monthlyPeriod,
  BLOWY_PLUS_ENTITLEMENT,
  type CatalogItem,
  type GrantRecord,
  type ProviderCustomerSnapshot,
} from '../domain/index.js';
import { TEST_PARAMS } from './fixtures.js';

const wallet = (balance: number) => ({ id: 'w', userId: 'u', balance, version: 0 });
const base = { reason: 'CATALOG_PURCHASE' as const, source: 'CATALOG' as const, idempotencyKey: 'k', causeType: 't', causeId: null };

describe('ledger', () => {
  it('refuse un débit au-delà du solde', () => {
    expect(() => applyEntry(wallet(199), { ...base, amount: -200 })).toThrowError(/insuffisant/);
    expect(applyEntry(wallet(200), { ...base, amount: -200 }).balanceAfter).toBe(0);
  });
  it('refuse montants non entiers ou nuls', () => {
    expect(() => applyEntry(wallet(10), { ...base, amount: 1.5 })).toThrow();
    expect(() => applyEntry(wallet(10), { ...base, amount: 0 })).toThrow();
  });
  it('correction staff : acteur et motif obligatoires', () => {
    const d = { ...base, reason: 'STAFF_CORRECTION' as const, source: 'STAFF' as const, amount: 50 };
    expect(() => applyEntry(wallet(0), d)).toThrow(/acteur/);
    expect(() => applyEntry(wallet(0), { ...d, actorUserId: 's' })).toThrow(/Motif/);
    expect(applyEntry(wallet(0), { ...d, actorUserId: 's', note: 'erreur de mission' }).balanceAfter).toBe(50);
  });
  it('remboursement = contre-écriture bornée au solde (jamais négatif)', () => {
    const r = planReversal(wallet(120), { id: 'e1', amount: 500 }, { reason: 'REFUND_REVERSAL', source: 'STORE', idempotencyKey: 'r', causeType: 'x', causeId: null });
    expect(r.draft?.amount).toBe(-120);
    expect(r.draft?.reversesEntryId).toBe('e1');
    expect(r.unrecovered).toBe(380);
    expect(planReversal(wallet(0), { id: 'e1', amount: 500 }, { reason: 'REFUND_REVERSAL', source: 'STORE', idempotencyKey: 'r', causeType: 'x', causeId: null }).draft).toBeNull();
  });
});

const item = (over: Partial<CatalogItem>): CatalogItem => ({
  id: 'x', kind: 'ACCESSORY', priceCoins: 100, active: true, perUserLimit: 1, stockLimit: null, soldCount: 0, metadata: {}, ...over,
});
const ctx = { now: new Date('2026-11-01T10:00:00Z'), params: TEST_PARAMS, ownedCount: 0, availableFreezes: 0, hasActiveBoost: false };

describe('catalogue', () => {
  it('gel : objet consommé immédiatement en gel disponible, plafond', () => {
    const p = planCatalogPurchase(item({ kind: 'STREAK_FREEZE', priceCoins: 200, perUserLimit: null }), ctx);
    expect(p).toMatchObject({ priceCoins: 200, inventoryStatus: 'CONSUMED', effect: { type: 'GRANT_STREAK_FREEZE' } });
    expect(() => planCatalogPurchase(item({ kind: 'STREAK_FREEZE', perUserLimit: null }), { ...ctx, availableFreezes: 5 })).toThrow(/maximal/);
  });
  it('boost : actif avec expiration, un seul à la fois', () => {
    const p = planCatalogPurchase(item({ kind: 'VISIBILITY_BOOST', priceCoins: 300, perUserLimit: null }), ctx);
    expect(p.inventoryExpiresAt?.toISOString()).toBe('2026-11-08T10:00:00.000Z');
    expect(p.effect).toMatchObject({ type: 'ACTIVATE_BOOST', exposureAdjustment: 10 });
    expect(() => planCatalogPurchase(item({ kind: 'VISIBILITY_BOOST', perUserLimit: null }), { ...ctx, hasActiveBoost: true })).toThrow();
  });
  it('œuf rare : cosmétique déterministe (variante fixée), limite par utilisateur', () => {
    const egg = item({ kind: 'RARE_EGG_COSMETIC', metadata: { variant: 'aurora' } });
    expect(planCatalogPurchase(egg, ctx).effect).toEqual({ type: 'ADD_COSMETIC', variant: 'aurora' });
    expect(planCatalogPurchase(egg, ctx)).toEqual(planCatalogPurchase(egg, ctx));
    expect(() => planCatalogPurchase(egg, { ...ctx, ownedCount: 1 })).toThrow(/possédé/);
  });
  it('inactif / rupture refusés', () => {
    expect(() => planCatalogPurchase(item({ active: false }), ctx)).toThrow();
    expect(() => planCatalogPurchase(item({ stockLimit: 3, soldCount: 3 }), ctx)).toThrow(/stock/);
  });
});

describe('gels de série', () => {
  const streak = { userId: 'u', length: 10, lastCoveredDay: '2026-10-30', version: 1 };
  it('protège exactement un jour manqué', () => {
    expect(planFreezeUse(streak, '2026-11-01', 1)).toEqual({ protectedDay: '2026-10-31', newLastCoveredDay: '2026-10-31' });
  });
  it('refuse sans jour manqué, avec 2 jours manqués, sans gel', () => {
    expect(() => planFreezeUse(streak, '2026-10-31', 1)).toThrow(/manqué/);
    expect(() => planFreezeUse(streak, '2026-11-02', 2)).toThrow(/rompue/);
    expect(() => planFreezeUse(streak, '2026-11-01', 0)).toThrow(/Aucun gel/);
  });
  it('jour calendaire dans la timezone de l’utilisateur', () => {
    const at = new Date('2026-11-01T23:30:00Z');
    expect(calendarDay(at, 'Europe/Paris')).toBe('2026-11-02');
    expect(calendarDay(at, 'America/New_York')).toBe('2026-11-01');
  });
});

const grant = (over: Partial<GrantRecord>): GrantRecord => ({
  id: 'g', beneficiaryUserId: 'A', entitlementId: BLOWY_PLUS_ENTITLEMENT, source: 'STORE_SUBSCRIPTION', environment: 'PRODUCTION',
  subscriptionId: 's', derivedFromUserId: null, relationshipId: null, startsAt: new Date('2026-10-01T00:00:00Z'), endsAt: new Date('2026-12-01T00:00:00Z'), revokedAt: null, ...over,
});
const at = new Date('2026-11-01T00:00:00Z');
const PROD = new Set(['PRODUCTION'] as const);
const LOCAL = new Set(['LOCAL_DEMO'] as const);

describe('droits', () => {
  it('titulaire : toutes les clés, 3 rendez-vous', () => {
    const k = effectiveKeys([grant({})], at, PROD);
    expect(k.has('PLUS_MONTHLY_BENEFITS')).toBe(true);
    expect(dateSlotsFor(k, TEST_PARAMS)).toBe(3);
    expect(dateSlotsFor(new Set(), TEST_PARAMS)).toBe(1);
  });
  it('dérivé partenaire : pas de bénéfices mensuels ni espèces premium', () => {
    const k = effectiveKeys([grant({ source: 'DERIVED_PARTNER', beneficiaryUserId: 'B', derivedFromUserId: 'A', relationshipId: 'r', subscriptionId: null })], at, PROD);
    expect(k.has('PLUS_MONTHLY_BENEFITS')).toBe(false);
    expect(k.has('PLUS_PREMIUM_SPECIES')).toBe(false);
    expect(k.has('PLUS_DATE_SLOTS')).toBe(true);
  });
  it('non transitif : un dérivé ne peut pas en produire un autre', () => {
    const derivedB = grant({ id: 'gB', source: 'DERIVED_PARTNER', beneficiaryUserId: 'B', derivedFromUserId: 'A', relationshipId: 'r1', subscriptionId: null });
    expect(planDerivedGrant({ holderUserId: 'B', partnerUserId: 'C', relationshipId: 'r2', holderGrants: [derivedB], at, accepted: PROD })).toBeNull();
    const plan = planDerivedGrant({ holderUserId: 'A', partnerUserId: 'B', relationshipId: 'r1', holderGrants: [grant({})], at, accepted: PROD });
    expect(plan).toMatchObject({ beneficiaryUserId: 'B', derivedFromUserId: 'A', endsAt: new Date('2026-12-01T00:00:00Z') });
  });
  it('droit expiré ou révoqué : aucune clé', () => {
    expect(effectiveKeys([grant({ endsAt: new Date('2026-10-15T00:00:00Z') })], at, PROD).size).toBe(0);
    expect(effectiveKeys([grant({ revokedAt: at })], at, PROD).size).toBe(0);
  });
  it('LOCAL_DEMO sans effet quand interdit (production)', () => {
    expect(effectiveKeys([grant({ source: 'LOCAL_DEMO', environment: 'LOCAL_DEMO' })], at, PROD).size).toBe(0);
    expect(effectiveKeys([grant({ source: 'LOCAL_DEMO', environment: 'LOCAL_DEMO' })], at, LOCAL).size).toBeGreaterThan(0);
    expect(effectiveKeys([grant({ environment: 'SANDBOX' })], at, PROD).size).toBe(0);
  });
  it('mensuel : titulaire payant seulement (pas en essai)', () => {
    expect(isMonthlyBenefitEligible('ACTIVE', true)).toBe(true);
    expect(isMonthlyBenefitEligible('TRIAL', true)).toBe(false);
    expect(isMonthlyBenefitEligible('ACTIVE', false)).toBe(false);
    expect(monthlyPeriod(new Date('2026-11-30T23:59:59Z'))).toBe('2026-11');
  });
  it('XP pet ×2 week-end seulement avec droit', () => {
    const k = effectiveKeys([grant({})], at, PROD);
    expect(weekendPetXpMultiplier(k, true, TEST_PARAMS)).toBe(2);
    expect(weekendPetXpMultiplier(k, false, TEST_PARAMS)).toBe(1);
    expect(weekendPetXpMultiplier(new Set(), true, TEST_PARAMS)).toBe(1);
  });
});

describe('abonnement depuis snapshot fournisseur', () => {
  const now = new Date('2026-11-01T00:00:00Z');
  const products = new Set(['blowy_plus_annual', 'blowy_plus_monthly']);
  const snap = (sub: Partial<ProviderCustomerSnapshot['subscriptions'][number]>, ent = true): ProviderCustomerSnapshot => ({
    appUserId: 'A', fetchedAt: now, consumables: [],
    entitlements: ent ? [{ entitlementId: 'blowy_plus', productId: 'blowy_plus_monthly', expiresAt: sub.expiresAt ?? null, gracePeriodExpiresAt: null }] : [],
    subscriptions: [{ productId: 'blowy_plus_monthly', store: 'APP_STORE', environment: 'PRODUCTION', periodType: 'NORMAL', purchasedAt: now,
      expiresAt: new Date('2026-12-01T00:00:00Z'), gracePeriodExpiresAt: null, unsubscribeDetectedAt: null, billingIssuesDetectedAt: null, refundedAt: null, storeTransactionId: 't', ...sub }],
  });
  const state = (s: ProviderCustomerSnapshot) => deriveStateFromSnapshot(s, 'blowy_plus', products, now)[0]?.state;
  it('états', () => {
    expect(state(snap({}))).toBe('ACTIVE');
    expect(state(snap({ periodType: 'TRIAL' }))).toBe('TRIAL');
    expect(state(snap({ unsubscribeDetectedAt: now }))).toBe('CANCELLED_PENDING_EXPIRY');
    expect(state(snap({ expiresAt: new Date('2026-10-01T00:00:00Z') }))).toBe('EXPIRED');
    expect(state(snap({ expiresAt: new Date('2026-10-30T00:00:00Z'), gracePeriodExpiresAt: new Date('2026-11-05T00:00:00Z') }))).toBe('GRACE_PERIOD');
    expect(state(snap({ refundedAt: now }))).toBe('REFUNDED');
    expect(state(snap({}, false))).toBe('REVOKED');
  });
  it('sandbox et production séparés', () => {
    const s = snap({});
    const both: ProviderCustomerSnapshot = { ...s, subscriptions: [...s.subscriptions, { ...s.subscriptions[0]!, environment: 'SANDBOX' }] };
    expect(deriveStateFromSnapshot(both, 'blowy_plus', products, now).map((d) => d.environment).sort()).toEqual(['PRODUCTION', 'SANDBOX']);
  });
  it('indice webhook plus ancien ignoré', () => {
    const cur = { lastProviderEventAt: new Date('2026-11-01T10:00:00Z') };
    const hint = { state: 'EXPIRED' as const, productId: null, store: null, periodType: null, currentPeriodEndsAt: null, gracePeriodEndsAt: null };
    expect(shouldApplyHint(cur, { ...hint, eventAt: new Date('2026-11-01T09:00:00Z') })).toBe(false);
    expect(shouldApplyHint(cur, { ...hint, eventAt: new Date('2026-11-01T11:00:00Z') })).toBe(true);
  });
});
