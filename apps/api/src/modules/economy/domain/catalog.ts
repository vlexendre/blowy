import { DAY_MS } from '@blowy/domain';
import { internal, precondition } from './errors.js';
import type { EconomyParams } from './params.js';

/**
 * Catalogue boutique en pièces. Tous les objets sont DÉTERMINISTES à l'achat : aucune loterie
 * payante. Un œuf rare de boutique est un cosmétique (variante connue à l'avance) ; il ne produit
 * jamais de bébé relationnel et ne contourne pas le niveau 7.
 */
export type CatalogItemKind =
  | 'STREAK_FREEZE'
  | 'VISIBILITY_BOOST'
  | 'RARE_EGG_COSMETIC'
  | 'ACCESSORY'
  | 'DECORATION'
  | 'GIFT';

export interface CatalogItem {
  readonly id: string;
  readonly kind: CatalogItemKind;
  readonly priceCoins: number;
  readonly active: boolean;
  /** Nombre maximal possédé par utilisateur (null = illimité, ex. consommables). */
  readonly perUserLimit: number | null;
  /** Stock global (null = illimité). */
  readonly stockLimit: number | null;
  readonly soldCount: number;
  /** Données d'affichage/cosmétique (variante d'œuf, slot d'accessoire, clé de texte). */
  readonly metadata: Readonly<Record<string, unknown>>;
}

export type InventoryStatus = 'OWNED' | 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REFUNDED';

export interface PurchaseContext {
  readonly now: Date;
  readonly params: EconomyParams;
  /** Objets de ce catalogItem possédés (statuts OWNED/ACTIVE). */
  readonly ownedCount: number;
  /** Gels AVAILABLE de l'utilisateur. */
  readonly availableFreezes: number;
  /** Boost ACTIVE non consommé de l'utilisateur. */
  readonly hasActiveBoost: boolean;
}

/** Effet d'un achat, appliqué par le use case dans la même transaction que le débit. */
export type PurchaseEffect =
  | { readonly type: 'GRANT_STREAK_FREEZE' }
  | { readonly type: 'ACTIVATE_BOOST'; readonly expiresAt: Date; readonly exposureAdjustment: number }
  | { readonly type: 'ADD_COSMETIC'; readonly variant: string | null };

export interface PurchasePlan {
  readonly priceCoins: number;
  readonly inventoryStatus: InventoryStatus;
  readonly inventoryExpiresAt: Date | null;
  readonly effect: PurchaseEffect;
}

/** Strategy par type d'objet : règles d'achat isolées, ajout d'un type = une entrée. */
interface PurchaseStrategy {
  plan(item: CatalogItem, ctx: PurchaseContext): Omit<PurchasePlan, 'priceCoins'>;
}

const owned: PurchaseStrategy = {
  plan: (item) => ({
    inventoryStatus: 'OWNED',
    inventoryExpiresAt: null,
    effect: { type: 'ADD_COSMETIC', variant: typeof item.metadata['variant'] === 'string' ? item.metadata['variant'] : null },
  }),
};

const STRATEGIES: Record<CatalogItemKind, PurchaseStrategy> = {
  STREAK_FREEZE: {
    plan: (_item, ctx) => {
      if (ctx.availableFreezes >= ctx.params.maxAvailableStreakFreezes) {
        throw precondition('Nombre maximal de gels disponibles atteint.', { max: ctx.params.maxAvailableStreakFreezes });
      }
      return { inventoryStatus: 'CONSUMED', inventoryExpiresAt: null, effect: { type: 'GRANT_STREAK_FREEZE' } };
    },
  },
  VISIBILITY_BOOST: {
    plan: (_item, ctx) => {
      if (ctx.hasActiveBoost) throw precondition('Un boost attend déjà ton prochain lot.');
      const expiresAt = new Date(ctx.now.getTime() + ctx.params.visibilityBoostValidityDays * DAY_MS);
      return {
        inventoryStatus: 'ACTIVE',
        inventoryExpiresAt: expiresAt,
        effect: { type: 'ACTIVATE_BOOST', expiresAt, exposureAdjustment: ctx.params.visibilityBoostExposureAdjustment },
      };
    },
  },
  RARE_EGG_COSMETIC: owned,
  ACCESSORY: owned,
  DECORATION: owned,
  GIFT: owned,
};

export function planCatalogPurchase(item: CatalogItem, ctx: PurchaseContext): PurchasePlan {
  if (!item.active) throw precondition("Cet objet n'est plus en vente.", { itemId: item.id });
  if (!Number.isSafeInteger(item.priceCoins) || item.priceCoins <= 0) {
    throw internal('Prix catalogue invalide.', { itemId: item.id });
  }
  if (item.stockLimit !== null && item.soldCount >= item.stockLimit) throw precondition('Rupture de stock.', { itemId: item.id });
  if (item.perUserLimit !== null && ctx.ownedCount >= item.perUserLimit) {
    throw precondition('Objet déjà possédé.', { itemId: item.id });
  }
  return { priceCoins: item.priceCoins, ...STRATEGIES[item.kind].plan(item, ctx) };
}

/** Définition de catalogue (seed) dérivée du tuning : seuls gel et boost ont un prix imposé par le brief. */
export interface CatalogSeedItem {
  readonly id: string;
  readonly kind: CatalogItemKind;
  readonly priceCoins: number;
  readonly perUserLimit: number | null;
  readonly stockLimit: number | null;
  readonly metadata: Record<string, unknown>;
}

export function buildCatalogSeed(params: EconomyParams, cosmetics: readonly CatalogSeedItem[]): CatalogSeedItem[] {
  return [
    { id: 'streak_freeze', kind: 'STREAK_FREEZE', priceCoins: params.streakFreezePriceCoins, perUserLimit: null, stockLimit: null, metadata: { labelKey: 'economy.catalog.streak_freeze' } },
    { id: 'visibility_boost', kind: 'VISIBILITY_BOOST', priceCoins: params.visibilityBoostPriceCoins, perUserLimit: null, stockLimit: null, metadata: { labelKey: 'economy.catalog.visibility_boost' } },
    ...cosmetics.map((c) => {
      if (c.kind === 'STREAK_FREEZE' || c.kind === 'VISIBILITY_BOOST') throw internal('Cosmétique invalide.');
      return c;
    }),
  ];
}
