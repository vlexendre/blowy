import { describe, expect, it } from 'vitest';
import { PLUS_PERKS, entitlements } from './entitlements';
import { PREMIUM_ITEM_IDS, cleanOutfit, ownedWith, withoutPremium } from './items';

describe('entitlements', () => {
  it('sans Minimoa+ : 2 habitudes, 1 joker, sa zone seulement, pas de bonus', () => {
    expect(entitlements(false)).toEqual({
      habits: 2,
      jokersPerWeek: 1,
      mapEverywhere: false,
      changeCity: false,
      freeRename: false,
      detailedReview: false,
      encounterBonus: 0,
      premiumItems: false,
      groups: 2,
    });
  });
  it('avec Minimoa+ : 6 habitudes, 3 jokers, toute la carte, bilan détaillé, renommage libre', () => {
    expect(entitlements(true)).toEqual({
      habits: 6,
      jokersPerWeek: 3,
      mapEverywhere: true,
      changeCity: true,
      freeRename: true,
      detailedReview: true,
      encounterBonus: 1,
      premiumItems: true,
      groups: 10,
    });
  });
  it('chaque avantage de Minimoa+ est réellement plus généreux', () => {
    const free = entitlements(false);
    const plus = entitlements(true);
    expect(plus.habits).toBeGreaterThan(free.habits);
    expect(plus.jokersPerWeek).toBeGreaterThan(free.jokersPerWeek);
    expect(plus.encounterBonus).toBeGreaterThan(free.encounterBonus);
    expect(PLUS_PERKS).toHaveLength(7);
  });
  it('les limites sont figées (personne ne les modifie par erreur)', () => {
    expect(Object.isFrozen(entitlements(true))).toBe(true);
    expect(Object.isFrozen(entitlements(false))).toBe(true);
  });
});

describe('objets premium (Minimoa+)', () => {
  it('avec Minimoa+ : tous les objets premium sont possédés, en plus de ceux gagnés', () => {
    const owned = ownedWith(['bob', 'casquette'], entitlements(true).premiumItems);
    expect(PREMIUM_ITEM_IDS.length).toBeGreaterThan(0);
    for (const id of PREMIUM_ITEM_IDS) expect(owned.has(id)).toBe(true);
    expect(owned.has('bob')).toBe(true);
  });
  it('sans Minimoa+ : aucun objet premium, même attribué autrement (démo, ancien achat)', () => {
    const owned = ownedWith(['bob', 'aureole'], entitlements(false).premiumItems);
    expect([...owned]).toEqual(['bob']);
  });
  it('fin de Minimoa+ : le minimoa range ses objets premium, garde le reste', () => {
    expect(withoutPremium({ head: 'aureole', face: 'lunettes_rondes', toy: 'skate' })).toEqual({ face: 'lunettes_rondes' });
    const plain = { head: 'bob' };
    expect(withoutPremium(plain)).toBe(plain);
    expect(cleanOutfit({ head: 'aureole' }, ownedWith([], false))).toEqual({});
    expect(cleanOutfit({ head: 'aureole' }, ownedWith([], true))).toEqual({ head: 'aureole' });
  });
});
