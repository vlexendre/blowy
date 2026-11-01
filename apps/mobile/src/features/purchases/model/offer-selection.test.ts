import { describe, expect, it } from 'vitest';
import { computeDiscountPercent, selectPaywall } from './offer-selection';
import type { Offerings, StorePackage } from './purchases.port';

const pkg = (over: Partial<StorePackage>): StorePackage => ({
  id: 'o:p', offeringId: 'default', productId: 'blowy_plus_annual', kind: 'SUBSCRIPTION', period: 'ANNUAL', title: 'Annuel',
  priceString: '59,88 €', price: 59.88, currencyCode: 'EUR', pricePerMonthString: '4,99 €', introOffer: null, ...over,
});

describe('sélection paywall (aucun prix/réduction codé)', () => {
  it('sans offering « plus tard » ni éligibilité : pas d’essai ni de −60 %', () => {
    const o: Offerings = { mode: 'SANDBOX', current: { id: 'default', isCurrent: true, metadata: {}, packages: [pkg({})] }, all: [] };
    const s = selectPaywall(o)!;
    expect(s.trial).toBeNull();
    expect(s.laterOffer).toBeNull();
    expect(s.annual?.priceString).toBe('59,88 €');
  });
  it('essai affiché seulement si le store le fournit (éligible)', () => {
    const a = pkg({ introOffer: { kind: 'FREE_TRIAL', priceString: '0,00 €', period: 'P3D', cycles: 1 } });
    const s = selectPaywall({ mode: 'SANDBOX', current: { id: 'default', isCurrent: true, metadata: {}, packages: [a] }, all: [] })!;
    expect(s.trial?.period).toBe('P3D');
  });
  it('offre « plus tard » réelle : réduction calculée depuis les prix store', () => {
    const later = pkg({ offeringId: 'later', introOffer: { kind: 'INTRO_PRICE', priceString: '23,95 €', period: 'P1Y', cycles: 1 } });
    const current = { id: 'default', isCurrent: true, metadata: {}, packages: [pkg({})] };
    const s = selectPaywall({ mode: 'LIVE', current, all: [current, { id: 'later', isCurrent: false, metadata: { placement: 'onboarding_later' }, packages: [later] }] })!;
    expect(s.laterOffer?.introPriceString).toBe('23,95 €');
    expect(s.laterOffer?.discountPercent).toBe(60);
  });
  it('calcul de réduction défensif', () => {
    expect(computeDiscountPercent(10, 10)).toBeNull();
    expect(computeDiscountPercent(0, 0)).toBeNull();
    expect(computeDiscountPercent(2, 10)).toBe(80);
  });
});
