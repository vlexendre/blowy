/**
 * Faux serveur HTTP Stripe pour les tests d'intégration et les parcours (AUCUN appel réel) :
 * `POST /v1/payment_intents`, `POST /v1/refunds`, rejeu par `Idempotency-Key` (même réponse, comme
 * Stripe), journal des requêtes. Fabrique d'événements webhook signés avec la formule HMAC documentée.
 */
import { createServer, type Server } from 'node:http';
import { signStripePayload } from '../infrastructure/stripe/stripe-signature.js';

export const STRIPE_TEST_KEY = 'sk_test_blowyMock0123456789';
export const STRIPE_TEST_WEBHOOK_SECRET = 'whsec_blowyMockWebhook0123456789';
/** V5.4 (C.10) : prix Stripe Billing de Blowy+ (simulé). */
export const STRIPE_TEST_PLUS_PRICE = 'price_blowyPlusMock';

export interface MockCall {
  path: string;
  idempotencyKey: string | null;
  authorization: string | null;
  params: URLSearchParams;
}

export class StripeMock {
  readonly calls: MockCall[] = [];
  private readonly byKey = new Map<string, unknown>();
  private server: Server | null = null;
  private n = 0;
  port = 0;
  /** Statut renvoyé par /v1/refunds (`succeeded` par défaut) ou code HTTP d'erreur forcé. */
  refundStatus: 'succeeded' | 'pending' | 503 = 'succeeded';
  /** PaymentIntents créés : id → métadonnées. */
  readonly intents = new Map<string, { amount: number; currency: string; metadata: Record<string, string> }>();
  /** V5.4 (C.10) : abonnements Stripe Billing créés (id → client, prix, métadonnées, résiliation programmée). */
  readonly subscriptions = new Map<string, { customer: string; price: string; metadata: Record<string, string>; cancelAtPeriodEnd: boolean }>();

  async start(): Promise<this> {
    this.server = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const params = new URLSearchParams(body);
        const key = (req.headers['idempotency-key'] as string | undefined) ?? null;
        this.calls.push({ path: req.url ?? '', idempotencyKey: key, authorization: (req.headers.authorization as string | undefined) ?? null, params });
        const send = (status: number, json: unknown) => {
          res.writeHead(status, { 'content-type': 'application/json', 'request-id': `req_${this.calls.length}` });
          res.end(JSON.stringify(json));
        };
        if (req.headers.authorization !== `Bearer ${STRIPE_TEST_KEY}`) return send(401, { error: { type: 'invalid_request_error', code: 'api_key_invalid' } });
        const cacheKey = `${req.url}|${key}`;
        if (key && this.byKey.has(cacheKey)) return send(200, this.byKey.get(cacheKey));
        let out: unknown;
        if (req.url === '/v1/payment_intents') {
          const id = `pi_mock_${++this.n}`;
          const metadata: Record<string, string> = {};
          for (const [k, v] of params) if (k.startsWith('metadata[')) metadata[k.slice(9, -1)] = v;
          this.intents.set(id, { amount: Number(params.get('amount')), currency: params.get('currency') ?? '', metadata });
          out = { id, object: 'payment_intent', client_secret: `${id}_secret_mock`, status: 'requires_payment_method', amount: Number(params.get('amount')) };
        } else if (req.url === '/v1/customers') {
          out = { id: `cus_mock_${++this.n}`, object: 'customer' };
        } else if (req.url === '/v1/subscriptions') {
          const id = `sub_mock_${++this.n}`;
          const metadata: Record<string, string> = {};
          for (const [k, v] of params) if (k.startsWith('metadata[')) metadata[k.slice(9, -1)] = v;
          this.subscriptions.set(id, { customer: params.get('customer') ?? '', price: params.get('items[0][price]') ?? '', metadata, cancelAtPeriodEnd: false });
          out = { id, object: 'subscription', status: 'incomplete', latest_invoice: { id: `in_mock_${this.n}`, confirmation_secret: { client_secret: `pi_inv_${this.n}_secret_mock` } } };
        } else if (req.url?.startsWith('/v1/subscriptions/')) {
          const sub = this.subscriptions.get(decodeURIComponent(req.url.slice('/v1/subscriptions/'.length)));
          if (!sub) return send(404, { error: { type: 'invalid_request_error', code: 'resource_missing' } });
          if (params.get('cancel_at_period_end') === 'true') sub.cancelAtPeriodEnd = true;
          out = { id: req.url.slice('/v1/subscriptions/'.length), object: 'subscription', status: 'active', cancel_at_period_end: sub.cancelAtPeriodEnd };
        } else if (req.url === '/v1/refunds') {
          if (this.refundStatus === 503) return send(503, { error: { type: 'api_error' } });
          out = { id: `re_mock_${++this.n}`, object: 'refund', status: this.refundStatus, payment_intent: params.get('payment_intent') };
        } else return send(404, { error: { type: 'invalid_request_error', code: 'resource_missing' } });
        if (key) this.byKey.set(cacheKey, out);
        send(200, out);
      });
    });
    await new Promise<void>((r) => this.server!.listen(0, '127.0.0.1', () => r()));
    this.port = (this.server.address() as { port: number }).port;
    return this;
  }

  get baseUrl() {
    return `http://127.0.0.1:${this.port}`;
  }

  env(): Record<string, string> {
    return { PAYMENT_PROVIDER: 'stripe', STRIPE_SECRET_KEY: STRIPE_TEST_KEY, STRIPE_WEBHOOK_SECRET: STRIPE_TEST_WEBHOOK_SECRET, STRIPE_API_BASE_URL: this.baseUrl, STRIPE_PLUS_PRICE_ID: STRIPE_TEST_PLUS_PRICE };
  }

  calledOn(path: string) {
    return this.calls.filter((c) => c.path === path);
  }

  /** Événement `payment_intent.succeeded` signé pour un PaymentIntent créé par le mock. */
  succeeded(piId: string, at: Date, eventId = `evt_${piId}_ok`) {
    const pi = this.intents.get(piId);
    if (!pi) throw new Error(`PaymentIntent inconnu : ${piId}`);
    return signedEvent({ id: eventId, type: 'payment_intent.succeeded', at, object: { id: piId, object: 'payment_intent', amount: pi.amount, amount_received: pi.amount, currency: pi.currency, status: 'succeeded', client_secret: `${piId}_secret_mock`, metadata: pi.metadata } });
  }

  /** V5.4 (C.10) : événement `customer.subscription.*` signé pour un abonnement créé par le mock. */
  subscriptionEvent(subId: string, type: 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted', status: string, at: Date, periodEnd: Date, eventId = `evt_${subId}_${type}_${status}_${at.getTime()}`) {
    const sub = this.subscriptions.get(subId);
    if (!sub) throw new Error(`abonnement inconnu : ${subId}`);
    return signedEvent({
      id: eventId,
      type,
      at,
      object: { id: subId, object: 'subscription', customer: sub.customer, status, cancel_at_period_end: sub.cancelAtPeriodEnd, metadata: sub.metadata, items: { data: [{ current_period_end: Math.floor(periodEnd.getTime() / 1000), price: { id: sub.price } }] } },
    });
  }

  async close() {
    await new Promise<void>((r) => (this.server ? this.server.close(() => r()) : r()));
  }
}

/** Corps brut + en-tête `Stripe-Signature` (même formule que Stripe). */
export function signedEvent(i: { id: string; type: string; at: Date; object: Record<string, unknown>; livemode?: boolean; secret?: string }) {
  const created = Math.floor(i.at.getTime() / 1000);
  const body = JSON.stringify({ id: i.id, object: 'event', type: i.type, created, livemode: i.livemode ?? false, api_version: '2025-03-31.basil', data: { object: i.object } });
  return { body, signature: signStripePayload(i.secret ?? STRIPE_TEST_WEBHOOK_SECRET, created, body) };
}

/** POST du webhook signé vers l'API (corps brut exact). */
export async function postWebhook(baseUrl: string, e: { body: string; signature: string }) {
  const r = await fetch(`${baseUrl}/v1/webhooks/stripe`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': e.signature }, body: e.body });
  return { status: r.status, body: (await r.json().catch(() => null)) as { status?: string; code?: string; detailsSafe?: { reason?: string } } | null };
}
