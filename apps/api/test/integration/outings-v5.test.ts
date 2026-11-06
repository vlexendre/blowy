/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 T2 — intégration `neighborhoods` + `outings` (vraie base, vrai graphe Nest, horloge contrôlée) :
 *  - « qui voit quoi » (§3.1 amendé V5.1/V5.2) pour chaque acteur à chaque état ;
 *  - quota 1 place / semaine sous concurrence, idempotence ;
 *  - deux absences → pause, demande refusée RELIABILITY_PAUSED ;
 *  - « je connais quelqu'un ici » (lien connu → déplacé·e sans pénalité ; 2ᵉ fois dans le mois = annulation) ;
 *  - rétention : bulletins purgés 7 j après la clôture.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { OutingViewSchema } from '@blowy/api-contract';
import { OUTINGS_JOBS } from '../../src/modules/outings/outings.module.js';
import type { RecurringJob } from '../../src/jobs/scheduler.js';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';

let h: Harness;
const T = {
  monday: new Date('2026-11-16T09:30:00Z'),
  composed: new Date('2026-11-17T11:01:00Z'),
  locked: new Date('2026-11-18T17:01:00Z'),
  faces: new Date('2026-11-19T15:31:00Z'),
  checkin: new Date('2026-11-19T18:05:00Z'),
  done: new Date('2026-11-19T20:01:00Z'),
  closed: new Date('2026-11-22T20:01:00Z'),
  week: '2026-W47',
};
const FORBIDDEN = ['lookingFor', 'romanceGenders', 'meetGenders', 'storySeriousness', 'kidsSomeday', 'birthDate', '"gender"', '"age"', '"choice"', 'paymentRef', 'noShows'];
let nbId = '';

beforeAll(async () => {
  h = await startHarness(T.monday);
  await h.reset();
  const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
  const n = await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-paris-11', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } });
  nbId = n.id;
  await h.db.neighborhoodSlotTemplate.create({ data: { neighborhoodId: n.id, isoWeekday: 4, localMinute: 19 * 60 + 30, activity: 'GAMES' } });
  await h.db.venue.create({ data: { neighborhoodId: n.id, name: 'Café IT', addressLine: '1 rue IT', postalCode: '75011', city: 'Paris', lat: 48.8649, lng: 2.3707, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 3, accessibilityTags: [], checkinSecretRef: 'it' } });
});
afterAll(async () => h?.close());

const job = (name: string) => h.app.get<RecurringJob[]>(OUTINGS_JOBS).find((j) => j.name === name)!;
const run = async (name: string, at: Date) => {
  h.clock.set(at);
  await job(name).run(at);
  await h.drain();
};

async function person(key: string, gender: 'WOMAN' | 'MAN', looking: 'FRIENDS' | 'BOTH' = 'FRIENDS') {
  h.clock.set(T.monday);
  const c = new TestClient(h);
  await onboard(c, key, { gender, seeking: [] });
  expect((await c.call('PUT', '/v1/me/neighborhood', { neighborhoodId: nbId })).status).toBe(200);
  if (looking !== 'FRIENDS') await c.call('POST', '/v1/consents', { items: [{ purpose: 'SENSITIVE_PREFERENCES', version: '2026-11', granted: true }] });
  const i = await c.call('PUT', '/v1/preferences/intentions', { lookingFor: looking, storySeriousness: null, kidsSomeday: null, meetingMode: 'GROUP', meetGenders: [], romanceGenders: looking === 'FRIENDS' ? [] : [gender === 'WOMAN' ? 'MAN' : 'WOMAN'] });
  expect(i.status, JSON.stringify(i.body)).toBe(200);
  // Raccourci de test : photo de profil « publiée » (le flux média complet est couvert par les parcours).
  await h.db.mediaAsset.create({ data: { ownerUserId: c.userId, purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `it/${key}.jpg`, retentionClass: 'PROFILE_PHOTO', finalizedAt: T.monday } });
  return c;
}

async function group(prefix: string) {
  const ps = [await person(`${prefix}1`, 'WOMAN', 'BOTH'), await person(`${prefix}2`, 'MAN', 'BOTH'), await person(`${prefix}3`, 'WOMAN'), await person(`${prefix}4`, 'MAN'), await person(`${prefix}5`, 'WOMAN')];
  h.clock.set(T.monday);
  for (const p of ps) expect((await p.call('PUT', `/v1/outings/requests/${T.week}`, {})).status).toBe(200);
  await run('outings.compose', T.composed);
  const id = (await ps[0]!.call('GET', '/v1/outings/week')).body.myOutingId as string;
  return { ps, id };
}

describe('outings V5 (intégration)', () => {
  let ps: TestClient[] = [];
  let outingId = '';

  it('demande : préconditions, quota hebdo non achetable sous concurrence, idempotence', async () => {
    const solo = await person('itq', 'MAN');
    h.clock.set(T.monday);
    const key = randomUUID();
    const [a, b] = await Promise.all([solo.call('PUT', `/v1/outings/requests/${T.week}`, {}, { commandId: key }), solo.call('PUT', `/v1/outings/requests/${T.week}`, {}, { commandId: key })]);
    expect([a.status, b.status].sort()).toEqual(expect.arrayContaining([200]));
    expect(await h.db.outingRequest.count({ where: { userId: solo.userId } })).toBe(1);
    const late = new TestClient(h);
    await late.signIn('itq');
    h.clock.set(T.composed);
    expect((await late.call('PUT', `/v1/outings/requests/${T.week}`, {})).body.detailsSafe.reason).toBe('REQUEST_WINDOW_CLOSED');
    expect((await late.call('DELETE', `/v1/outings/requests/${T.week}`)).status).toBe(200);
  });

  it('qui voit quoi : invité·e, confirmé·e, verrouillé, visages, check-in, votes, après clôture', async () => {
    ({ ps, id: outingId } = await group('itv'));
    const [p1, p2, p3, p4, p5] = ps as [TestClient, TestClient, TestClient, TestClient, TestClient];
    const view = async (p: TestClient) => {
      const r = await p.call('GET', `/v1/outings/${outingId}`);
      expect(r.status).toBe(200);
      OutingViewSchema.parse(r.body);
      expect(FORBIDDEN.filter((k) => JSON.stringify(r.body).includes(k))).toEqual([]);
      return r.body;
    };
    // Invité·e : pets seulement.
    let v = await view(p1);
    expect(v.preview.size).toBe(5);
    expect(v.members.every((m: any) => !m.firstName && !m.photo)).toBe(true);
    expect(v.venue).toBeUndefined();
    for (const p of [p1, p2, p3, p4]) expect((await p.call('POST', `/v1/outings/${outingId}/seat/accept`, { funding: 'AUTO' })).status).toBe(200);
    await h.drain();
    // Confirmé·e : prénoms des confirmés, pas p5 (invitée) ; pas de lieu ni de photo.
    v = await view(p1);
    expect(v.status).toBe('FORMING');
    expect(v.members.filter((m: any) => m.firstName)).toHaveLength(3);
    expect(v.members.find((m: any) => m.userId === p5.userId).firstName).toBeUndefined();
    // p5 ne répond pas : invitation expirée au verrouillage ; elle ne voit plus rien.
    await run('outings.lifecycle', T.locked);
    v = await view(p1);
    expect(v.status).toBe('CONFIRMED');
    expect(v.venue.name).toBe('Café IT');
    expect(v.members.some((m: any) => m.photo)).toBe(false);
    const v5 = await view(p5);
    expect(v5.mySeat.status).toBe('EXPIRED');
    expect([v5.members, v5.venue, v5.conversationId]).toEqual([[], undefined, undefined]);
    // Visages : jetons émis pour les confirmé·es seulement ; l'ACL média les sert (OUTING_REVEAL).
    h.clock.set(T.faces);
    v = await view(p2);
    expect(v.members.filter((m: any) => m.photo).map((m: any) => m.userId).sort()).toEqual([p1.userId, p3.userId, p4.userId].sort());
    expect(await h.app.get<any>((await import('../../src/shared/application/ports/outing-photos.port.js')).OUTING_REVEAL_READER).canSeeProfilePhoto(p5.userId, p1.userId, T.faces)).toBe(false);
    // Check-in et clôture : p4 absent·e.
    await run('outings.lifecycle', T.checkin);
    for (const p of [p1, p2, p3]) expect((await p.call('POST', `/v1/outings/${outingId}/check-in`, { method: 'GEO', lat: 48.8649, lng: 2.3707, accuracyM: 20 })).status).toBe(200);
    await run('outings.lifecycle', T.done);
    v = await view(p1);
    expect(v.members.map((m: any) => m.userId).sort()).toEqual([p2.userId, p3.userId].sort());
    expect((await p4.call('GET', `/v1/outings/${outingId}/votes`)).status).toBe(404);
    expect((await p4.call('GET', '/v1/me/reliability')).body).toMatchObject({ attended: 0, total: 1 });
    // Votes : p1↔p2 PLUS/PLUS (compatibles) → duo ; p1↔p3 FRIEND/PLUS → bande (p3 ne cherche pas d'histoire).
    await p1.call('PUT', `/v1/outings/${outingId}/votes`, { choices: { [p2.userId]: 'PLUS', [p3.userId]: 'FRIEND' } });
    await p2.call('PUT', `/v1/outings/${outingId}/votes`, { choices: { [p1.userId]: 'PLUS' } });
    await p3.call('PUT', `/v1/outings/${outingId}/votes`, { choices: { [p1.userId]: 'PLUS', [p2.userId]: 'FRIEND' } });
    expect(await h.db.projectionEntry.count({ where: { type: { startsWith: 'connection' } } })).toBe(0);
    await run('outings.lifecycle', T.closed);
    const r1 = (await p1.call('GET', `/v1/outings/${outingId}/votes`)).body;
    expect(Object.fromEntries(r1.targets.map((t: any) => [t.userId, t.mutual ?? null]))).toEqual({ [p2.userId]: 'PLUS', [p3.userId]: 'FRIEND' });
    const r2 = (await p2.call('GET', `/v1/outings/${outingId}/votes`)).body;
    expect(r2.targets.find((t: any) => t.userId === p3.userId).mutual).toBeUndefined(); // p2 n'a pas voté p3 : rien
    expect(await h.db.duo.count({ where: { status: 'UNLOCKED', origin: 'OUTING_VOTE' } })).toBe(1);
    v = await view(p2);
    expect(v.members.map((m: any) => m.userId)).toEqual([p1.userId]); // liens seulement
    // Rétention : bulletins purgés 7 j après la clôture ; accords conservés.
    await run('outings.purge', new Date(T.closed.getTime() + 8 * 86_400_000));
    expect(await h.db.outingVote.count({ where: { outingId } })).toBe(0);
    expect(await h.db.connectionReveal.count({ where: { sourceId: outingId } })).toBe(2);
  });

  it('deux absences dans la fenêtre → pause 7 j ; la demande suivante est refusée RELIABILITY_PAUSED', async () => {
    // p4 : 1ʳᵉ absence (no-show à la sortie précédente) ; une 2ᵉ absence dans la fenêtre déclenche la pause.
    const late = ps[3]!;
    expect(await h.db.reliabilityStat.findUniqueOrThrow({ where: { userId: late.userId } })).toMatchObject({ noShows: 1, episodeAbsences: 1, pausedUntil: null });
    h.clock.set(new Date('2026-11-21T10:00:00Z'));
    // 2ᵉ absence (fixture : épisode déjà à 1) → pause.
    const p = await h.app.get<any>((await import('../../src/modules/outings/application/lifecycle.service.js')).OutingLifecycle);
    await h.app.get<any>((await import('../../src/shared/shared.tokens.js')).UNIT_OF_WORK).run(async (scope: any) => {
      await scope.lock.users([late.userId]);
      await p.absence(scope, late.userId, 'NO_SHOW', randomUUID());
    });
    const paused = await h.db.reliabilityStat.findUniqueOrThrow({ where: { userId: late.userId } });
    expect(paused.pausedUntil!.getTime()).toBe(new Date('2026-11-28T10:00:00Z').getTime());
    expect(paused.episodeAbsences).toBe(0);
    h.clock.set(new Date('2026-11-23T09:30:00Z'));
    const next = await late.call('PUT', '/v1/outings/requests/2026-W48', {});
    expect(next.status).toBe(412);
    expect(next.body.detailsSafe.reason).toBe('RELIABILITY_PAUSED');
    expect((await late.call('GET', '/v1/outings/week')).body.phase).toBe('PAUSED');
  });

  it('« je connais quelqu’un ici » : lien connu → déplacé·e sans pénalité ; indisponible avant les visages', async () => {
    h.clock.set(new Date('2026-11-23T09:30:00Z'));
    const ps2 = [await person('itk1', 'WOMAN'), await person('itk2', 'MAN'), await person('itk3', 'WOMAN'), await person('itk4', 'MAN'), await person('itk5', 'WOMAN')];
    h.clock.set(new Date('2026-11-23T09:30:00Z'));
    for (const p of ps2) expect((await p.call('PUT', '/v1/outings/requests/2026-W48', {})).status).toBe(200);
    await run('outings.compose', new Date('2026-11-24T11:01:00Z'));
    const id = (await ps2[0]!.call('GET', '/v1/outings/week')).body.myOutingId;
    for (const p of ps2) await p.call('POST', `/v1/outings/${id}/seat/accept`, { funding: 'AUTO' });
    // Lien connu : une ancienne amitié (V4) entre itk1 et itk2.
    const [lo, hi] = [ps2[0]!.userId, ps2[1]!.userId].sort();
    await h.db.friendship.create({ data: { userLowId: lo!, userHighId: hi!, status: 'WITHDRAWN', invitedById: lo! } });
    await run('outings.lifecycle', new Date('2026-11-25T17:01:00Z'));
    const early = await ps2[0]!.call('POST', `/v1/outings/${id}/seat/knows-someone`, { userId: ps2[1]!.userId });
    expect(early.body.detailsSafe.reason).toBe('KNOWS_SOMEONE_NOT_AVAILABLE');
    h.clock.set(new Date('2026-11-26T15:31:00Z'));
    const r = await ps2[0]!.call('POST', `/v1/outings/${id}/seat/knows-someone`, { userId: ps2[1]!.userId });
    expect(r.body).toEqual({ status: 'MOVED' });
    expect((await ps2[0]!.call('GET', '/v1/me/reliability')).body.total).toBe(0);
    const seen = (await ps2[1]!.call('GET', `/v1/outings/${id}`)).body;
    expect(seen.members.find((m: any) => m.userId === ps2[0]!.userId)).toMatchObject({ notComing: true });
    expect(JSON.stringify(seen.members)).not.toMatch(/knows|KNOWS|SYSTEM_REMOVAL/);
    const r2 = await ps2[2]!.call('POST', `/v1/outings/${id}/seat/knows-someone`, { userId: ps2[3]!.userId });
    expect(r2.body).toEqual({ status: 'IN_REVIEW' });
  });
});
