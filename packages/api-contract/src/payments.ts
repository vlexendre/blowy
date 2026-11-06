/**
 * Contrats paiements V5 : crédits de sortie, produits, Blowy+ (Stripe hors IAP), webhook Stripe —
 * spec-v5 §6, §7.4, D-018–D-020. Propriétaire : G. Le serveur fixe toujours le montant ; aucun
 * produit ne modifie composition, visibilité, quota, priorité, score ou votes.
 */
import { z } from 'zod';
import { CREDIT_KINDS, ENTITLEMENT_KEYS_V5, PAYMENT_STATUSES } from '@blowy/domain';
import { AmountCentsSchema, CurrencySchema, IsoDateTimeSchema } from './core/common.js';
import { PaymentProviderSchema } from './outings.js';

export const CreditKindSchema = z.enum(CREDIT_KINDS);
export const PaymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const EntitlementKeyV5Schema = z.enum(ENTITLEMENT_KEYS_V5);

/** `GET /v1/outing-credits`. */
export const OutingCreditsViewSchema = z.object({
  available: z.array(z.object({ kind: CreditKindSchema, count: z.number().int().positive(), expiresAt: IsoDateTimeSchema.optional() }).strict()),
});
export type OutingCreditsView = z.infer<typeof OutingCreditsViewSchema>;

/** `GET /v1/purchases/products` (V5). Prix Blowy+ affiché depuis le fournisseur (`priceLabel`). */
export const ProductsV5Schema = z.object({
  /** V5.1 (H.23) : 4,99 € la place, consommation non incluse ; 1ʳᵉ sortie offerte. */
  seat: z.object({ amountCents: AmountCentsSchema, currency: CurrencySchema, consumptionIncluded: z.literal(false), firstOutingFree: z.boolean(), /** V5.5 : prix affichés TTC. */ taxBasis: z.literal('TTC').optional() }),
  /**
   * V5.4 (C.10) : Blowy+ 9,99 €/mois = abonnement aux SORTIES (toutes tes sorties, 1 par semaine, quota
   * identique pour tous), payé par Apple Pay / carte via Stripe Billing (`billing`). Le Duo est gratuit pour
   * tous : `duoUnlimited` vaut toujours `false`.
   */
  plus: z.object({ priceLabel: z.string().nullable(), includesAllOutings: z.boolean(), includedOutingsPerMonth: z.number().int().nonnegative(), duoUnlimited: z.boolean(), billing: z.enum(['STRIPE_BILLING', 'IN_APP_PURCHASE']).optional() }),
  provider: PaymentProviderSchema,
});
export type ProductsV5 = z.infer<typeof ProductsV5Schema>;

/** `POST /v1/subscriptions/plus/checkout` ; 501 `NOT_CONFIGURED`. */
/**
 * V5.4 (C.10) : Stripe Billing — `clientSecret` de la 1ʳᵉ facture (PaymentSheet, Apple Pay), `subscriptionId`
 * (`sub_…`) ; l'abonnement devient actif au webhook `customer.subscription.*` signé, jamais sur la foi du client.
 */
export const PlusCheckoutResponseSchema = z.union([
  z.object({ provider: PaymentProviderSchema, clientSecret: z.string().min(1), subscriptionId: z.string().min(1).optional() }).strict(),
  z.object({ provider: PaymentProviderSchema, checkoutUrl: z.string().url() }).strict(),
]);
export type PlusCheckoutResponse = z.infer<typeof PlusCheckoutResponseSchema>;

/** Droits V5 de `GET /v1/subscriptions/me`. */
export const EntitlementsV5Schema = z.array(z.object({ key: EntitlementKeyV5Schema, expiresAt: IsoDateTimeSchema.nullable() }));

/** En-tête signé du webhook Stripe (corps brut vérifié ; idempotent par `event.id`). */
export const STRIPE_SIGNATURE_HEADER = 'stripe-signature';

// ---------------------------------------------------------------------------------------------
// T3 (G) — ajouts rétrocompatibles (aucun champ existant modifié ni rendu obligatoire).
// ---------------------------------------------------------------------------------------------

/** Motifs métier (`detailsSafe.reason`) des échecs paiements V5. */
export const PAYMENT_FAILURE_REASONS = [
  /** 410 : boost, gels, XP×2, espèces premium, accessoires/pièces vendus (D-020). */
  'RETIRED_IN_V5',
  /** 501 : aucun fournisseur de paiement configuré (production sans Stripe). */
  'PAYMENTS_NOT_CONFIGURED',
  /** 501 : V5.3 C.10 — Blowy+ s'achète dans l'app (RevenueCat), pas par paiement web. */
  'PLUS_VIA_IN_APP_PURCHASE',
  /** 409 : Blowy+ déjà actif (pas de second abonnement). */
  'PLUS_ALREADY_ACTIVE',
  /** V5.4 : 503 — Stripe Billing non configuré (`STRIPE_PLUS_PRICE_ID` absent) ; jamais de démo en production. */
  'PLUS_UNAVAILABLE',
  /** V5.4 : 412 — résiliation demandée sans abonnement Stripe actif. */
  'PLUS_NOT_ACTIVE',
  /** 401 : signature `Stripe-Signature` absente, invalide ou hors tolérance (rien n'est enregistré). */
  'WEBHOOK_SIGNATURE_INVALID',
] as const;
export type PaymentFailureReason = (typeof PAYMENT_FAILURE_REASONS)[number];

/** Montants : centimes entiers (jamais de flottant), devise EUR. */
export const MoneySchema = z.object({ amountCents: AmountCentsSchema, currency: CurrencySchema }).strict();
export type Money = z.infer<typeof MoneySchema>;

/**
 * `GET /v1/purchases/products` (V5, compatible V4) : l'ancienne forme `{mode, products}` est conservée
 * (abonnements seulement — les packs de pièces ne sont plus vendus), la forme V5 est ajoutée à côté.
 */
export const ProductsResponseV5Schema = z.object({
  mode: z.enum(['LIVE', 'SANDBOX', 'LOCAL_DEMO']),
  products: z.array(z.object({ id: z.string(), kind: z.enum(['SUBSCRIPTION', 'CONSUMABLE_COINS']), coinsAmount: z.number().int().positive().nullable() })),
  seat: ProductsV5Schema.shape.seat,
  plus: ProductsV5Schema.shape.plus.extend({ monthlyPriceCents: AmountCentsSchema.optional(), currency: CurrencySchema.optional() }),
  provider: PaymentProviderSchema,
  /** V5.4 (C.11) : Duo gratuit pour tous, au plus `freeMaxActive` (3) duos actifs. */
  duo: z.object({ freeMaxActive: z.number().int().positive() }).optional(),
});
export type ProductsResponseV5 = z.infer<typeof ProductsResponseV5Schema>;

/** `GET /v1/me/allowances` : ce que la personne peut faire sans payer (jamais d'effet sur composition/priorité/votes). */
export const AllowancesViewSchema = z
  .object({
    /** 1ʳᵉ sortie offerte encore disponible. */
    firstOutingFree: z.boolean(),
    plus: z.object({ active: z.boolean(), includesAllOutings: z.boolean(), duoUnlimited: z.boolean() }).strict(),
    /** Duos actifs simultanés autorisés (V5.4 : 3 pour tous ; `null` n'est plus émis). */
    duos: z.object({ maxActive: z.number().int().positive().nullable() }).strict(),
    /** Crédits de sortie utilisables (hors 1ʳᵉ offerte). */
    credits: z.number().int().nonnegative(),
    provider: PaymentProviderSchema.nullable(),
  })
  .strict();
export type AllowancesView = z.infer<typeof AllowancesViewSchema>;

/**
 * V5.4 (C.10) : `POST /v1/subscriptions/plus/cancel` — résiliation EN APP (abonnement Stripe, hors store) :
 * fin à l'échéance (`cancel_at_period_end`) ; les places déjà confirmées restent incluses.
 */
export const PlusCancelResponseSchema = z.object({ state: z.enum(['CANCELLED_PENDING_EXPIRY', 'EXPIRED', 'NONE']), currentPeriodEndsAt: IsoDateTimeSchema.nullable() }).strict();
export type PlusCancelResponse = z.infer<typeof PlusCancelResponseSchema>;

/** Réponse du webhook Stripe (200) : `DUPLICATE` = événement déjà traité, aucun effet. */
export const StripeWebhookAckSchema = z.object({ status: z.enum(['ACCEPTED', 'DUPLICATE', 'IGNORED']) });
export type StripeWebhookAck = z.infer<typeof StripeWebhookAckSchema>;

/**
 * Écriture comptable interne « compensation lieu » (V5.3 C.11) : place non honorée après la confirmation
 * (veille 18 h) → prix de la place reversé au lieu si payée (`SEAT_PRICE`), 3 € versés par Blowy si offerte
 * (`FREE_SEAT`). Aucun paiement réel ; lecture admin (F).
 */
/** V5.6 (E22) : `SAFETY` = sortie pour raison de sécurité après la confirmation (3 € HT par Blowy). */
export const VENUE_COMPENSATION_CAUSES = ['NO_SHOW', 'LATE_CANCEL', 'EMERGENCY', 'SAFETY', 'BLOWY_CANCELLED', 'REVERSAL'] as const;
export type VenueCompensationCause = (typeof VENUE_COMPENSATION_CAUSES)[number];
/** `BLOWY_CANCELLED` : 3 € par place réservée (V5.4 C.12, `[T] venues.compensationBlowyCancelSeatCents`). */
export const VENUE_COMPENSATION_BASES = ['SEAT_PRICE', 'FREE_SEAT', 'BLOWY_CANCELLED', 'SAFETY'] as const;
export type VenueCompensationBasis = (typeof VENUE_COMPENSATION_BASES)[number];
export const VenueCompensationEntrySchema = z
  .object({
    seatId: z.string().uuid(),
    outingId: z.string().uuid(),
    venueId: z.string().uuid(),
    amountCents: z.number().int(),
    currency: CurrencySchema,
    /** V5.4 : `EMERGENCY` (« imprévu », compensé comme une absence) ; `BLOWY_CANCELLED` (Blowy annule une sortie confirmée). */
    cause: z.enum(VENUE_COMPENSATION_CAUSES),
    basis: z.enum(VENUE_COMPENSATION_BASES),
    at: IsoDateTimeSchema,
  })
  .strict();
export type VenueCompensationEntry = z.infer<typeof VenueCompensationEntrySchema>;
