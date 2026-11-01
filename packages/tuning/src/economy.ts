/**
 * Vue « économie » du tuning, consommée par le module economy (agent G).
 * Pièces : entiers. Aucun prix store ici (les prix réels viennent des stores / RevenueCat).
 */
import type { Tuning } from './schema.js';

export interface CoinRewards {
  missionDaily: number;
  streakMilestoneDays: number;
  streakMilestoneCoins: number;
  referralReferrer: number;
  referralReferee: number;
  neighborhoodFeed: number;
  plusMonthlyCoins: number;
  plusMonthlyStreakFreezes: number;
}

export interface CatalogPrices {
  streakFreeze: number;
  visibilityBoost: number;
  giftBasic: number;
}

export function coinRewards(t: Tuning): CoinRewards {
  const c = t.coins;
  return {
    missionDaily: c.missionDaily,
    streakMilestoneDays: c.streakMilestone.days,
    streakMilestoneCoins: c.streakMilestone.coins,
    referralReferrer: c.referral.referrer,
    referralReferee: c.referral.referee,
    neighborhoodFeed: c.neighborhoodFeed,
    plusMonthlyCoins: c.plusMonthly.coins,
    plusMonthlyStreakFreezes: c.plusMonthly.streakFreezes,
  };
}

export function catalogPrices(t: Tuning): CatalogPrices {
  return { ...t.coins.catalog };
}

/** Multiplicateur d'XP pet du week-end Blowy+ (jamais appliqué à l'XP du Lien). */
export function petXpWeekendMultiplier(t: Tuning, hasWeekendEntitlement: boolean, isLocalWeekend: boolean): number {
  return hasWeekendEntitlement && isLocalWeekend ? t.petXp.weekendPremiumMultiplier : 1;
}
