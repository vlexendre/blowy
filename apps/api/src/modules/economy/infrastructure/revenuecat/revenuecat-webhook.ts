import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { NormalizedWebhookEvent, WebhookAuthenticator } from '../../application/ports/billing-provider.port.js';
import type { BillingEnvironment } from '../../domain/index.js';
import { invalid } from '../../domain/errors.js';

/**
 * Authentification documentée par RevenueCat (vérifiée le 2026-11-01,
 * https://www.revenuecat.com/docs/integrations/webhooks) : une valeur de header `Authorization`
 * configurée dans le dashboard est envoyée telle quelle à chaque requête. On la compare en
 * TEMPS CONSTANT (digests SHA-256 de longueur fixe → pas de fuite de longueur) au secret
 * REVENUECAT_WEBHOOK_AUTH. (La signature HMAC optionnelle `X-RevenueCat-Webhook-Signature`
 * n'est pas activée dans cette version ; voir docs/economy/revenuecat.md.)
 */
export class AuthorizationHeaderAuthenticator implements WebhookAuthenticator {
  private readonly expected: Buffer;
  constructor(secret: string) {
    if (secret.length < 24) throw new Error('Secret webhook trop court');
    this.expected = createHash('sha256').update(secret, 'utf8').digest();
  }
  isAuthentic(header: string | undefined): boolean {
    if (typeof header !== 'string' || header.length === 0 || header.length > 1024) return false;
    const got = createHash('sha256').update(header, 'utf8').digest();
    return timingSafeEqual(got, this.expected);
  }
}

/** Aucun secret configuré : tout webhook est refusé (jamais d'acceptation silencieuse). */
export class RejectAllAuthenticator implements WebhookAuthenticator {
  isAuthentic(_header?: string): boolean {
    return false;
  }
}

const ms = z.number().int().nonnegative().nullable().optional();
const strArr = z.array(z.string()).nullable().optional();

/** Champs documentés (Event Types and Fields). Les champs inconnus sont tolérés (ajouts RC). */
export const RevenueCatWebhookSchema = z.object({
  api_version: z.string().optional(),
  event: z
    .object({
      id: z.string().min(1).max(200),
      type: z.string().min(1).max(64),
      event_timestamp_ms: z.number().int().nonnegative(),
      app_user_id: z.string().max(200).nullable().optional(),
      original_app_user_id: z.string().max(200).nullable().optional(),
      aliases: strArr,
      product_id: z.string().max(200).nullable().optional(),
      new_product_id: z.string().max(200).nullable().optional(),
      entitlement_ids: strArr,
      period_type: z.string().nullable().optional(),
      purchased_at_ms: ms,
      expiration_at_ms: ms,
      grace_period_expiration_at_ms: ms,
      environment: z.string().nullable().optional(),
      store: z.string().nullable().optional(),
      transaction_id: z.string().max(200).nullable().optional(),
      original_transaction_id: z.string().max(200).nullable().optional(),
      cancel_reason: z.string().nullable().optional(),
      expiration_reason: z.string().nullable().optional(),
      transferred_from: strArr,
      transferred_to: strArr,
    })
    .passthrough(),
});

const toDate = (v: number | null | undefined) => (typeof v === 'number' ? new Date(v) : null);
export const rcEnvironment = (env: string | null | undefined): BillingEnvironment => (env === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION');

export function parseRevenueCatWebhook(body: unknown): NormalizedWebhookEvent {
  const parsed = RevenueCatWebhookSchema.safeParse(body);
  if (!parsed.success) throw invalid('Webhook RevenueCat invalide.', { issues: parsed.error.issues.length });
  const e = parsed.data.event;
  const ids = [e.app_user_id, e.original_app_user_id, ...(e.aliases ?? [])].filter((x): x is string => typeof x === 'string' && x.length > 0);
  return {
    providerEventId: e.id,
    type: e.type,
    eventAt: new Date(e.event_timestamp_ms),
    environment: rcEnvironment(e.environment),
    appUserIds: [...new Set(ids)],
    productId: e.product_id ?? null,
    newProductId: e.new_product_id ?? null,
    entitlementIds: e.entitlement_ids ?? [],
    periodType: e.period_type ?? null,
    purchasedAt: toDate(e.purchased_at_ms),
    expiresAt: toDate(e.expiration_at_ms),
    gracePeriodExpiresAt: toDate(e.grace_period_expiration_at_ms),
    store: e.store ?? null,
    transactionId: e.transaction_id ?? null,
    originalTransactionId: e.original_transaction_id ?? null,
    cancelReason: e.cancel_reason ?? null,
    expirationReason: e.expiration_reason ?? null,
    transferredFrom: e.transferred_from ?? [],
    transferredTo: e.transferred_to ?? [],
  };
}
