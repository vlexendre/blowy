import { describe, expect, it } from 'vitest';
import { PLUS_PERKS, entitlements } from './entitlements';

describe('entitlements', () => {
  it('sans Blowy+ : 2 habitudes, 1 joker, sa zone seulement, pas de bonus', () => {
    expect(entitlements(false)).toEqual({
      habits: 2,
      jokersPerWeek: 1,
      mapEverywhere: false,
      changeCity: false,
      freeRename: false,
      detailedReview: false,
      encounterBonus: 0,
      premiumItems: false,
    });
  });
  it('avec Blowy+ : 6 habitudes, 3 jokers, toute la carte, bilan détaillé, renommage libre', () => {
    expect(entitlements(true)).toEqual({
      habits: 6,
      jokersPerWeek: 3,
      mapEverywhere: true,
      changeCity: true,
      freeRename: true,
      detailedReview: true,
      encounterBonus: 1,
      premiumItems: true,
    });
  });
  it('chaque avantage de Blowy+ est réellement plus généreux', () => {
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
