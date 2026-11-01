import { DEFAULT_TUNING, catalogPrices, coinRewards, type Tuning } from '@blowy/tuning';
import type { EconomyParams } from '../../domain/index.js';
import type { EconomyParamsProvider } from '../../application/ports/economy-config.port.js';

/**
 * Valeurs encore ABSENTES de @blowy/tuning (demandées à l'agent B dans docs/agents/handoffs/G.md).
 * Hypothèses produit P-5.20 : à migrer dans `tuning.economy` dès publication ; une seule source ici.
 */
export const PENDING_TUNING_VALUES = {
  /** Brief : « 3 rendez-vous en parallèle au lieu de 1 ». */
  freeDateSlots: 1,
  plusDateSlots: 3,
  /** Hypothèse : un boost attend 7 jours un lot éligible, sinon remboursé intégralement. */
  visibilityBoostValidityDays: 7,
  /** Hypothèse : 5 gels disponibles au maximum (au-delà, achat refusé ; mensuels non cumulés). */
  maxAvailableStreakFreezes: 5,
} as const;

export function economyParamsFromTuning(t: Tuning): EconomyParams {
  const rewards = coinRewards(t);
  const prices = catalogPrices(t);
  const read = (key: keyof typeof PENDING_TUNING_VALUES): number => {
    // Lecture prioritaire depuis le tuning si B a publié la clé (t.economy.<key>).
    const economy = (t as unknown as { economy?: Record<string, unknown> }).economy;
    const v = economy?.[key];
    return typeof v === 'number' ? v : PENDING_TUNING_VALUES[key];
  };
  return {
    tuningVersion: t.version,
    streakFreezePriceCoins: prices.streakFreeze,
    visibilityBoostPriceCoins: prices.visibilityBoost,
    visibilityBoostValidityDays: read('visibilityBoostValidityDays'),
    visibilityBoostExposureAdjustment: t.matching.exposure.boostAdjustment,
    plusMonthlyCoins: rewards.plusMonthlyCoins,
    plusMonthlyStreakFreezes: rewards.plusMonthlyStreakFreezes,
    maxAvailableStreakFreezes: read('maxAvailableStreakFreezes'),
    freeDateSlots: read('freeDateSlots'),
    plusDateSlots: read('plusDateSlots'),
    plusWeekendPetXpMultiplier: t.petXp.weekendPremiumMultiplier,
  };
}

/** Fournit les paramètres du tuning actif (par défaut le tuning versionné du package). */
export class TuningEconomyParams implements EconomyParamsProvider {
  private readonly params: EconomyParams;
  constructor(tuning: Tuning = DEFAULT_TUNING) {
    this.params = economyParamsFromTuning(tuning);
  }
  current(): EconomyParams {
    return this.params;
  }
}
