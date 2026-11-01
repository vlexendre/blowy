/**
 * Paramètres économiques consommés par le domaine. Ils proviennent EXCLUSIVEMENT de
 * `@blowy/tuning` (voir infrastructure/config/economy-params.ts) : le domaine ne contient
 * aucune constante produit. Toutes les valeurs sont des hypothèses produit (P-5.20).
 */
export interface EconomyParams {
  /** Version du tuning ayant produit ces paramètres (traçabilité ledger/replay). */
  readonly tuningVersion: string;
  readonly streakFreezePriceCoins: number;
  readonly visibilityBoostPriceCoins: number;
  /** Fenêtre (jours) pendant laquelle un boost acheté attend un lot éligible ; sinon remboursé. */
  readonly visibilityBoostValidityDays: number;
  /** Ajustement d'exposition borné (points, = tuning matching.exposure.boostAdjustment) appliqué
   *  au seul prochain lot éligible ; jamais au score de vision, aux filtres ni à l'accord humain. */
  readonly visibilityBoostExposureAdjustment: number;
  readonly plusMonthlyCoins: number;
  readonly plusMonthlyStreakFreezes: number;
  /** Nombre maximal de gels disponibles simultanément (anti-accumulation). */
  readonly maxAvailableStreakFreezes: number;
  readonly freeDateSlots: number;
  readonly plusDateSlots: number;
  /** Multiplicateur d'XP pet week-end (XP pet uniquement, jamais XP Lien — P-5.12). */
  readonly plusWeekendPetXpMultiplier: number;
}
