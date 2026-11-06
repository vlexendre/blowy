/**
 * Paiements V5 (T3) — unitaires : signature Stripe (formule HMAC documentée), encodage, adaptateur
 * Stripe sur HTTP simulé (aucun appel réel), configuration (démo refusée en production), règles pures
 * (financement, crédits, remboursements, compensation lieu V5.3), limiteur (webhooks exclus).
 */
import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../shared/domain/errors.js';
import { MemoryRateLimiter, rateLimitMiddleware } from '../../../shared/interface/rate-limit.js';
import { availableLots, cents, chooseFunding, refundOutcome, venueCompensationAmount, venueCompensationCause, type CreditMovement } from '../domain/index.js';
import { loadPaymentsConfig } from '../infrastructure/config/payments-config.js';
import { journalIdOf } from '../infrastructure/prisma/prisma-economy-journal.js';
import { encodeForm } from '../infrastructure/stripe/stripe-client.js';
import { StripePaymentProvider } from '../infrastructure/stripe/stripe-payment.provider.js';
import { computeStripeSignature, signStripePayload, verifyStripeSignature } from '../infrastructure/stripe/stripe-signature.js';
import { StripeWebhookVerifier } from '../infrastructure/stripe/stripe-webhook-verifier.js';

const SECRET = 'whsec_unit_test_secret_0123456789';
const KEY = 'sk_test_unitTestKey0123456789';

describe('signature Stripe (schéma v1)', () => {
  const body = Buffer.from('{"id":"evt_1","object":"event"}');
  const t = 1_763_000_000;
  it('vecteur : HMAC-SHA256(secret, "t.corps") en hex — même formule que la documentation Stripe', () => {
    const expected = createHmac('sha256', SECRET).update(`${t}.${body.toString('utf8')}`).digest('hex');
    expect(computeStripeSignature(SECRET, t, body)).toBe(expected);
    expect(signStripePayload(SECRET, t, body)).toBe(`t=${t},v1=${expected}`);
  });
  it('accepte une signature valide (et une parmi plusieurs v1 : rotation du secret)', () => {
    const good = computeStripeSignature(SECRET, t, body);
    expect(verifyStripeSignature({ secret: SECRET, rawBody: body, header: `t=${t},v1=${good}`, nowMs: t * 1000 }).ok).toBe(true);
    expect(verifyStripeSignature({ secret: SECRET, rawBody: body, header: `t=${t},v1=${'0'.repeat(64)},v1=${good},v0=abc`, nowMs: t * 1000 + 10_000 }).ok).toBe(true);
  });
  it('refuse : corps modifié, mauvais secret, en-tête absent/malformé, sans v1, hors tolérance (300 s)', () => {
    const h = signStripePayload(SECRET, t, body);
    const r = (o: Partial<Parameters<typeof verifyStripeSignature>[0]>) => verifyStripeSignature({ secret: SECRET, rawBody: body, header: h, nowMs: t * 1000, ...o });
    expect(r({ rawBody: Buffer.from('{"id":"evt_2"}') })).toEqual({ ok: false, reason: 'SIGNATURE_MISMATCH' });
    expect(r({ secret: 'whsec_other_secret_xxxxxxxx' })).toEqual({ ok: false, reason: 'SIGNATURE_MISMATCH' });
    expect(r({ header: undefined })).toEqual({ ok: false, reason: 'MISSING_HEADER' });
    expect(r({ header: 'garbage' })).toEqual({ ok: false, reason: 'MALFORMED_HEADER' });
    expect(r({ header: `t=${t},v0=abc` })).toEqual({ ok: false, reason: 'NO_V1_SIGNATURE' });
    expect(r({ nowMs: (t + 301) * 1000 })).toEqual({ ok: false, reason: 'TIMESTAMP_OUT_OF_TOLERANCE' });
    expect(r({ nowMs: (t - 301) * 1000 })).toEqual({ ok: false, reason: 'TIMESTAMP_OUT_OF_TOLERANCE' });
  });
  it('vérificateur : 401 sans enregistrement si invalide ; client_secret expurgé ; mode test refusé en production', () => {
    const evt = { id: 'evt_9', type: 'payment_intent.succeeded', created: t, livemode: false, data: { object: { id: 'pi_1', client_secret: 'pi_1_secret_zzz', metadata: { seatId: 's' } } } };
    const raw = Buffer.from(JSON.stringify(evt));
    const v = new StripeWebhookVerifier(SECRET, 300, false);
    const ok = v.verify(raw, signStripePayload(SECRET, t, raw), new Date(t * 1000));
    expect(ok.id).toBe('evt_9');
    expect(JSON.stringify(ok.redacted)).not.toContain('pi_1_secret_zzz');
    expect(() => v.verify(raw, 't=1,v1=00', new Date(t * 1000))).toThrow(AppError);
    expect(() => new StripeWebhookVerifier(null, 300, false).verify(raw, signStripePayload(SECRET, t, raw), new Date(t * 1000))).toThrow(/non authentifié/);
    expect(() => new StripeWebhookVerifier(SECRET, 300, true).verify(raw, signStripePayload(SECRET, t, raw), new Date(t * 1000))).toThrow(/test/);
  });
});

describe('adaptateur Stripe (HTTP simulé)', () => {
  const cfg = { secretKey: KEY, baseUrl: 'https://stripe.mock', apiVersion: '2025-03-31.basil', timeoutMs: 1000, livemode: false };
  it('encodage formulaire imbriqué', () => {
    expect(decodeURIComponent(encodeForm({ a: 1, m: { seatId: 'x' }, l: [{ p: 'q' }], n: null }))).toBe('a=1&m[seatId]=x&l[0][p]=q');
  });
  it('PaymentIntent : montant serveur en centimes, EUR, Apple Pay via automatic_payment_methods, Idempotency-Key', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'pi_123', client_secret: 'pi_123_secret_abc', status: 'requires_payment_method' }), { status: 200 }));
    const p = new StripePaymentProvider(cfg, fetchMock as unknown as typeof fetch);
    const r = await p.createSeatIntent({ seatId: 'seat-1', userId: 'user-1', amountCents: 499, currency: 'EUR', idempotencyKey: 'seat:seat-1' });
    expect(r).toEqual({ providerPaymentId: 'pi_123', clientSecret: 'pi_123_secret_abc' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://stripe.mock/v1/payment_intents');
    const h = init.headers as Record<string, string>;
    expect(h.Authorization).toBe(`Bearer ${KEY}`);
    expect(h['Idempotency-Key']).toBe('seat:seat-1');
    expect(h['Stripe-Version']).toBe('2025-03-31.basil');
    const body = new URLSearchParams(String(init.body));
    expect(body.get('amount')).toBe('499');
    expect(body.get('currency')).toBe('eur');
    expect(body.get('automatic_payment_methods[enabled]')).toBe('true');
    expect(body.get('metadata[seatId]')).toBe('seat-1');
    expect(body.get('metadata[purpose]')).toBe('SEAT');
  });
  it('erreurs : 5xx → PROVIDER_UNAVAILABLE retryable ; 4xx → PROVIDER_REJECTED ; jamais la clé dans l’erreur', async () => {
    const r500 = new StripePaymentProvider(cfg, (async () => new Response('{}', { status: 503 })) as unknown as typeof fetch);
    const e1 = await r500.refund({ providerPaymentId: 'pi_1', seatId: 's', amountCents: 499, idempotencyKey: 'refund:s' }).catch((e: AppError) => e);
    expect(e1).toMatchObject({ code: 'PROVIDER_UNAVAILABLE', retryable: true });
    const r400 = new StripePaymentProvider(cfg, (async () => new Response(JSON.stringify({ error: { type: 'invalid_request_error', code: 'charge_already_refunded', message: `key ${KEY}` } }), { status: 400, headers: { 'request-id': 'req_1' } })) as unknown as typeof fetch);
    const e2 = (await r400.refund({ providerPaymentId: 'pi_1', seatId: 's', amountCents: 499, idempotencyKey: 'refund:s' }).catch((e: AppError) => e)) as AppError;
    expect(e2.detailsSafe).toMatchObject({ reason: 'PROVIDER_REJECTED', stripeCode: 'charge_already_refunded', requestId: 'req_1' });
    expect(JSON.stringify({ m: e2.message, d: e2.detailsSafe })).not.toContain(KEY);
    const down = new StripePaymentProvider(cfg, (async () => {
      throw new Error(`ECONNRESET ${KEY}`);
    }) as unknown as typeof fetch);
    const e3 = (await down.refund({ providerPaymentId: 'pi_1', seatId: 's', amountCents: 499, idempotencyKey: 'k' }).catch((e: AppError) => e)) as AppError;
    expect(e3.code).toBe('PROVIDER_UNAVAILABLE');
    expect(e3.message).not.toContain(KEY);
  });
  it('remboursement : statut Stripe succeeded → SUCCEEDED, sinon PENDING', async () => {
    const ok = new StripePaymentProvider(cfg, (async () => new Response(JSON.stringify({ id: 're_1', status: 'succeeded' }))) as unknown as typeof fetch);
    expect(await ok.refund({ providerPaymentId: 'pi_1', seatId: 's', amountCents: 499, idempotencyKey: 'refund:s' })).toEqual({ refundId: 're_1', status: 'SUCCEEDED' });
    const pending = new StripePaymentProvider(cfg, (async () => new Response(JSON.stringify({ id: 're_2', status: 'pending' }))) as unknown as typeof fetch);
    expect((await pending.refund({ providerPaymentId: 'pi_1', seatId: 's', amountCents: 499, idempotencyKey: 'refund:s' })).status).toBe('PENDING');
  });
});

describe('configuration paiements', () => {
  it('LOCAL_DEMO refusé en production ; production sans clé = aucun fournisseur (jamais de démo)', () => {
    expect(() => loadPaymentsConfig({ BLOWY_ENV: 'production', PAYMENT_PROVIDER: 'local_demo' })).toThrow(/interdit en production/);
    expect(loadPaymentsConfig({ BLOWY_ENV: 'production' }).provider).toBe('none');
    expect(loadPaymentsConfig({ BLOWY_ENV: 'local' }).provider).toBe('local_demo');
  });
  it('Stripe : secrets requis, clé test refusée en production, clé live refusée hors production, secret jamais dans le message', () => {
    expect(() => loadPaymentsConfig({ BLOWY_ENV: 'test', PAYMENT_PROVIDER: 'stripe', STRIPE_SECRET_KEY: KEY })).toThrow(/STRIPE_WEBHOOK_SECRET/);
    expect(() => loadPaymentsConfig({ BLOWY_ENV: 'production', STRIPE_SECRET_KEY: KEY, STRIPE_WEBHOOK_SECRET: SECRET })).toThrow(/clé Stripe de test/);
    expect(() => loadPaymentsConfig({ BLOWY_ENV: 'staging', STRIPE_SECRET_KEY: 'sk_live_abcdefgh12345678', STRIPE_WEBHOOK_SECRET: SECRET })).toThrow(/LIVE refusée/);
    const c = loadPaymentsConfig({ BLOWY_ENV: 'test', STRIPE_SECRET_KEY: KEY, STRIPE_WEBHOOK_SECRET: SECRET });
    expect(c.provider === 'stripe' && c.stripe.livemode).toBe(false);
    try {
      loadPaymentsConfig({ BLOWY_ENV: 'test', STRIPE_SECRET_KEY: 'not-a-key-but-secret-value', STRIPE_WEBHOOK_SECRET: SECRET });
    } catch (e) {
      expect((e as Error).message).not.toContain('not-a-key-but-secret-value');
      expect((e as Error).message).toContain('STRIPE_SECRET_KEY');
    }
  });
});

describe('règles pures', () => {
  const now = new Date('2026-11-19T12:00:00Z');
  const lot = (k: string, exp: string | null, at = '2026-11-01T00:00:00Z'): CreditMovement => ({ kind: 'CREDIT_GRANT', lotKey: k, creditKind: 'REFUND_CREDIT', at: new Date(at), expiresAt: exp ? new Date(exp) : null });
  it('montants en centimes entiers', () => {
    expect(cents(499)).toBe(499);
    expect(() => cents(4.99)).toThrow();
    expect(() => cents(0)).toThrow();
  });
  it('financement : 1ʳᵉ offerte → Blowy+ → crédit → paiement ; PAY = payer explicitement', () => {
    const lots = availableLots([lot('a', '2027-01-01T00:00:00Z')], now);
    expect(chooseFunding({ mode: 'AUTO', freeFirstAvailable: true, plusActive: true, plusIncludesAllOutings: true, lots }).kind).toBe('FREE_FIRST');
    expect(chooseFunding({ mode: 'AUTO', freeFirstAvailable: false, plusActive: true, plusIncludesAllOutings: true, lots }).kind).toBe('PLUS_INCLUDED');
    expect(chooseFunding({ mode: 'AUTO', freeFirstAvailable: false, plusActive: false, plusIncludesAllOutings: true, lots }).kind).toBe('CREDIT');
    expect(chooseFunding({ mode: 'AUTO', freeFirstAvailable: false, plusActive: false, plusIncludesAllOutings: true, lots: [] }).kind).toBe('PAY');
    expect(chooseFunding({ mode: 'PAY', freeFirstAvailable: true, plusActive: true, plusIncludesAllOutings: true, lots }).kind).toBe('PAY');
  });
  it('crédits : échéance la plus proche d’abord, échus et consommés exclus (sans job)', () => {
    const moves: CreditMovement[] = [lot('late', '2027-02-01T00:00:00Z'), lot('soon', '2026-12-01T00:00:00Z'), lot('gone', '2026-11-10T00:00:00Z'), lot('used', null), { kind: 'CREDIT_CONSUME', lotKey: 'used', at: now }];
    expect(availableLots(moves, now).map((l) => l.lotKey)).toEqual(['soon', 'late']);
  });
  it('remboursements (§6.4, D-019) : carte si Blowy annule ; crédit 90 j si annulation perso payée ; rien pour une 1ʳᵉ offerte', () => {
    expect(refundOutcome('PAID', 'OUTING_CANCELLED', { plusActive: false })).toBe('CARD');
    expect(refundOutcome('PAID', 'LATE_PAYMENT', { plusActive: false })).toBe('CARD');
    expect(refundOutcome('PAID', 'SAFETY_EXIT', { plusActive: false })).toBe('CARD');
    expect(refundOutcome('PAID', 'USER_EARLY', { plusActive: false })).toBe('REFUND_CREDIT');
    expect(refundOutcome('CREDIT', 'OUTING_CANCELLED', { plusActive: false })).toBe('REFUND_CREDIT');
    expect(refundOutcome('PLUS_INCLUDED', 'OUTING_CANCELLED', { plusActive: true })).toBe('NONE');
    expect(refundOutcome('PLUS_INCLUDED', 'OUTING_CANCELLED', { plusActive: false })).toBe('REFUND_CREDIT');
    expect(refundOutcome('FREE_FIRST', 'OUTING_CANCELLED', { plusActive: false })).toBe('NONE');
  });
  it('compensation lieu (V5.3 C.11) : prix de la place si payée, 3 € si offerte ; rien si la sortie n’a pas eu lieu', () => {
    const p = { seatPriceCents: 499, venueCompensationFreeSeatCents: 300 };
    expect(venueCompensationAmount('PAID', 499, p)).toEqual({ amountCents: 499, basis: 'SEAT_PRICE' });
    expect(venueCompensationAmount('CREDIT', null, p)).toEqual({ amountCents: 499, basis: 'SEAT_PRICE' });
    expect(venueCompensationAmount('FREE_FIRST', null, p)).toEqual({ amountCents: 300, basis: 'FREE_SEAT' });
    expect(venueCompensationCause({ attended: false, outingStatus: 'DONE' })).toBe('NO_SHOW');
    expect(venueCompensationCause({ cancelKind: 'LATE', outingStatus: 'CONFIRMED' })).toBe('LATE_CANCEL');
    expect(venueCompensationCause({ cancelKind: 'EARLY', outingStatus: 'CONFIRMED' })).toBeNull();
    expect(venueCompensationCause({ cancelKind: 'LATE', outingStatus: 'CANCELLED' })).toBeNull();
  });
  it('journal : identifiant déterministe par clé (unicité en base = idempotence)', () => {
    expect(journalIdOf('pay:succeeded:pi_1')).toBe(journalIdOf('pay:succeeded:pi_1'));
    expect(journalIdOf('pay:succeeded:pi_1')).not.toBe(journalIdOf('pay:succeeded:pi_2'));
    expect(journalIdOf('x')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('limiteur', () => {
  it('le webhook Stripe est exclu du limiteur par IP', async () => {
    const mw = rateLimitMiddleware(new MemoryRateLimiter({ now: () => new Date() }), 0);
    const next = vi.fn();
    await mw({ path: '/v1/webhooks/stripe', method: 'POST', ip: '1.2.3.4' } as never, {} as never, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
