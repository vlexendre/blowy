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
