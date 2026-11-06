import { z } from 'zod';
import type { BillingProvider } from '../../application/ports/billing-provider.port.js';
import type { BillingEnvironment, ProviderCustomerSnapshot } from '../../domain/index.js';
import { providerUnavailable } from '../../domain/errors.js';

/**
 * Adaptateur RÉEL RevenueCat (REST v1).
 * GET {base}/subscribers/{app_user_id} avec `Authorization: Bearer <clé secrète>` — doc
 * https://www.revenuecat.com/docs/api-v1/customers (« Get or create a customer ») et
 * Customer Info Model. Pas de header X-Platform (lecture informative, cf. doc).
 * La clé secrète ne quitte jamais le serveur ; elle n'est jamais journalisée.
 */
const iso = z.string().nullable().optional();
const SubscriberSchema = z.object({
  request_date_ms: z.number().optional(),
  subscriber: z.object({
    original_app_user_id: z.string().optional(),
    entitlements: z
      .record(z.string(), z.object({ expires_date: iso, grace_period_expires_date: iso, product_identifier: z.string(), purchase_date: iso }).passthrough())
      .default({}),
    subscriptions: z
      .record(
        z.string(),
        z
          .object({
            expires_date: iso,
            purchase_date: iso,
            period_type: z.string().nullable().optional(),
            store: z.string().nullable().optional(),
            is_sandbox: z.boolean().nullable().optional(),
            unsubscribe_detected_at: iso,
            billing_issues_detected_at: iso,
            grace_period_expires_date: iso,
            refunded_at: iso,
            store_transaction_id: z.string().nullable().optional(),
          })
          .passthrough(),
      )
      .default({}),
    non_subscriptions: z
      .record(
        z.string(),
        z.array(
          z
            .object({
              id: z.string().optional(),
              purchase_date: iso,
              store: z.string().nullable().optional(),
              is_sandbox: z.boolean().nullable().optional(),
              store_transaction_id: z.string().nullable().optional(),
            })
            .passthrough(),
        ),
      )
      .default({}),
  }),
});

const d = (v: string | null | undefined) => (v ? new Date(v) : null);
const env = (sandbox: boolean | null | undefined): BillingEnvironment => (sandbox ? 'SANDBOX' : 'PRODUCTION');

export function mapSubscriber(appUserId: string, body: unknown, fetchedAt: Date): ProviderCustomerSnapshot {
  const s = SubscriberSchema.parse(body).subscriber;
  return {
    appUserId,
    fetchedAt,
    entitlements: Object.entries(s.entitlements).map(([entitlementId, e]) => ({
      entitlementId,
      productId: e.product_identifier,
      expiresAt: d(e.expires_date),
      gracePeriodExpiresAt: d(e.grace_period_expires_date),
    })),
    subscriptions: Object.entries(s.subscriptions).map(([productId, x]) => ({
      productId,
      store: x.store ?? 'UNKNOWN',
      environment: env(x.is_sandbox),
      periodType: x.period_type ?? null,
      purchasedAt: d(x.purchase_date),
      expiresAt: d(x.expires_date),
      gracePeriodExpiresAt: d(x.grace_period_expires_date),
      unsubscribeDetectedAt: d(x.unsubscribe_detected_at),
      billingIssuesDetectedAt: d(x.billing_issues_detected_at),
      refundedAt: d(x.refunded_at),
      storeTransactionId: x.store_transaction_id ?? null,
    })),
    consumables: Object.entries(s.non_subscriptions).flatMap(([productId, list]) =>
      list.map((x) => ({
        productId,
        environment: env(x.is_sandbox),
        store: x.store ?? 'UNKNOWN',
        // Clé de crédit = identifiant de transaction STORE (identique au `transaction_id` du webhook).
        // Si RevenueCat ne le renvoie pas, l'achat n'est PAS crédité par la réconciliation : le webhook
        // NON_RENEWING_PURCHASE (qui le porte) reste la seule voie de crédit → jamais de double crédit.
        storeTransactionId: x.store_transaction_id ?? null,
        purchasedAt: d(x.purchase_date) ?? fetchedAt,
      })),
    ),
  };
}

export class RevenueCatBillingProvider implements BillingProvider {
  readonly kind = 'REVENUECAT' as const;
  readonly mode;
  readonly acceptedEnvironments: ReadonlySet<BillingEnvironment>;

  constructor(
    private readonly cfg: { secretApiKey: string; baseUrl: string; acceptSandbox: boolean; timeoutMs: number; isProduction: boolean },
    private readonly fetchImpl: typeof fetch,
    private readonly now: () => Date,
  ) {
    this.acceptedEnvironments = new Set<BillingEnvironment>(cfg.acceptSandbox ? ['PRODUCTION', 'SANDBOX'] : ['PRODUCTION']);
    this.mode = cfg.isProduction ? ('LIVE' as const) : ('SANDBOX' as const);
  }

  async fetchCustomer(appUserId: string): Promise<ProviderCustomerSnapshot> {
    const url = `${this.cfg.baseUrl.replace(/\/$/, '')}/subscribers/${encodeURIComponent(appUserId)}`;
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.cfg.secretApiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(this.cfg.timeoutMs),
      });
    } catch {
      throw providerUnavailable('revenuecat');
    }
    if (!res.ok) throw providerUnavailable('revenuecat');
    return mapSubscriber(appUserId, await res.json(), this.now());
  }
}
