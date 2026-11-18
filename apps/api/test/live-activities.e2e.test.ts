/**
 * Activités en direct iOS (docs/WIDGETS.md) : charges ActivityKit conformes à la documentation d'Apple, adaptateur
 * APNs (HTTP/2, JWT ES256, en-têtes, jetons morts) contre un serveur HTTP/2 local, et événements de bout en bout en
 * mémoire : jetons rangés à part, série d'un lien démarrée par push avec le rappel du soir, défi jamais démarré par push,
 * fins, jetons refusés.
 */
import { generateKeyPairSync, verify } from 'node:crypto';
import { createServer, type Http2Server } from 'node:http2';
import type { AddressInfo } from 'node:net';
import { LiveActivityAttributesZ, LiveActivityStateZ } from '@blowy/contract';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApnsLiveActivities, http2Transport } from '../src/integrations/push/apns-live-activities';
import { LIVE_ACTIVITIES, liveEndPayload, liveStartPayload, liveUpdatePayload } from '../src/integrations/push/live-activity';
import type { MemoryLiveActivities } from '../src/integrations/push/memory-live-activities';
import { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { PUSHER } from '../src/integrations/push/pusher';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { LinkJobs } from '../src/modules/links/minimoas/link-jobs';
import { NotificationJobs } from '../src/modules/notifications/notification-jobs';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, doToday, onboardBody, startWorld } from './helpers';

const NOW = new Date('2026-11-15T17:42:00Z');
const attributes = { kind: 'link' as const, pet: { name: 'Nino', species: 'nino' }, startedAt: 1794757320, url: 'blowy://link/x' };
const state = { endsAt: 1794783600, streak: 0, title: null, done: false };

describe('charges ActivityKit', () => {
  it('démarrage : timestamp, event, content-state, attributes-type, attributes, alerte obligatoire, input-push-token ; dates en secondes', () => {
    // Un prénom glissé dans les attributs ne part jamais (écran verrouillé visible de tous).
    const p = liveStartPayload({ now: NOW, attributes: { ...attributes, otherName: 'Léa' } as typeof attributes, state, alert: { title: 'Un lien t’attend', body: 'À toi d’écrire avant minuit.' }, relevance: 75 });
    expect(p).toEqual({
      aps: {
        timestamp: Math.floor(NOW.getTime() / 1000),
        event: 'start',
        'content-state': state,
        'stale-date': state.endsAt,
        'relevance-score': 75,
        'attributes-type': 'BlowyActivityAttributes',
        attributes,
        alert: { title: 'Un lien t’attend', body: 'À toi d’écrire avant minuit.' },
        'input-push-token': 1,
      },
    });
    expect(LiveActivityAttributesZ.strict().safeParse(p.aps.attributes).success).toBe(true);
    expect(LiveActivityStateZ.strict().safeParse(p.aps['content-state']).success).toBe(true);
    expect(Number.isInteger(p.aps.timestamp)).toBe(true);
  });

  it('mise à jour et fin : pas d’attributs ni d’alerte ; la fin porte l’état final et une date de retrait', () => {
    const u = liveUpdatePayload({ now: NOW, state: { ...state, streak: 12, title: 'Un café dehors' } });
    expect(Object.keys(u.aps).sort()).toEqual(['content-state', 'event', 'stale-date', 'timestamp']);
    expect(u.aps.event).toBe('update');
    const e = liveEndPayload({ now: NOW, state: { ...state, done: true }, dismissAt: new Date(NOW.getTime() + 15 * 60_000) });
    expect(e.aps).toMatchObject({ event: 'end', 'dismissal-date': Math.floor(NOW.getTime() / 1000) + 900, 'content-state': { done: true } });
  });

  it('clés exactes : un champ en trop ou une date ISO sont refusés avant l’envoi', () => {
    expect(() => liveUpdatePayload({ now: NOW, state: { ...state, endsAt: '2026-11-15' as unknown as number } })).toThrow();
    expect(liveUpdatePayload({ now: NOW, state: { ...state, extra: 1 } as typeof state }).aps['content-state']).not.toHaveProperty('extra');
    expect(() => liveStartPayload({ now: NOW, attributes, state, alert: { title: 'x', body: 'y'.repeat(5000) } })).toThrow(/trop grosse/);
  });
});

describe('adaptateur APNs (HTTP/2 local)', () => {
  let server: Http2Server;
  let origin: string;
  const seen: { headers: Record<string, string | string[] | undefined>; body: string }[] = [];
  const replies: { status: number; body?: string }[] = [];
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const keyP8 = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  beforeAll(async () => {
    server = createServer();
    server.on('stream', (stream, headers) => {
      let body = '';
      stream.setEncoding('utf8');
      stream.on('data', (c: string) => (body += c));
      stream.on('end', () => {
        seen.push({ headers, body });
        const r = replies.shift() ?? { status: 200 };
        stream.respond({ ':status': r.status, ...(r.body ? { 'content-type': 'application/json' } : {}) });
        stream.end(r.body ?? '');
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it('POST /3/device/<jeton>, en-têtes liveactivity, JWT ES256 vérifiable, réponses 200 / 410 / BadDeviceToken / jeton expiré', async () => {
    const transport = http2Transport();
    const clock = { at: NOW };
    const apns = new ApnsLiveActivities({ keyP8: keyP8.replace(/\n/g, '\\n'), keyId: 'ABC123DEFG', teamId: 'DEF123GHIJ', bundleId: 'app.blowy', environment: 'sandbox' }, () => clock.at, transport, origin);
    const payload = liveUpdatePayload({ now: NOW, state });
    expect(await apns.send({ token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', payload, priority: 5 })).toEqual({ ok: true });
    const first = seen[0];
    expect(first?.headers[':path']).toBe('/3/device/a1b2c3d4e5f60718293a4b5c6d7e8f90');
    expect(first?.headers[':method']).toBe('POST');
    expect(first?.headers['apns-push-type']).toBe('liveactivity');
    expect(first?.headers['apns-topic']).toBe('app.blowy.push-type.liveactivity');
    expect(first?.headers['apns-priority']).toBe('5');
    expect(JSON.parse(first?.body ?? '{}')).toEqual(payload);
    const jwt = String(first?.headers.authorization).replace(/^bearer /, '');
    const [h, c, s] = jwt.split('.');
    expect(JSON.parse(Buffer.from(h ?? '', 'base64url').toString())).toEqual({ alg: 'ES256', kid: 'ABC123DEFG' });
    expect(JSON.parse(Buffer.from(c ?? '', 'base64url').toString())).toEqual({ iss: 'DEF123GHIJ', iat: Math.floor(NOW.getTime() / 1000) });
    expect(verify('sha256', Buffer.from(`${h}.${c}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s ?? '', 'base64url'))).toBe(true);

    // Même JWT pendant 40 min (Apple : pas plus d'un nouveau jeton par 20 min), refait ensuite.
    await apns.send({ token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', payload, priority: 10 });
    expect(seen[1]?.headers.authorization).toBe(first?.headers.authorization);
    clock.at = new Date(NOW.getTime() + 41 * 60_000);
    await apns.send({ token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', payload, priority: 10 });
    expect(seen[2]?.headers.authorization).not.toBe(first?.headers.authorization);

    replies.push({ status: 410, body: '{"reason":"Unregistered","timestamp":1}' });
    expect(await apns.send({ token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', payload, priority: 10 })).toEqual({ ok: false, status: 410, reason: 'Unregistered', invalidToken: true });
    replies.push({ status: 400, body: '{"reason":"BadDeviceToken"}' });
    expect(await apns.send({ token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', payload, priority: 10 })).toMatchObject({ ok: false, reason: 'BadDeviceToken', invalidToken: true });
    replies.push({ status: 429, body: '{"reason":"TooManyRequests"}' });
    expect(await apns.send({ token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', payload, priority: 10 })).toMatchObject({ ok: false, invalidToken: false });
    expect(await apns.send({ token: 'pas-hexa', payload, priority: 10 })).toMatchObject({ invalidToken: true });
    transport.close();
  });
});

describe('événements de bout en bout (mémoire)', () => {
  let world: TestWorld;
  let live: MemoryLiveActivities;
  let pusher: MemoryPusher;
  let db: MemoryDb;
  const SECRET = 'secret-du-minuteur-activites-en-direct';

  beforeAll(async () => {
    world = await startWorld({ INTERNAL_TICK_SECRET: SECRET });
    live = world.app.get<MemoryLiveActivities>(LIVE_ACTIVITIES);
    pusher = world.app.get<MemoryPusher>(PUSHER);
    db = world.app.get<MemoryDb>(MEMORY_DB);
  });
  afterAll(() => world.close());

  const START = 'a'.repeat(64);
  const UPDATE_1 = 'b'.repeat(64);
  const UPDATE_2 = 'c'.repeat(64);
  const LINK_UPDATE = 'd'.repeat(64);

  it('jetons rangés à part (jamais envoyés à Expo), un nouveau jeton update remplace l’ancien de la même activité', async () => {
    const a = world.client();
    await a.api.me.onboard(onboardBody({ displayName: 'Ana' }));
    await a.api.notifications.registerDevice({ token: 'ExponentPushToken[ana]', platform: 'ios', timeZone: 'Europe/Paris' });
    await a.api.notifications.registerDevice({ token: START, platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'start' } });
    await a.api.notifications.registerDevice({ token: UPDATE_1, platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'update', activity: 'challenge', activityId: 'act-1' } });
    await a.api.notifications.registerDevice({ token: UPDATE_2, platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'update', activity: 'challenge', activityId: 'act-1' } });
    expect([...db.pushDevices.keys()]).toEqual(['ExponentPushToken[ana]']);
    const mine = [...db.liveActivityTokens.values()].filter((t) => t.record.userId === a.id).map((t) => [t.record.token, t.record.use, t.record.activity]);
    expect(mine).toEqual([
      [START, 'start', null],
      [UPDATE_2, 'update', 'challenge'],
    ]);
    // Le défi du jour ne démarre jamais d'activité par push.
    await world.app.get<Notifier>(NOTIFIER).notify(a.id, 'daily_challenge', { minimoa: 'Nino' });
    expect(live.outbox.filter((p) => p.payload.aps.event === 'start')).toHaveLength(0);
    // Série en danger (le soir, heure de la personne) : mise à jour de l'activité du défi.
    world.clock.advanceHours(8);
    await world.app.get<Notifier>(NOTIFIER).notify(a.id, 'streak_in_danger', { streak: '4' });
    const update = live.outbox.at(-1);
    expect(update).toMatchObject({ token: UPDATE_2, priority: 10, payload: { aps: { event: 'update', 'content-state': { streak: 4, done: false, title: null } } } });
    world.clock.advanceHours(-8);
    // Défi relevé : fin (état final 15 min), jeton oublié.
    live.outbox.length = 0;
    await doToday(a);
    expect(live.outbox).toHaveLength(1);
    expect(live.outbox[0]).toMatchObject({ token: UPDATE_2, payload: { aps: { event: 'end', 'content-state': { done: true } } } });
    expect(live.outbox[0]?.payload.aps['dismissal-date']).toBe(Math.floor(world.clock.now().getTime() / 1000) + 900);
    expect(db.liveActivityTokens.has(UPDATE_2)).toBe(false);
  });

  it('série d’un lien : le rappel du soir démarre l’activité chez qui doit écrire (pas de seconde notification iOS), finie quand il écrit', async () => {
    const lea = world.client();
    const tom = world.client();
    const me = await lea.api.me.onboard(onboardBody({ displayName: 'Léa' }));
    await tom.api.me.onboard(onboardBody({ displayName: 'Tom', inviteCode: me.inviteCode, pet: { name: 'Gaston', species: 'gaston' } }));
    await tom.api.notifications.registerDevice({ token: 'ExponentPushToken[tom]', platform: 'ios', timeZone: 'Europe/Paris' });
    await tom.api.notifications.registerDevice({ token: 'e'.repeat(64), platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'start' } });
    const [link] = await lea.api.links.list();
    const linkId = link?.id ?? '';
    await lea.api.links.send(linkId, { body: 'Ce soir ?' });
    live.outbox.length = 0;
    const yourTurn = () => pusher.outbox.filter((m) => m.to === 'ExponentPushToken[tom]' && m.data.kind === 'your_turn').length;
    // L'après-midi : pas de rappel (la fenêtre est le soir, 19 h – 22 h à Paris).
    await world.app.get(LinkJobs).runDue(world.clock.now());
    expect(live.outbox).toHaveLength(0);
    world.clock.advanceHours(8.5); // 19 h 30 à Paris
    await world.app.get(LinkJobs).runDue(world.clock.now());
    const start = live.outbox.find((p) => p.payload.aps.event === 'start');
    expect(start).toMatchObject({
      token: 'e'.repeat(64),
      priority: 10,
      payload: {
        aps: {
          'attributes-type': 'BlowyActivityAttributes',
          attributes: { kind: 'link', pet: { name: 'Gaston', species: 'gaston' }, url: `blowy://link/${linkId}` },
          'content-state': { streak: 0, done: false, title: null },
          'input-push-token': 1,
        },
      },
    });
    expect(LiveActivityAttributesZ.strict().safeParse(start?.payload.aps.attributes).success).toBe(true);
    // Écran verrouillé d'une app de rencontre : jamais le prénom de l'autre (audit App Store, HIG Live Activities).
    expect(start?.payload.aps.attributes).not.toHaveProperty('otherName');
    expect(start?.payload.aps.alert).toEqual({ title: 'Un lien t’attend', body: 'À toi d’écrire avant minuit.' });
    // Jamais plus de 8 h (limite d'Apple) : ici minuit arrive avant.
    const endsAt = start?.payload.aps['content-state'].endsAt ?? 0;
    expect(endsAt * 1000 - world.clock.now().getTime()).toBeLessThanOrEqual(8 * 3_600_000);
    // L'activité porte l'alerte : pas de seconde notification sur iOS.
    expect(yourTurn()).toBe(0);
    // Idempotent : un deuxième passage ne redémarre rien.
    await world.app.get(LinkJobs).runDue(world.clock.now());
    expect(live.outbox.filter((p) => p.payload.aps.event === 'start')).toHaveLength(1);

    // L'app reçoit le jeton de mise à jour de cette activité et l'enregistre (avec le lien).
    await tom.api.notifications.registerDevice({ token: LINK_UPDATE, platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'update', activity: 'link', activityId: 'l-1', linkId } });
    live.outbox.length = 0;
    await tom.api.links.send(linkId, { body: 'Avec plaisir' });
    expect(live.outbox.filter((p) => p.token === LINK_UPDATE).map((p) => [p.payload.aps.event, p.payload.aps['content-state']?.done, p.payload.aps['content-state']?.streak])).toEqual([['end', true, 1]]);
    expect(db.liveActivityTokens.has(LINK_UPDATE)).toBe(false);
  });

  it('minuit : les activités en cours sont terminées et retirées ; un jeton refusé par APNs est désactivé', async () => {
    const c = world.client();
    await c.api.me.onboard(onboardBody({ displayName: 'Cy' }));
    const dead = 'f'.repeat(64);
    await c.api.notifications.registerDevice({ token: '1'.repeat(64), platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'update', activity: 'challenge', activityId: 'c-1' } });
    await c.api.notifications.registerDevice({ token: dead, platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'update', activity: 'link', activityId: 'c-2' } });
    live.markDead(dead);
    live.outbox.length = 0;
    world.clock.advanceDays(1);
    await world.app.get(NotificationJobs).runDue(world.clock.now());
    expect(live.outbox.filter((p) => p.token === '1'.repeat(64)).map((p) => p.payload.aps.event)).toEqual(['end']);
    expect(live.outbox.find((p) => p.token === '1'.repeat(64))?.payload.aps['dismissal-date']).toBe(Math.floor(world.clock.now().getTime() / 1000));
    expect(db.liveActivityTokens.has('1'.repeat(64))).toBe(false);
    expect(db.liveActivityTokens.has(dead)).toBe(false);
    // Jeton de démarrage mort : désactivé, plus d'envoi.
    const s = 'ab'.repeat(32);
    await c.api.notifications.registerDevice({ token: s, platform: 'ios', timeZone: 'Europe/Paris', kind: 'apns_live_activity', liveActivity: { use: 'start' } });
    live.markDead(s);
    const { LiveActivities } = await import('../src/modules/notifications/live-activities');
    const service = world.app.get(LiveActivities, { strict: false });
    expect(await service.startLinkStreak(c.id, { linkId: '00000000-0000-4000-8000-000000000000', otherName: 'X', streak: 2, alert: { title: 'Série avec X', body: 'À toi.' } })).toBe(false);
    expect(db.liveActivityTokens.get(s)?.disabledAt).not.toBeNull();
    void SECRET;
  });
});
