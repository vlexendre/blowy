import { describe, expect, it } from 'vitest';
import type { StorePackage } from '../../purchases';
import { isoPeriodLabel, packageLine } from './paywall';
import { purchasesAvailable } from './availability';

const pkg = (o: Partial<StorePackage>): StorePackage => ({ id: 'a', offeringId: 'o', productId: 'p', kind: 'SUBSCRIPTION', period: 'ANNUAL', title: 'x', priceString: '59,88 €', price: 59.88, currencyCode: 'EUR', pricePerMonthString: '4,99 €', introOffer: null, ...o });

describe('paywall', () => {
  it('prix uniquement depuis le store ; essai seulement s’il est déclaré', () => {
    const l = packageLine(pkg({}), 'LIVE');
    expect(l.priceLine).toContain('59,88 €');
    expect(l.introLine).toBeNull();
    const tr = packageLine(pkg({ introOffer: { kind: 'FREE_TRIAL', priceString: '0 €', period: 'P3D', cycles: 1 } }), 'SANDBOX');
    expect(tr.introLine).toContain('3 jours');
  });
  it('démo locale : aucun prix, étiquette explicite', () => {
    const l = packageLine(pkg({ priceString: '' }), 'LOCAL_DEMO');
    expect(l.priceLine).toBe('Démo locale · aucune transaction réelle');
    expect(l.introLine).toBeNull();
  });
  it('durées ISO', () => {
    expect(isoPeriodLabel('P1Y')).toBe('1 an');
    expect(isoPeriodLabel('P2W')).toBe('2 semaines');
  });
  it('production sans clé : achats indisponibles', () => {
    expect(purchasesAvailable('ios', {}, 'production')).toBe(false);
    expect(purchasesAvailable('ios', { ios: 'appl_x' }, 'production')).toBe(true);
    expect(purchasesAvailable('android', {}, 'local')).toBe(true);
  });
});
