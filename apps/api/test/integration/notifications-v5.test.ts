/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 T8 (agent G) — intégration `notifications` (vraie base, vrai graphe Nest, worker en processus,
 * horloge contrôlable, boîte de réception locale à la place d'Expo) :
 *  - jeton d'appareil : enregistrement par session, transfert à un autre compte = retiré de l'ancien ;
 *  - préférences : SAFETY non désactivable, catégorie coupée → supprimée ; mode discret ;
 *  - cycle : invitation (≤ 1/semaine), rappel devenu sans objet, confirmation J-1 18 h avec lieu,
 *    visages à J − 3 h (pas avant), check-in ;
 *  - messages : regroupés par conversation, pet avant la confirmation / prénom après, jamais le corps,
 *    heures calmes (report à 8 h), pause ;
 *  - rien de rendu (prénom, lieu, corps) n'est stocké dans la table `Notification`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import type { DevPushInboxEntry } from '@blowy/api-contract';
import { OUTINGS_JOBS } from '../../src/modules/outings/outings.module.js';
import { NOTIFICATIONS_JOBS } from '../../src/modules/notifications/notifications.module.js';
import { PUSH_SENDER } from '../../src/modules/notifications/application/ports.js';
import type { LocalInboxPushSender } from '../../src/modules/notifications/infrastructure/push-senders.js';
import type { RecurringJob } from '../../src/jobs/scheduler.js';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';

let h: Harness;
const T = {
  monday: new Date('2026-11-16T09:30:00Z'),
  composed: new Date('2026-11-17T11:01:00Z'),
  reminder: new Date('2026-11-18T07:05:00Z'), // mer. 8 h 05 : rappel d'invitation (deadline − 4 h)
  locked: new Date('2026-11-18T17:01:00Z'),
  beforeFaces: new Date('2026-11-19T15:00:00Z'),
  faces: new Date('2026-11-19T15:31:00Z'),
  checkin: new Date('2026-11-19T18:05:00Z'),
  night: new Date('2026-11-19T22:10:00Z'), // jeu. 23 h 10 locale
  morning: new Date('2026-11-20T07:01:00Z'), // ven. 8 h 01
  week: '2026-W47',
};
const NAMES = ['Léa', 'Hugo', 'Inès', 'Malo', 'Sarah'];
const ps: TestClient[] = [];
let outingId = '';
let convId = '';

const job = (token: symbol, name: string) => h.app.get<RecurringJob[]>(token).find((j) => j.name === name)!;
const run = async (token: symbol, name: string, d: Date) => {
  h.clock.set(d);
  await h.drain();
  await job(token, name).run(d);
  await h.drain();
};
const plan = (d: Date) => run(NOTIFICATIONS_JOBS, 'notifications.plan', d);
const inbox = () => h.app.get<LocalInboxPushSender>(PUSH_SENDER);
const pushesOf = (c: TestClient, key?: string) => inbox().all().filter((e: DevPushInboxEntry) => e.userId === c.userId && (!key || e.data.key === key));
const tokenOf = (i: number) => `ExponentPushToken[it-notif-${i}-abcdefgh]`;

async function person(i: number, nb: string) {
  h.clock.set(T.monday);
  const c = new TestClient(h);
  await onboard(c, `notif${i}`, { gender: i % 2 ? 'MAN' : 'WOMAN', seeking: [] });
  await h.db.profile.update({ where: { userId: c.userId }, data: { displayName: NAMES[i]! } });
  expect((await c.call('PUT', '/v1/me/neighborhood', { neighborhoodId: nb })).status).toBe(200);
  expect((await c.call('PUT', '/v1/preferences/intentions', { lookingFor: 'FRIENDS', storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: [] })).status).toBe(200);
  await h.db.mediaAsset.create({ data: { ownerUserId: c.userId, purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `it/notif${i}.jpg`, retentionClass: 'PROFILE_PHOTO', finalizedAt: T.monday } });
  return c;
}

beforeAll(async () => {
  h = await startHarness(T.monday, process.env.IT_DEBUG ? { LOG_LEVEL: 'error' } : {});
  await h.reset();
  const zone = await h.db.zone.create({ data: { code: 'IT_NOTIF', name: 'it-notif', timezone: 'Europe/Paris' } });
  const n = await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-notif', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } });
  await h.db.neighborhoodSlotTemplate.create({ data: { neighborhoodId: n.id, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' } });
  await h.db.venue.create({ data: { neighborhoodId: n.id, name: 'Café des Oiseaux', addressLine: '12 rue Oberkampf', postalCode: '75011', city: 'Paris', lat: 48.8649, lng: 2.3707, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 3, accessibilityTags: [], checkinSecretRef: 'it-notif' } });
  for (let i = 0; i < 5; i++) ps.push(await person(i, n.id));
});
afterAll(async () => h?.close());

describe('notifications V5 (intégration)', () => {
  it('réglages : jeton par appareil, SAFETY toujours active, mode discret', async () => {
    for (const [i, p] of ps.entries()) {
      const r = await p.call('PUT', '/v1/me/push-token', { token: tokenOf(i), platform: 'ios' });
      expect(r.status, JSON.stringify(r.body)).toBe(200);
    }
    expect((await ps[0]!.call('PUT', '/v1/me/push-token', { token: 'pas-un-jeton', platform: 'ios' })).status).toBe(400);
    expect((await ps[0]!.call('PUT', '/v1/me/notifications/settings', { categories: { SAFETY: false } })).status).toBe(400);
    const lea = await ps[0]!.call('PUT', '/v1/me/notifications/settings', { discreetMode: true });
    expect(lea.status).toBe(200);
    expect(lea.body).toMatchObject({ discreetMode: true, pushRegistered: true, alwaysOn: ['SAFETY'], quietHours: { startHour: 23, endHour: 8 }, maxPerDay: 3, maxPerOutingDay: 4, maxOutingProposalsPerWeek: 1, paused: false });
    expect(Object.values(lea.body.categories).every(Boolean)).toBe(true);
    // Le jeton n'apparaît nulle part dans la mémoire des commandes.
    const rec = await h.db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM "CommandRecord" WHERE "result"::text LIKE '%it-notif-%'`);
    expect(Number(rec[0]!.n)).toBe(0);
  });

  it('invitation de la semaine : une seule notification ; une seconde invitation la même semaine ne sonne pas', async () => {
    h.clock.set(T.monday);
    for (const p of ps) expect((await p.call('PUT', `/v1/outings/requests/${T.week}`, {})).status).toBe(200);
    await run(OUTINGS_JOBS, 'outings.compose', T.composed);
    outingId = (await ps[0]!.call('GET', '/v1/outings/week')).body.myOutingId;
    expect(outingId).toBeTruthy();
    await plan(T.composed);
    for (const p of ps) expect(pushesOf(p).length, 'une invitation').toBe(1);
    const hugo = pushesOf(ps[1]!)[0]!;
    expect(hugo).toMatchObject({ title: 'Blowy', body: 'Pet-notif1 t’a trouvé une bande pour jeudi.', data: { key: 'outing.invited', route: `/outings/${outingId}`, discreet: false } });
    const lea = pushesOf(ps[0]!)[0]!;
    expect(lea).toMatchObject({ title: 'Rappel', body: 'Tu as du nouveau.', channelId: 'discreet', data: { discreet: true, icon: 'neutral' } });
    expect(lea.data.key).toBeUndefined();
    // Une autre invitation la même semaine (backfill, amorçage…) : trace sans envoi.
    await h.db.outboxEvent.create({ data: { topic: 'outing.invited', aggregateType: 'Outing', aggregateId: outingId, payload: { outingId, userId: ps[1]!.userId, backfill: true }, availableAt: T.composed } });
    await plan(T.composed);
    expect(pushesOf(ps[1]!).length).toBe(1);
    const capped = await h.db.notification.findFirst({ where: { userId: ps[1]!.userId, dedupKey: `outing.invited:${outingId}` } });
    expect(capped).toMatchObject({ status: 'SUPPRESSED', data: expect.objectContaining({ reason: 'WEEKLY_PROPOSAL_CAP' }) });
  });

  it('tous viennent : bande formée ; le rappel d\'invitation devient sans objet', async () => {
    for (const p of ps) expect((await p.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'AUTO' })).status).toBe(200);
    await plan(T.composed);
    expect(pushesOf(ps[2]!, 'outing.formed')).toEqual([expect.objectContaining({ body: 'Ta bande de jeudi est formée : le chat est ouvert.' })]);
    await plan(T.reminder);
    for (const p of ps) expect(pushesOf(p, 'outing.invite_reminder')).toEqual([]);
    const rem = await h.db.notification.findMany({ where: { dedupKey: `outing.invite_reminder:${outingId}` } });
    expect(rem.length).toBe(5);
    expect(rem.every((r) => r.status === 'SUPPRESSED' && (r.data as any).reason === 'NOT_RELEVANT')).toBe(true);
    convId = (await h.db.conversation.findFirstOrThrow({ where: { outingId } })).id;
  });

  it('message avant la confirmation : désigné par le pet, jamais le corps ; regroupé par conversation', async () => {
    h.clock.set(new Date('2026-11-18T09:00:00Z'));
    expect((await ps[1]!.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'it-notif-m1', body: 'Salut tout le monde, secret 4242' })).status).toBeLessThan(300);
    expect((await ps[1]!.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'it-notif-m2', body: 'Deuxième message' })).status).toBeLessThan(300);
    await plan(new Date('2026-11-18T09:00:30Z'));
    const m = pushesOf(ps[2]!, 'message.human');
    expect(m).toEqual([expect.objectContaining({ body: 'Nouveau message de Pet-notif1.', data: expect.objectContaining({ route: `/conversations/${convId}` }) })]);
    expect(pushesOf(ps[1]!, 'message.human')).toEqual([]); // jamais à l'auteur
    expect(JSON.stringify(inbox().all())).not.toMatch(/secret 4242|Deuxième message/);
    // Encore un message 2 min plus tard : silence (regroupement 10 min).
    h.clock.set(new Date('2026-11-18T09:02:00Z'));
    await ps[1]!.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'it-notif-m3', body: 'Encore moi' });
    await plan(new Date('2026-11-18T09:02:30Z'));
    expect(pushesOf(ps[2]!, 'message.human').length).toBe(1);
  });

  it('J-1 18 h : confirmation avec lieu et heure (texte neutre en mode discret) ; visages à J − 3 h, pas avant', async () => {
    await run(OUTINGS_JOBS, 'outings.lifecycle', T.locked);
    await plan(T.locked);
    expect(pushesOf(ps[1]!, 'outing.confirmed')).toEqual([expect.objectContaining({ body: 'Ta sortie de jeudi est confirmée : 19 h 30 au Café des Oiseaux. Les prénoms de ta bande sont visibles ; une annulation compte désormais comme une absence.' })]);
    const lea = pushesOf(ps[0]!).at(-1)!;
    expect(lea).toMatchObject({ title: 'Rappel', body: 'Rappel pour demain à 19 h 30.' });
    expect(JSON.stringify(pushesOf(ps[0]!))).not.toMatch(/Café|Oiseaux|sortie|bande|Hugo|Pet-notif/);
    await plan(T.beforeFaces);
    expect(pushesOf(ps[1]!, 'outing.faces')).toEqual([]);
    await plan(T.faces);
    expect(pushesOf(ps[1]!, 'outing.faces')).toEqual([expect.objectContaining({ body: 'Les visages de ta bande sont visibles. À tout à l’heure, 19 h 30 au Café des Oiseaux.' })]);
    expect(pushesOf(ps[0]!).at(-1)).toMatchObject({ body: 'Rappel pour 19 h 30.' });
  });

  it('check-in ouvert (transactionnel) ; après la confirmation, l\'auteur d\'un message est désigné par son prénom', async () => {
    await run(OUTINGS_JOBS, 'outings.lifecycle', T.checkin);
    await plan(T.checkin);
    expect(pushesOf(ps[3]!, 'outing.checkin_open')).toEqual([expect.objectContaining({ body: 'Tu es arrivé·e ? Fais ton check-in au Café des Oiseaux.', data: expect.objectContaining({ category: 'OUTING' }) })]);
    h.clock.set(new Date('2026-11-19T18:10:00Z'));
    await ps[1]!.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'it-notif-m4', body: 'On est au fond à gauche' });
    await plan(new Date('2026-11-19T18:10:30Z'));
    expect(pushesOf(ps[2]!, 'message.human').at(-1)).toMatchObject({ body: 'Nouveau message de Hugo.' });
  });

  it('heures calmes : un message à 23 h 10 attend 8 h', async () => {
    h.clock.set(T.night);
    await ps[1]!.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'it-notif-m5', body: 'Merci pour la soirée' });
    const before = pushesOf(ps[2]!, 'message.human').length;
    await plan(new Date(T.night.getTime() + 30_000));
    expect(pushesOf(ps[2]!, 'message.human').length).toBe(before);
    const q = await h.db.notification.findFirst({ where: { userId: ps[2]!.userId, templateKey: 'message.human', status: 'QUEUED' } });
    expect((q!.data as any).deliverAt).toBe('2026-11-20T07:00:00.000Z');
    await plan(T.morning);
    expect(pushesOf(ps[2]!, 'message.human').length).toBe(before + 1);
  });

  it('pause, catégorie coupée, appareil passé à un autre compte : rien ne sonne ; un autre reçoit', async () => {
    h.clock.set(new Date('2026-11-20T09:00:00Z'));
    expect((await ps[3]!.call('POST', '/v1/pauses', { days: 3 })).status).toBeLessThan(300);
    expect((await ps[3]!.call('GET', '/v1/me/notifications/settings')).body.paused).toBe(true);
    expect((await ps[4]!.call('PUT', '/v1/me/notifications/settings', { categories: { HUMAN_MESSAGE: false } })).body.categories.HUMAN_MESSAGE).toBe(false);
    // Le téléphone de Léa est réutilisé par Inès : Léa ne recevra plus rien sur cet appareil.
    expect((await ps[2]!.call('PUT', '/v1/me/push-token', { token: tokenOf(0), platform: 'ios' })).status).toBe(200);
    expect((await ps[0]!.call('GET', '/v1/me/notifications/settings')).body.pushRegistered).toBe(false);
    const counts = ps.map((p) => pushesOf(p).length);
    h.clock.set(new Date('2026-11-20T09:30:00Z'));
    await ps[1]!.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'it-notif-m6', body: 'Photo de groupe ?' });
    await plan(new Date('2026-11-20T09:30:30Z'));
    const reasons = Object.fromEntries(
      (await h.db.notification.findMany({ where: { templateKey: 'message.human', dedupKey: { contains: 'message.human:' }, createdAt: { gte: new Date('2026-11-20T09:30:00Z') } } })).map((r) => [r.userId, (r.data as any).reason ?? r.status]),
    );
    expect(reasons[ps[3]!.userId]).toBe('PAUSED');
    expect(reasons[ps[4]!.userId]).toBe('PREFERENCE');
    expect(reasons[ps[0]!.userId]).toBe('NO_DEVICE');
    expect(pushesOf(ps[2]!).length).toBeGreaterThan(counts[2]!);
    for (const i of [0, 3, 4]) expect(pushesOf(ps[i]!).length).toBe(counts[i]!);
  });

  it('confidentialité : la table ne garde aucun texte rendu ; boîte locale par personne', async () => {
    const rows = await h.db.notification.findMany({ where: { userId: { in: ps.map((p) => p.userId) } } });
    expect(rows.length).toBeGreaterThan(20);
    const dump = JSON.stringify(rows.map((r) => ({ d: r.data, k: r.templateKey, g: r.groupKey, dk: r.dedupKey })));
    for (const s of ['Café', 'Oiseaux', 'Hugo', 'Léa', 'Inès', 'Pet-notif', 'secret 4242', 'Photo de groupe', 'ExponentPushToken']) expect(dump, s).not.toContain(s);
    const mine = await ps[1]!.call('GET', '/v1/dev/push-inbox');
    expect(mine.status).toBe(200);
    expect(mine.body.items.length).toBeGreaterThan(0);
    expect(mine.body.items.every((e: any) => e.userId === ps[1]!.userId)).toBe(true);
  });
});
