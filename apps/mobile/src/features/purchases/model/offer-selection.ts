/**
 * Sélection PURE des packages du paywall à partir des offerings du store (testée unitairement).
 * - Aucun prix ni pourcentage codé : seuls les champs du store sont utilisés.
 * - L'offre « première année réduite » (brief : −60 %) n'existe que si le dashboard la publie
 *   dans une offering dont metadata.placement === 'onboarding_later' ET qu'elle contient un
 *   package annuel avec une offre introductive réelle (éligibilité store). Sinon : null.
 * - La réduction affichée est CALCULÉE depuis les prix store (intro vs prix plein), jamais fixée.
 */
import type { Offerings, StoreOffering, StorePackage } from './purchases.port';

export const LATER_OFFER_PLACEMENT = 'onboarding_later';

export interface PaywallSelection {
  readonly offeringId: string;
  readonly annual: StorePackage | null;
  readonly monthly: StorePackage | null;
  readonly weekly: StorePackage | null;
  /** Essai gratuit réellement disponible (éligibilité store), sur le package recommandé. */
  readonly trial: { readonly pkg: StorePackage; readonly period: string } | null;
  /** Offre « Plus tard » réelle, sinon null. */
  readonly laterOffer: {
    readonly pkg: StorePackage;
    readonly introPriceString: string;
    readonly discountPercent: number | null;
  } | null;
  readonly coinPacks: readonly StorePackage[];
}

const byPeriod = (o: StoreOffering | null, period: StorePackage['period']) =>
  o?.packages.find((p) => p.kind === 'SUBSCRIPTION' && p.period === period) ?? null;

/** Pourcentage de réduction calculé à partir des montants store (null si non calculable). */
export function computeDiscountPercent(introPrice: number, fullPrice: number): number | null {
  if (!(fullPrice > 0) || !(introPrice >= 0) || introPrice >= fullPrice) return null;
  return Math.round((1 - introPrice / fullPrice) * 100);
}

/** Montant numérique de l'offre intro (le port n'expose que la chaîne localisée → parsing tolérant). */
function introAmount(pkg: StorePackage): number | null {
  if (!pkg.introOffer) return null;
  if (pkg.introOffer.kind === 'FREE_TRIAL') return 0;
  const digits = pkg.introOffer.priceString.replace(/[^\d.,]/g, '').replace(/\s/g, '');
  const normalized =
    digits.includes(',') && !digits.includes('.')
      ? digits.replace(',', '.')
      : digits.replace(/,/g, '');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

export function selectPaywall(offerings: Offerings): PaywallSelection | null {
  const current = offerings.current;
  if (!current) return null;
  const annual = byPeriod(current, 'ANNUAL');
  const monthly = byPeriod(current, 'MONTHLY');
  const weekly = byPeriod(current, 'WEEKLY');
  const recommended = annual ?? monthly ?? weekly;
  const trial =
    recommended?.introOffer?.kind === 'FREE_TRIAL'
      ? { pkg: recommended, period: recommended.introOffer.period }
      : null;

  const later =
    offerings.all.find((o) => o.metadata['placement'] === LATER_OFFER_PLACEMENT) ?? null;
  const laterAnnual = byPeriod(later, 'ANNUAL');
  let laterOffer: PaywallSelection['laterOffer'] = null;
  if (laterAnnual?.introOffer && laterAnnual.introOffer.kind === 'INTRO_PRICE') {
    const amount = introAmount(laterAnnual);
    laterOffer = {
      pkg: laterAnnual,
      introPriceString: laterAnnual.introOffer.priceString,
      discountPercent: amount === null ? null : computeDiscountPercent(amount, laterAnnual.price),
    };
  }
  const coinPacks = offerings.all.flatMap((o) => o.packages.filter((p) => p.kind === 'CONSUMABLE'));
  return {
    offeringId: current.id,
    annual,
    monthly,
    weekly,
    trial,
    laterOffer,
    coinPacks: [...new Map(coinPacks.map((p) => [p.productId, p])).values()],
  };
}
