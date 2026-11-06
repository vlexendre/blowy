/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON dynamiques en test */
/**
 * Non-régression des bugs relevés par les parcours multi-utilisateurs (docs/qa/journeys-report.md)
 * qui survivent à la V5 : B1, B1bis, B2/B9, B4, B5/B6, B7, B8. (B11 : test/unit/clock-usage.test.ts.)
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import { attachRealtime } from '../../src/bootstrap.js';
import { buildWorkerGraph, type WorkerGraph } from '../../src/jobs/worker-runtime.js';
import type { RealtimeGateway } from '../../src/realtime/realtime.gateway.js';
import { RealtimeRelayEffect } from '../../src/realtime/redis-realtime.publisher.js';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';
import { matchedPair } from './fixtures.js';

const DAY = 86_400_000;
let h: Harness;
let rt: RealtimeGateway;
let worker: WorkerGraph;

beforeAll(async () => {
  h = await startHarness();
  await h.reset();
  rt = attachRealtime(h.app, []);
  // Worker avec relais temps réel en mémoire (même effet que la prod, sans Redis).
  worker = buildWorkerGraph(h.app, [new RealtimeRelayEffect(async (m) => rt.handleRt(m))]);
  await h.db.catalogItem.createMany({ data: [{ id: 'scarf_red', kind: 'ACCESSORY', priceCoins: 120 }], skipDuplicates: true });
  await h.db.storeProduct.createMany({
    data: [
      { id: 'coins_500', kind: 'CONSUMABLE_COINS', coinsAmount: 500 },
      { id: 'blowy_plus_monthly', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
    ],
    skipDuplicates: true,
  });
});
afterAll(async () => {
  await rt?.close();
  await h?.close();
});

async function drain() {
  for (let i = 0; i < 6; i++) if ((await worker.dispatcher.drainAll(h.clock.now())) === 0) break;
}

interface Ws {
  socket: Socket;
  events: any[];
  revoked: string[];
  closed: () => boolean;
}
function connect(token: string): Promise<Ws> {
  return new Promise((resolve, reject) => {
    const s = io(h.baseUrl, { path: '/v1/ws', auth: { token }, transports: ['websocket'], reconnection: false, forceNew: true });
    let closed = false;
    const ws: Ws = { socket: s, events: [], revoked: [], closed: () => closed };
    s.on('disconnect', () => (closed = true));
    s.on('access.revoked', (p: any) => ws.revoked.push(p?.room));
    s.on('authenticated', () => resolve(ws));
    s.on('connect_error', reject);
  });
}
const emit = <T = any>(s: Socket, ev: string, payload: unknown, ms = 2000) =>
  new Promise<T | 'TIMEOUT'>((r) => {
    const t = setTimeout(() => r('TIMEOUT'), ms);
    s.emit(ev, payload, (x: T) => {
      clearTimeout(t);
      r(x);
    });
  });
async function until(pred: () => boolean, ms = 2000) {
  const end = Date.now() + ms;
  while (!pred() && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
  return pred();
}

describe('B1 — dépenses de pièces simultanées', () => {
  // V5 (D-020, T3) : pièces et objets ne se vendent plus → 410 GONE, toujours propre, jamais de 500.
  it('7 achats parallèles : 410 GONE propres (RETIRED_IN_V5), solde inchangé, jamais de 500', async () => {
    const maya = new TestClient(h);
    await maya.signIn('fix.maya');
    expect((await maya.call('POST', '/v1/purchases/local-demo', { action: 'BUY_COINS', productId: 'coins_500' })).status).toBe(410);
    const before = (await maya.call('GET', '/v1/wallet')).body.balance as number;
    const t0 = Date.now();
    const rs = await Promise.all(Array.from({ length: 7 }, () => maya.call('POST', '/v1/catalog/scarf_red/purchase', {})));
    expect(rs.every((r) => r.status === 410 && r.body.detailsSafe?.reason === 'RETIRED_IN_V5')).toBe(true);
    expect((await maya.call('GET', '/v1/wallet')).body.balance).toBe(before);
    expect(Date.now() - t0).toBeLessThan(8000);
  });
});

describe('B7 / B8 — idempotence', () => {
  it('/purchases/local-demo : même clé + autre payload → 409 IDEMPOTENCY_CONFLICT, rien exécuté ; même payload → rejoué une fois', async () => {
    const u = new TestClient(h);
    await u.signIn('fix.b7');
    const cid = randomUUID();
    // V5 : les packs de pièces sont retirés (410) ; l'idempotence se vérifie sur l'abonnement de démo.
    const [a, b] = await Promise.all([
      u.call('POST', '/v1/purchases/local-demo', { action: 'CANCEL' }, { commandId: cid }),
      u.call('POST', '/v1/purchases/local-demo', { action: 'CANCEL' }, { commandId: cid }),
    ]);
    expect([a.status, b.status]).toContain(200);
    await u.call('POST', '/v1/purchases/local-demo', { action: 'CANCEL' }, { commandId: cid });
    const conflict = await u.call('POST', '/v1/purchases/local-demo', { action: 'SUBSCRIBE', productId: 'blowy_plus_monthly' }, { commandId: cid });
    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe('IDEMPOTENCY_CONFLICT');
    expect((await u.call('GET', '/v1/subscriptions/me')).body.state).not.toBe('ACTIVE');
  });

  it('clientMessageId réutilisé avec un autre texte → 409 IDEMPOTENCY_CONFLICT, ni réécriture ni doublon', async () => {
    const m = await matchedPair(h, 'fixb8');
    const send = (body: string) => m.a.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: 'b8-client-0001', body });
    const [x, y] = await Promise.all([send('Coucou'), send('Coucou')]);
    expect(x.status).toBeLessThan(300);
    expect(y.status).toBeLessThan(300);
    expect(y.body.id).toBe(x.body.id);
    const other = await send('Autre texte');
    expect(other.status).toBe(409);
    expect(other.body.code).toBe('IDEMPOTENCY_CONFLICT');
    expect(other.body.detailsSafe?.reason).toBe('CLIENT_MESSAGE_ID_REUSED');
    const rows = await h.db.message.findMany({ where: { conversationId: m.convId, clientMessageId: 'b8-client-0001' }, include: { content: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.content?.body).toBe('Coucou');
  });
});

describe('B1bis — session révoquée ou expirée : socket coupée', () => {
  it('révocation d’un appareil : sa socket est fermée et ne reçoit plus rien ; l’autre appareil continue', async () => {
    const m = await matchedPair(h, 'fixrev');
    const jade = m.a;
    // Deuxième appareil de la même personne (même identité locale, nouvelle session).
    const subject = (await h.db.authIdentity.findFirstOrThrow({ where: { userId: jade.userId } })).subject;
    const s2 = await new TestClient(h).call('POST', '/v1/auth/sessions', { provider: 'local', credential: subject, device: { platform: 'ios', label: 'ipad' } });
    expect(s2.status).toBe(201);
    expect(s2.body.userId).toBe(jade.userId);
    const ipadToken = s2.body.accessToken as string;
    const ipadSession = s2.body.sessionId as string;
    const phone = await connect(jade.token!);
    const tab = await connect(ipadToken);
    for (const w of [phone, tab]) expect(await emit(w.socket, 'join', { room: `conversation:${m.convId}` })).toEqual({ ok: true });

    expect((await jade.call('DELETE', `/v1/auth/sessions/${ipadSession}`)).status).toBeLessThan(300);
    await drain();
    expect(await until(() => tab.closed())).toBe(true);
    expect(tab.revoked).toContain(`user:${jade.userId}`);
    expect(phone.closed()).toBe(false);
    // Plus rien n'est livré : reconnexion refusée avec le jeton révoqué.
    await expect(connect(ipadToken)).rejects.toBeTruthy();
    phone.socket.close();
  });

  it('défense en profondeur : sans ordre de coupure (relais perdu), la revalidation périodique coupe la socket avant toute livraison', async () => {
    const u = new TestClient(h);
    await onboard(u, 'fix.rev2', { gender: 'WOMAN', seeking: ['MAN'] });
    const ws = await connect(u.token!);
    const sid = (await h.db.deviceSession.findFirstOrThrow({ where: { userId: u.userId } })).id;
    await h.db.deviceSession.update({ where: { id: sid }, data: { revokedAt: h.clock.now() } }); // révocation sans outbox
    h.clock.advance(31_000);
    const r = await emit<any>(ws.socket, 'resync', { room: `user:${u.userId}`, sinceCursor: null });
    expect(r === 'TIMEOUT' || r.ok === false).toBe(true);
    expect(await until(() => ws.closed())).toBe(true);
  });

  it('session expirée : la socket est fermée et rien n’est renvoyé au resync', async () => {
    const u = new TestClient(h);
    await onboard(u, 'fix.exp', { gender: 'MAN', seeking: ['WOMAN'] });
    const ws = await connect(u.token!);
    h.clock.advance(400 * DAY);
    const r = await emit<any>(ws.socket, 'resync', { room: `user:${u.userId}`, sinceCursor: null });
    expect(r === 'TIMEOUT' || (r.ok === false && r.code === 'UNAUTHENTICATED')).toBe(true);
    expect(await until(() => ws.closed())).toBe(true);
  });
});

describe('B5 / B6 — événements dans la room user:', () => {
  it('match.created arrive dans user: des deux ; relationship.ended aussi, même après révocation des rooms', async () => {
    const m = await matchedPair(h, 'fixws');
    await drain();
    for (const c of [m.a, m.b]) {
      const ws = await connect(c.token!);
      const r = await emit<any>(ws.socket, 'resync', { room: `user:${c.userId}`, sinceCursor: null });
      expect(r.ok).toBe(true);
      const matched = r.events.find((e: any) => e.type === 'match.created');
      expect(matched?.payload).toEqual({ relationshipId: m.relId, conversationId: m.convId });
      ws.socket.close();
    }

    const lea = await connect(m.a.token!);
    expect(await emit(lea.socket, 'join', { room: `relationship:${m.relId}` })).toEqual({ ok: true });
    const head = await emit<any>(lea.socket, 'resync', { room: `user:${m.a.userId}`, sinceCursor: null });
    const cursor = head.events.at(-1)?.projectionCursor ?? null;
    const syncs: unknown[] = [];
    lea.socket.on('sync', (p) => syncs.push(p));
    expect((await m.b.call('POST', `/v1/relationships/${m.relId}/leave`, {})).status).toBeLessThan(300);
    await drain();
    expect(await until(() => lea.revoked.includes(`relationship:${m.relId}`) && syncs.length > 0)).toBe(true);
    // Room de relation révoquée… mais l'événement reste livrable via la room personnelle.
    const after = await emit<any>(lea.socket, 'resync', { room: `user:${m.a.userId}`, sinceCursor: cursor });
    expect(after.ok).toBe(true);
    expect(after.events.map((e: any) => e.type)).toContain('relationship.ended');
    expect(JSON.stringify(after.events)).not.toMatch(/CLEAN_LEAVE|reason/);
    lea.socket.close();
  });
});

describe('B2 / B9 — page publique « 3 mots »', () => {
  it('l’activation attribue un slug et un lien ; la désactivation retire la page du web (404) ; réactivation = même lien', async () => {
    const alex = new TestClient(h);
    await onboard(alex, 'fix.alex', { gender: 'MAN', seeking: ['WOMAN'] });
    await h.db.profile.update({ where: { userId: alex.userId }, data: { displayName: 'Élodie-Marie' } });
    expect((await alex.call('GET', '/v1/me/public-page')).body).toMatchObject({ slug: null, url: null });
    const on = await alex.call('PUT', '/v1/me/public-page', { enabled: true });
    expect(on.status).toBe(200);
    expect(on.body.enabled).toBe(true);
    // V5.2 (D.13) : slug aléatoire, jamais le prénom.
    expect(on.body.slug).toMatch(/^m[a-z0-9]{8}$/);
    expect(on.body.slug).not.toMatch(/elodie|marie/);
    expect(on.body.url).toMatch(new RegExp(`/${on.body.slug}$`));
    expect(JSON.stringify(on.body)).not.toContain(alex.userId);
    expect((await alex.call('GET', '/v1/me/anonymous-responses')).body.page).toMatchObject({ slug: on.body.slug, enabled: true });
    const pub = new TestClient(h);
    expect((await pub.call('GET', `/v1/public/profiles/${on.body.slug}`)).status).toBe(200);

    expect((await alex.call('PUT', '/v1/me/public-page', { enabled: false })).status).toBe(200);
    const off = await pub.call('GET', `/v1/public/profiles/${on.body.slug}`);
    expect(off.status).toBe(404);
    expect(JSON.stringify(off.body)).not.toMatch(/Élodie|fix\.alex/);

    const again = await alex.call('PUT', '/v1/me/public-page', { enabled: true });
    expect(again.body.slug).toBe(on.body.slug);
    expect((await pub.call('GET', `/v1/public/profiles/${on.body.slug}`)).status).toBe(200);
  });
});

describe('B4 — signaler toute personne qu’on a pu voir', () => {
  it('profil proposé signalé « mineur » : 200, dossier restreint prioritaire, retiré du matching ; pet jamais vu → 404', async () => {
    const clara = new TestClient(h);
    const paul = new TestClient(h);
    const nadia = new TestClient(h);
    const stranger = new TestClient(h);
    await onboard(clara, 'fix.clara', { gender: 'WOMAN', seeking: ['MAN'] });
    const { petId: paulPet } = await onboard(paul, 'fix.paul', { gender: 'MAN', seeking: ['WOMAN'] });
    await onboard(stranger, 'fix.stranger', { gender: 'WOMAN', seeking: ['WOMAN'] });
    // Un tiers qui n'a jamais vu Paul ne peut pas le désigner (anti-IDOR).
    expect((await stranger.call('POST', '/v1/reports', { target: { petId: paulPet }, category: 'MINOR' })).status).toBe(404);

    const feed = await clara.call('POST', '/v1/matches/onboarding-batch', {});
    expect(feed.body.items.some((i: any) => i.otherPet.id === paulPet)).toBe(true);
    const r = await clara.call('POST', '/v1/reports', { target: { petId: paulPet }, category: 'MINOR', note: 'il dit avoir 16 ans' });
    expect(r.status).toBe(201);
    const kase = await h.db.moderationCase.findFirstOrThrow({ where: { subjectUserId: paul.userId, reasonCode: 'REPORT_MINOR' } });
    expect(kase.restricted).toBe(true);
    expect(kase.priority).toBeLessThanOrEqual(1);
    // Bloquer depuis la proposition est aussi possible.
    expect((await clara.call('POST', '/v1/blocks', { target: { petId: paulPet } })).status).toBeLessThan(300);

    await onboard(nadia, 'fix.nadia', { gender: 'WOMAN', seeking: ['MAN'] });
    const fn = await nadia.call('POST', '/v1/matches/onboarding-batch', {});
    expect(fn.body.items.some((i: any) => i.otherPet.id === paulPet)).toBe(false);
    expect(JSON.stringify((await paul.call('GET', '/v1/me')).body)).not.toMatch(/MINOR|report|clara/i);
  });
});
