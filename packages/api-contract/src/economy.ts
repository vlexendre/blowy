import { z } from 'zod';
import { IntegrationModeSchema, IsoDateTimeSchema, PageQuerySchema, UuidSchema, pageOf } from './core/common.js';

/**
 * Contrats économie & abonnements (propriétaire : agent G).
 * Règles : pièces = entiers ; aucun prix store ici (prix localisés lus par le mobile dans les
 * offerings RevenueCat) ; les droits viennent TOUJOURS du serveur ; le client ne peut rien
 * « accorder » (POST /purchases/sync ignore tout corps).
 */

export const CatalogItemKindSchema = z.enum(['STREAK_FREEZE', 'VISIBILITY_BOOST', 'RARE_EGG_COSMETIC', 'ACCESSORY', 'DECORATION', 'GIFT']);
export type CatalogItemKind = z.infer<typeof CatalogItemKindSchema>;

export const CatalogItemSchema = z.object({
  id: z.string().min(1).max(64),
  kind: CatalogItemKindSchema,
  priceCoins: z.number().int().positive(),
  perUserLimit: z.number().int().positive().nullable(),
  remainingStock: z.number().int().nonnegative().nullable(),
  /** Clé de texte (content/locales) et variante cosmétique déterministe. */
  labelKey: z.string().nullable(),
  variant: z.string().nullable(),
});
export type CatalogItemDto = z.infer<typeof CatalogItemSchema>;

export const CatalogResponseSchema = z.object({ items: z.array(CatalogItemSchema) });
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;

export const CatalogItemIdParamSchema = z.string().regex(/^[a-z0-9_]{1,64}$/);

export const CatalogPurchaseResponseSchema = z.object({
  itemId: z.string(),
  inventoryItemId: UuidSchema,
  priceCoins: z.number().int().positive(),
  balance: z.number().int().nonnegative(),
  ledgerEntryId: UuidSchema,
  expiresAt: IsoDateTimeSchema.nullable(),
  replayed: z.boolean(),
});
export type CatalogPurchaseResponse = z.infer<typeof CatalogPurchaseResponseSchema>;

export const LedgerEntrySchema = z.object({
  id: UuidSchema,
  amount: z.number().int(),
  balanceAfter: z.number().int().nonnegative(),
  reason: z.string(),
  source: z.string(),
  causeType: z.string(),
  createdAt: IsoDateTimeSchema,
  /** Écriture annulée par une contre-écriture (remboursement, correction). */
  reversesEntryId: UuidSchema.nullable(),
});
export type LedgerEntryDto = z.infer<typeof LedgerEntrySchema>;

export const InventoryItemSchema = z.object({
  id: UuidSchema,
  catalogItemId: z.string(),
  status: z.enum(['OWNED', 'ACTIVE', 'CONSUMED', 'EXPIRED', 'REFUNDED']),
  acquiredAt: IsoDateTimeSchema,
  expiresAt: IsoDateTimeSchema.nullable(),
});

export const WalletQuerySchema = PageQuerySchema;
export const WalletResponseSchema = z.object({
  balance: z.number().int().nonnegative(),
  availableStreakFreezes: z.number().int().nonnegative(),
  /** Présent sur la première page seulement. */
  inventory: z.array(InventoryItemSchema).optional(),
  history: pageOf(LedgerEntrySchema),
});
export type WalletResponse = z.infer<typeof WalletResponseSchema>;

export const SubscriptionStateSchema = z.enum(['NONE', 'TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'CANCELLED_PENDING_EXPIRY', 'EXPIRED', 'REFUNDED', 'REVOKED']);
export const EntitlementKeySchema = z.enum(['PLUS_DATE_SLOTS', 'PLUS_MAP', 'PLUS_HINTS', 'PLUS_PREMIUM_SPECIES', 'PLUS_WEEKEND_PET_XP', 'PLUS_MONTHLY_BENEFITS']);
export const EntitlementSourceSchema = z.enum(['STORE_SUBSCRIPTION', 'DERIVED_PARTNER', 'STAFF_GRANT', 'LOCAL_DEMO']);

export const SubscriptionMeResponseSchema = z.object({
  /** LIVE (production réelle), SANDBOX (store de test), LOCAL_DEMO (simulation locale étiquetée). */
  mode: IntegrationModeSchema,
  state: SubscriptionStateSchema,
  environment: z.enum(['PRODUCTION', 'SANDBOX', 'LOCAL_DEMO']).nullable(),
  productId: z.string().nullable(),
  store: z.string().nullable(),
  currentPeriodEndsAt: IsoDateTimeSchema.nullable(),
  willRenew: z.boolean(),
  lastReconciledAt: IsoDateTimeSchema.nullable(),
  dateSlots: z.number().int().positive(),
  entitlements: z.array(
    z.object({
      key: EntitlementKeySchema,
      source: EntitlementSourceSchema,
      endsAt: IsoDateTimeSchema.nullable(),
      /** Uniquement pour un droit dérivé : le partenaire emménagé titulaire. */
      derivedFromUserId: UuidSchema.nullable(),
    }),
  ),
});
export type SubscriptionMeResponse = z.infer<typeof SubscriptionMeResponseSchema>;

export const PurchasesSyncResponseSchema = z.object({
  subscription: SubscriptionMeResponseSchema,
  consumablesCredited: z.number().int().nonnegative(),
});
export type PurchasesSyncResponse = z.infer<typeof PurchasesSyncResponseSchema>;

/** Démo locale (BILLING_PROVIDER=local_demo, hors production) : action simulée côté « fournisseur ». */
export const LocalDemoPurchaseRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('SUBSCRIBE'), productId: z.string().min(1).max(100), trial: z.boolean().default(false) }),
  z.object({ action: z.literal('CANCEL') }),
  z.object({ action: z.literal('EXPIRE') }),
  z.object({ action: z.literal('BUY_COINS'), productId: z.string().min(1).max(100) }),
]);
export type LocalDemoPurchaseRequest = z.infer<typeof LocalDemoPurchaseRequestSchema>;

/** Produits store connus du serveur (sans prix : le prix vient du store). */
export const StoreProductsResponseSchema = z.object({
  mode: IntegrationModeSchema,
  products: z.array(z.object({ id: z.string(), kind: z.enum(['SUBSCRIPTION', 'CONSUMABLE_COINS']), coinsAmount: z.number().int().positive().nullable() })),
});
export type StoreProductsResponse = z.infer<typeof StoreProductsResponseSchema>;

export const UseStreakFreezeResponseSchema = z.object({
  protectedDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  remainingFreezes: z.number().int().nonnegative(),
  streakLength: z.number().int().nonnegative(),
  replayed: z.boolean(),
});
export type UseStreakFreezeResponse = z.infer<typeof UseStreakFreezeResponseSchema>;

export const WebhookAckSchema = z.object({ status: z.enum(['ACCEPTED', 'DUPLICATE']) });

/** Admin (branché par l'agent F) : correction motivée, lecture ledger/webhooks. */
export const AdminCoinCorrectionRequestSchema = z.object({
  targetUserId: UuidSchema,
  amount: z.number().int().min(-100_000).max(100_000).refine((n) => n !== 0, 'Montant non nul'),
  reason: z.string().trim().min(5).max(500),
});
export type AdminCoinCorrectionRequest = z.infer<typeof AdminCoinCorrectionRequestSchema>;

export const AdminWebhookEventSchema = z.object({
  id: UuidSchema,
  provider: z.string(),
  providerEventId: z.string(),
  environment: z.enum(['PRODUCTION', 'SANDBOX', 'LOCAL_DEMO']),
  eventType: z.string(),
  appUserId: z.string().nullable(),
  eventTimestamp: IsoDateTimeSchema,
  receivedAt: IsoDateTimeSchema,
  processedAt: IsoDateTimeSchema.nullable(),
  status: z.enum(['RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED']),
  attempts: z.number().int(),
  lastError: z.string().nullable(),
});
export type AdminWebhookEvent = z.infer<typeof AdminWebhookEventSchema>;
