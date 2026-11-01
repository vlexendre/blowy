import type { EconomyParams } from '../domain/params.js';

/** Paramètres de test (valeurs explicites, indépendantes du tuning publié). */
export const TEST_PARAMS: EconomyParams = {
  tuningVersion: 'tuning-2026.11.0',
  streakFreezePriceCoins: 200,
  visibilityBoostPriceCoins: 300,
  visibilityBoostValidityDays: 7,
  visibilityBoostExposureAdjustment: 10,
  plusMonthlyCoins: 200,
  plusMonthlyStreakFreezes: 2,
  maxAvailableStreakFreezes: 5,
  freeDateSlots: 1,
  plusDateSlots: 3,
  plusWeekendPetXpMultiplier: 2,
};
