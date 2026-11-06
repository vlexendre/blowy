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
  seat: z.object({ amountCents: AmountCentsSchema, currency: CurrencySchema, consumptionIncluded: z.literal(false), firstOutingFree: z.boolean() }),
  /** Blowy+ 9,99 €/mois : toutes les sorties incluses (1 par semaine, quota identique pour tous) + Duo illimité. */
  plus: z.object({ priceLabel: z.string().nullable(), includesAllOutings: z.boolean(), includedOutingsPerMonth: z.number().int().nonnegative(), duoUnlimited: z.boolean() }),
  provider: PaymentProviderSchema,
});
export type ProductsV5 = z.infer<typeof ProductsV5Schema>;

/** `POST /v1/subscriptions/plus/checkout` ; 501 `NOT_CONFIGURED`. */
export const PlusCheckoutResponseSchema = z.union([
  z.object({ provider: PaymentProviderSchema, clientSecret: z.string().min(1) }).strict(),
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
  /** 1 duo actif gratuit ; Blowy+ = duos illimités (`null`). */
  duo: z.object({ freeMaxActive: z.number().int().positive() }).optional(),
});
export type ProductsResponseV5 = z.infer<typeof ProductsResponseV5Schema>;

/** `GET /v1/me/allowances` : ce que la personne peut faire sans payer (jamais d'effet sur composition/priorité/votes). */
export const AllowancesViewSchema = z
  .object({
    /** 1ʳᵉ sortie offerte encore disponible. */
    firstOutingFree: z.boolean(),
    plus: z.object({ active: z.boolean(), includesAllOutings: z.boolean(), duoUnlimited: z.boolean() }).strict(),
    /** Duos actifs simultanés autorisés ; `null` = illimité (Blowy+). */
    duos: z.object({ maxActive: z.number().int().positive().nullable() }).strict(),
    /** Crédits de sortie utilisables (hors 1ʳᵉ offerte). */
    credits: z.number().int().nonnegative(),
    provider: PaymentProviderSchema.nullable(),
  })
  .strict();
export type AllowancesView = z.infer<typeof AllowancesViewSchema>;

/** Réponse du webhook Stripe (200) : `DUPLICATE` = événement déjà traité, aucun effet. */
export const StripeWebhookAckSchema = z.object({ status: z.enum(['ACCEPTED', 'DUPLICATE', 'IGNORED']) });
export type StripeWebhookAck = z.infer<typeof StripeWebhookAckSchema>;

/**
 * Écriture comptable interne « compensation lieu » (V5.3 C.11) : place non honorée après la confirmation
 * (veille 18 h) → prix de la place reversé au lieu si payée (`SEAT_PRICE`), 3 € versés par Blowy si offerte
 * (`FREE_SEAT`). Aucun paiement réel ; lecture admin (F).
 */
export const VenueCompensationEntrySchema = z
  .object({
    seatId: z.string().uuid(),
    outingId: z.string().uuid(),
    venueId: z.string().uuid(),
    amountCents: z.number().int(),
    currency: CurrencySchema,
    cause: z.enum(['NO_SHOW', 'LATE_CANCEL', 'REVERSAL']),
    basis: z.enum(['SEAT_PRICE', 'FREE_SEAT']),
    at: IsoDateTimeSchema,
  })
  .strict();
export type VenueCompensationEntry = z.infer<typeof VenueCompensationEntrySchema>;
