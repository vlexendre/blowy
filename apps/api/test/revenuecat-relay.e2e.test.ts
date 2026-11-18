/**
 * Relais des notifications Apple vers RevenueCat (docs/BLOWY-PLUS.md §6) : avec l'adaptateur mémoire, la notification est
 * relayée telle que reçue après notre traitement quand l'URL est posée, jamais sinon ; une panne du relais ne change
 * ni notre traitement ni la réponse à Apple. Puis l'adaptateur HTTP réel avec un `fetch` imité (délai, nouvel essai,
 * jamais d'exception, journal sans contenu) et la validation de la variable.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env';
import { memoryJws } from '../src/modules/billing/infrastructure/memory-billing';
import { DisabledAppleNotificationRelay, HttpAppleNotificationRelay, MemoryAppleNotificationRelay } from '../src/modules/billing/infrastructure/revenuecat-relay';
import type { AppleNotificationRelay } from '../src/modules/billing/ports';
import { APPLE_NOTIFICATION_RELAY } from '../src/modules/billing/tokens';
import { type TestWorld, onboardBody, startWorld } from './helpers';

const RC_URL = 'https://api.revenuecat.com/v1/incoming-webhooks/apple-server-to-server-notification/appXXXX';
const DAY = 86_400_000;

/** Corps tel qu'Apple l'envoie (une seule clé `signedPayload`), écrit à la main : il doit arriver octet pour octet. */
const appleBody = (w: TestWorld, userId: string, otid: string, environment: 'Sandbox' | 'Production' = 'Sandbox'): string => {
  const now = w.clock.now().getTime();
  const tx = memoryJws({
    transactionId: otid,
    originalTransactionId: otid,
    bundleId: 'app.blowy',
    productId: 'app.blowy.plus.yearly',
    purchaseDate: now,
    expiresDate: now + 7 * DAY,
    signedDate: now,
    environment,
    offerType: 1,
    offerDiscountType: 'FREE_TRIAL',
    type: 'Auto-Renewable Subscription',
    appAccountToken: userId,
  });
  const signedPayload = memoryJws({
    notificationType: 'SUBSCRIBED',
    subtype: 'INITIAL_BUY',
    notificationUUID: randomUUID(),
    signedDate: now,
    data: { bundleId: 'app.blowy', environment, status: 1, signedTransactionInfo: tx },
  });
  return `{ "signedPayload" : "${signedPayload}" }`;
};

const post = (w: TestWorld, body: string) =>
  fetch(`${w.baseUrl}/v1/plus/apple/notifications`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });

describe('relais RevenueCat : URL posée', () => {
  let w: TestWorld;
  let relay: MemoryAppleNotificationRelay;

  beforeAll(async () => {
    w = await startWorld({ REVENUECAT_APPLE_NOTIFICATIONS_URL: RC_URL });
    relay = w.app.get<AppleNotificationRelay>(APPLE_NOTIFICATION_RELAY) as MemoryAppleNotificationRelay;
  });
  afterAll(() => w.close());

  it('relaie le corps reçu, tel quel, après notre traitement (bac à sable et production)', async () => {
    expect(relay).toBeInstanceOf(MemoryAppleNotificationRelay);
    const { id, api } = w.client();
    await api.me.onboard(onboardBody());
    const body = appleBody(w, id, `RC-${id}`);
    const res = await post(w, body);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, outcome: 'applied' });
    // Notre traitement a eu lieu : Minimoa+ est ouvert.
    expect((await api.me.get()).plus).toBe(true);
    expect(relay.sent.at(-1)).toEqual({ url: RC_URL, body, ok: true });

    const prod = appleBody(w, randomUUID(), `RC-P-${id}`, 'Production');
    expect((await post(w, prod)).status).toBe(200);
    expect(relay.sent.at(-1)?.body).toBe(prod);
  });

  it('relaie aussi un renvoi d’Apple (RevenueCat déduplique), jamais une notification refusée', async () => {
    const body = appleBody(w, randomUUID(), `RC-D-${randomUUID()}`);
    await post(w, body);
    const before = relay.sent.length;
    const again = await post(w, body);
    expect(await again.json()).toEqual({ ok: true, outcome: 'duplicate' });
    expect(relay.sent.length).toBe(before + 1);

    const forged = await post(w, JSON.stringify({ signedPayload: 'pas.un.jws.valide' }));
    expect(forged.status).toBe(400);
    expect(relay.sent.length).toBe(before + 1);
  });

  it('une panne du relais ne change ni notre traitement ni la réponse à Apple', async () => {
    relay.failing = true;
    try {
      const { id, api } = w.client();
      await api.me.onboard(onboardBody());
      const body = appleBody(w, id, `RC-F-${id}`);
      const res = await post(w, body);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, outcome: 'applied' });
      expect((await api.me.get()).plus).toBe(true);
      expect(relay.sent.at(-1)).toEqual({ url: RC_URL, body, ok: false });
      // L'API répond toujours ensuite.
      expect((await fetch(`${w.baseUrl}/health`)).status).toBe(200);
    } finally {
      relay.failing = false;
    }
  });
});

describe('relais RevenueCat : URL absente', () => {
  let w: TestWorld;
  beforeAll(async () => {
    w = await startWorld();
  });
  afterAll(() => w.close());

  it('ne relaie rien, et notre traitement est le même', async () => {
    expect(w.app.get(APPLE_NOTIFICATION_RELAY)).toBeInstanceOf(DisabledAppleNotificationRelay);
    const { id, api } = w.client();
    await api.me.onboard(onboardBody());
    const res = await post(w, appleBody(w, id, `RC-N-${id}`));
    expect(await res.json()).toEqual({ ok: true, outcome: 'applied' });
    expect((await api.me.get()).plus).toBe(true);
  });
});

describe('HttpAppleNotificationRelay (fetch imité)', () => {
  const logs: string[] = [];
  const logger = { warn: (m: string) => void logs.push(m) };
  const make = (fetchImpl: typeof fetch, timeoutMs = 5_000) => new HttpAppleNotificationRelay({ url: RC_URL, fetch: fetchImpl, logger, timeoutMs });
  const SECRET = '{"signedPayload":"eyJ.jeton-qui-ne-doit-pas-sortir.sig"}';

  it('POST du corps tel quel, en JSON, avec un délai', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    await make(async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response('{}', { status: 200 });
    }).forward(SECRET);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(RC_URL);
    expect(calls[0]?.init).toMatchObject({ method: 'POST', body: SECRET, headers: { 'content-type': 'application/json' } });
    expect(calls[0]?.init.signal).toBeInstanceOf(AbortSignal);
  });

  it('un nouvel essai sur 5xx ou erreur réseau, puis abandon journalisé sans le contenu ; ne lève jamais', async () => {
    logs.length = 0;
    let n = 0;
    await expect(
      make(async () => {
        n++;
        if (n === 1) throw new TypeError('fetch failed');
        return new Response('nope', { status: 503 });
      }).forward(SECRET),
    ).resolves.toBeUndefined();
    expect(n).toBe(2);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain('HTTP 503');
    expect(logs[0]).toContain('api.revenuecat.com');
    expect(logs[0]).not.toContain('jeton-qui-ne-doit-pas-sortir');
    expect(logs[0]).not.toContain('appXXXX');
  });

  it('pas de nouvel essai sur 4xx ; un second essai qui réussit ne journalise rien', async () => {
    logs.length = 0;
    let n = 0;
    await make(async () => {
      n++;
      return new Response('', { status: 404 });
    }).forward(SECRET);
    expect(n).toBe(1);
    expect(logs[0]).toContain('HTTP 404');

    logs.length = 0;
    n = 0;
    await make(async () => (++n === 1 ? new Response('', { status: 500 }) : new Response('', { status: 200 }))).forward(SECRET);
    expect(n).toBe(2);
    expect(logs).toHaveLength(0);
  });

  it('délai dépassé : abandon après deux essais, sans lever', async () => {
    logs.length = 0;
    let n = 0;
    const hang: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        n++;
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    await expect(make(hang, 30).forward(SECRET)).resolves.toBeUndefined();
    expect(n).toBe(2);
    expect(logs[0]).toContain('délai de 30 ms dépassé');
  });
});

describe('REVENUECAT_APPLE_NOTIFICATIONS_URL', () => {
  const base = { BLOWY_ENV: 'local', BLOWY_ADAPTERS: 'memory' } as const;
  it('facultative, https seulement', () => {
    expect(loadEnv(base).facturationAdmin.revenueCat.appleNotificationsUrl).toBeNull();
    expect(loadEnv({ ...base, REVENUECAT_APPLE_NOTIFICATIONS_URL: ' ' }).facturationAdmin.revenueCat.appleNotificationsUrl).toBeNull();
    expect(loadEnv({ ...base, REVENUECAT_APPLE_NOTIFICATIONS_URL: RC_URL }).facturationAdmin.revenueCat.appleNotificationsUrl).toBe(RC_URL);
    expect(() => loadEnv({ ...base, REVENUECAT_APPLE_NOTIFICATIONS_URL: 'http://api.revenuecat.com/x' })).toThrow(/https/);
    expect(() => loadEnv({ ...base, REVENUECAT_APPLE_NOTIFICATIONS_URL: 'pas une url' })).toThrow(/REVENUECAT_APPLE_NOTIFICATIONS_URL/);
  });
});
