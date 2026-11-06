/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON */
/**
 * V5 T5 — intégration `connections` (vraie base, vrai graphe Nest, horloge contrôlée) :
 *  - duo né d'une sortie (accord « plus ») : débloqué d'emblée, sans échéance 48 h / J+7 ;
 *  - « passer » silencieux ; double accord concurrent → un seul duo ; 1 duo actif gratuit (409) ;
 *  - blocage → duo CLOSED silencieux + accès révoqué, lien de bande retiré ;
 *  - « partir proprement » de la bande : 412 au 2ᵉ appel, chat fermé ;
 *  - « Ta rue » : cadeau d'un accessoire GAGNÉ seulement ; jamais la bande d'autrui ;
 *  - œuf : drapeau refusé hors éligibilité, actif seulement si les deux.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '@blowy/database';
import { DuoViewSchema } from '@blowy/api-contract';
import { CONNECTIONS_JOBS } from '../../src/modules/connections/connections.module.js';
import type { RecurringJob } from '../../src/jobs/scheduler.js';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';

let h: Harness;
const MONDAY = new Date('2026-11-16T09:30:00Z');
const LANE = new Date('2026-11-16T20:05:00Z');
let nbId = '';

beforeAll(async () => {
  h = await startHarness(MONDAY, process.env.C2_DEBUG ? { LOG_LEVEL: 'error' } : {});
  await h.reset();
  const zone = await h.db.zone.findUniqueOrThrow({ where: { code: 'PARIS_11' } });
  const n = await h.db.neighborhood.create({ data: { id: uuidv7(), slug: 'it-c2-paris', name: 'Paris 11e', city: 'Paris', cityZoneId: zone.id, timezone: 'Europe/Paris', status: 'LIVE' } });
  nbId = n.id;
  await h.db.venue.create({ data: { neighborhoodId: n.id, name: 'Café C2', addressLine: '1 rue C2', postalCode: '75011', city: 'Paris', lat: 48.8649, lng: 2.3707, offerKey: 'venue.offer.table_reserved', activities: ['GAMES'], tablesPerSlot: 3, accessibilityTags: [], checkinSecretRef: 'it-c2' } });
});
afterAll(async () => h?.close());

const job = (name: string) => h.app.get<RecurringJob[]>(CONNECTIONS_JOBS).find((j) => j.name === name)!;
const run = async (name: string, at: Date) => {
  h.clock.set(at);
  await job(name).run(at);
  await h.drain();
};

async function person(key: string, gender: 'WOMAN' | 'MAN', mode: 'GROUP' | 'DUO' | 'BOTH' = 'BOTH') {
  h.clock.set(MONDAY);
  const c = new TestClient(h);
  await onboard(c, key, { gender, seeking: [] });
  expect((await c.call('PUT', '/v1/me/neighborhood', { neighborhoodId: nbId })).status).toBe(200);
  await c.call('POST', '/v1/consents', { items: [{ purpose: 'SENSITIVE_PREFERENCES', version: '2026-11', granted: true }] });
  const r = await c.call('PUT', '/v1/preferences/intentions', { lookingFor: 'BOTH', storySeriousness: 'SEE_HOW_IT_GOES', kidsSomeday: null, meetingMode: mode, meetGenders: [], romanceGenders: [gender === 'WOMAN' ? 'MAN' : 'WOMAN'] });
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  await h.db.mediaAsset.create({ data: { ownerUserId: c.userId, purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `it/${key}.jpg`, retentionClass: 'PROFILE_PHOTO', finalizedAt: MONDAY } });
  return c;
}

const lo = (a: string, b: string) => (a < b ? [a, b] : [b, a]) as [string, string];

describe('connections V5 (intégration)', () => {
  let a: TestClient, b: TestClient, c: TestClient, g: TestClient;

  it('voie Duo : jamais « en petit groupe » ; passer est silencieux ; double accord concurrent → un seul duo', async () => {
    a = await person('itc2a', 'MAN');
    b = await person('itc2b', 'WOMAN');
    g = await person('itc2g', 'WOMAN', 'GROUP');
    await run('duos.lane', LANE);
    const fa = (await a.call('GET', '/v1/duo-lane')).body;
    expect(fa.items).toHaveLength(1);
    expect((await g.call('GET', '/v1/duo-lane')).body).toMatchObject({ items: [], emptyReason: 'LANE_DISABLED' });
    const pid = fa.items[0].proposalId;
    expect(await h.db.matchProposal.count({ where: { kind: 'DUO_LANE', OR: [{ userLowId: g.userId }, { userHighId: g.userId }] } })).toBe(0);
    const k = randomUUID();
    await a.call('POST', `/v1/duo-lane/proposals/${pid}/accept`, {}, { commandId: k });
    const again = await a.call('POST', `/v1/duo-lane/proposals/${pid}/accept`, {}, { commandId: k });
    expect(again.body).toEqual({ status: 'WAITING_OTHER', duoId: null });
    const [r1, r2] = await Promise.all([b.call('POST', `/v1/duo-lane/proposals/${pid}/accept`, {}), b.call('POST', `/v1/duo-lane/proposals/${pid}/accept`, {})]);
    const ok = [r1, r2].filter((r) => r.status === 200);
    expect(ok.length).toBeGreaterThan(0);
    expect(new Set(ok.map((r) => r.body.duoId)).size).toBe(1);
    const [low, high] = lo(a.userId, b.userId);
    expect(await h.db.duo.count({ where: { userLowId: low, userHighId: high } })).toBe(1);
    DuoViewSchema.parse((await a.call('GET', `/v1/duos/${ok[0]!.body.duoId}`)).body);
  });

  it('1 duo actif gratuit : une autre proposition acceptée → 409 DUO_LIMIT_REACHED', async () => {
    c = await person('itc2c', 'WOMAN');
    const batch = await h.db.matchBatch.findFirstOrThrow({ where: { kind: 'DUO_LANE' } });
    const [pa, pc] = await Promise.all([h.db.pet.findUniqueOrThrow({ where: { primaryOwnerId: a.userId } }), h.db.pet.findUniqueOrThrow({ where: { primaryOwnerId: c.userId } })]);
    const [pl, ph] = pa.id < pc.id ? [pa, pc] : [pc, pa];
    const p = await h.db.matchProposal.create({ data: { batchId: batch.id, petLowId: pl.id, petHighId: ph.id, userLowId: pl.primaryOwnerId!, userHighId: ph.primaryOwnerId!, kind: 'DUO_LANE', visionScore: 70, rankScore: 70, breakdown: {}, expiresAt: new Date(LANE.getTime() + 48 * 3_600_000) } });
    const r = await a.call('POST', `/v1/duo-lane/proposals/${p.id}/accept`, {});
    expect([r.status, r.body.detailsSafe?.reason]).toEqual([409, 'DUO_LIMIT_REACHED']);
    // Passer : silencieux, la proposition reste ouverte chez l'autre.
    expect((await c.call('POST', `/v1/duo-lane/proposals/${p.id}/pass`, {})).body).toEqual({ status: 'PASSED' });
    expect((await c.call('GET', '/v1/duo-lane')).body.items).toEqual([]);
    expect((await a.call('GET', '/v1/duo-lane')).body.items.map((i: any) => i.proposalId)).toContain(p.id);
    expect(await h.db.projectionEntry.count({ where: { recipientId: a.userId, aggregateId: p.id } })).toBe(0);
  });

  it('duo né d’une sortie : débloqué, sans échéance ; œuf refusé hors éligibilité puis actif à deux', async () => {
    const [low, high] = lo(b.userId, c.userId);
    const id = uuidv7();
    await h.db.duo.create({ data: { id, userLowId: low, userHighId: high, origin: 'OUTING_VOTE', status: 'UNLOCKED' } });
    await h.db.conversation.create({ data: { kind: 'DUO', duoId: id, members: { create: [low, high].map((userId) => ({ userId, joinedAt: MONDAY })) } } });
    await run('duos.lifecycle', new Date(MONDAY.getTime() + 30 * 86_400_000));
    const v = (await c.call('GET', `/v1/duos/${id}`)).body;
    expect(v.status).toBe('UNLOCKED');
    expect(v.dateDeadline).toBeUndefined();
    expect(v.exchange).toBeUndefined();
    expect((await c.call('PUT', `/v1/duos/${id}/egg`, { enabled: true })).body.detailsSafe?.reason).toBe('EGG_NOT_ELIGIBLE');
    await h.db.duo.update({ where: { id }, data: { status: 'TOGETHER', together: true, datesAttended: 2 } });
    expect((await c.call('PUT', `/v1/duos/${id}/egg`, { enabled: true })).body).toEqual({ myOptIn: true, active: false, eligible: true });
    // L'autre ne voit jamais le choix de c seul.
    expect((await b.call('GET', `/v1/duos/${id}`)).body.egg).toEqual({ myOptIn: false, active: false, eligible: true });
    expect((await b.call('PUT', `/v1/duos/${id}/egg`, { enabled: true })).body.active).toBe(true);
  });

  it('blocage : duo fermé sans message, accès retiré ; lien de bande retiré', async () => {
    const [low, high] = lo(b.userId, c.userId);
    const f = await h.db.friendship.create({ data: { userLowId: low, userHighId: high, status: 'ACTIVE', invitedById: low, origin: 'OUTING_VOTE', acceptedAt: MONDAY } });
    await h.db.conversation.create({ data: { kind: 'BAND', friendshipId: f.id, members: { create: [low, high].map((userId) => ({ userId, joinedAt: MONDAY })) } } });
    const [la, hc] = lo(a.userId, c.userId);
    const fac = await h.db.friendship.create({ data: { userLowId: la, userHighId: hc, status: 'ACTIVE', invitedById: la, origin: 'OUTING_VOTE', acceptedAt: MONDAY } });
    await h.db.conversation.create({ data: { kind: 'BAND', friendshipId: fac.id, members: { create: [la, hc].map((userId) => ({ userId, joinedAt: MONDAY })) } } });
    const duoBC = (await c.call('GET', '/v1/duos')).body.items.find((d: any) => d.other.firstName === 'itc2b');
    expect(duoBC.status).toBe('TOGETHER');
    const petB = await h.db.pet.findUniqueOrThrow({ where: { primaryOwnerId: b.userId } });
    expect((await c.call('POST', '/v1/blocks', { target: { petId: petB.id } })).status).toBeLessThan(300);
    await h.drain();
    expect((await b.call('GET', `/v1/duos/${duoBC.id}`)).status).toBe(404);
    const d = await h.db.duo.findUniqueOrThrow({ where: { id: duoBC.id }, include: { conversation: { include: { members: true, messages: true } } } });
    expect(d.status).toBe('CLOSED');
    expect(d.conversation!.members.every((m) => m.revokedAt)).toBe(true);
    expect(d.conversation!.messages.filter((m) => m.kind === 'SYSTEM')).toEqual([]);
    expect((await h.db.friendship.findUniqueOrThrow({ where: { id: f.id } })).status).toBe('WITHDRAWN');
    // Bande a↔c intacte ; « Ta rue » de a montre c, jamais la bande de c.
    const street = (await a.call('GET', '/v1/band/street')).body;
    expect(street.residents.map((r: any) => r.firstName)).toEqual(['itc2c']);
  });

  it('« Ta rue » : cadeau d’un accessoire gagné seulement, visible chez le destinataire ; partir proprement', async () => {
    const link = (await a.call('GET', '/v1/band')).body.items[0];
    const r = await a.call('POST', '/v1/band/street/gifts', { linkId: link.linkId, accessoryId: 'scarf_red' });
    expect(r.body.detailsSafe?.reason).toBe('ACCESSORY_NOT_UNLOCKED');
    const pet = await h.db.pet.findUniqueOrThrow({ where: { primaryOwnerId: a.userId } });
    await h.db.petAccessory.create({ data: { petId: pet.id, accessoryId: 'scarf_red', source: 'MEMORY', unlockedAt: MONDAY } });
    expect((await a.call('POST', '/v1/band/street/gifts', { linkId: link.linkId, accessoryId: 'scarf_red' })).body).toEqual({ status: 'GIVEN' });
    expect((await a.call('POST', '/v1/band/street/gifts', { linkId: link.linkId, accessoryId: 'scarf_red' })).body).toEqual({ status: 'GIVEN' });
    const sc = (await c.call('GET', '/v1/band/street')).body;
    expect(sc.gifts).toHaveLength(1);
    expect(sc.gifts[0]).toMatchObject({ accessoryId: 'scarf_red', fromPetName: pet.name });
    expect(await h.db.projectionEntry.count({ where: { recipientId: c.userId, type: { contains: 'gift' } } })).toBe(0);
    expect((await c.call('POST', `/v1/band/${link.linkId}/leave`, {})).body).toEqual({ linkId: link.linkId, status: 'WITHDRAWN' });
    expect((await a.call('POST', `/v1/band/${link.linkId}/leave`, {})).body.detailsSafe?.reason).toBe('ALREADY_LEFT');
    expect((await a.call('GET', '/v1/band')).body.items).toEqual([]);
    expect((await c.call('GET', '/v1/band/street')).body.gifts).toEqual([]);
    expect((await g.call('POST', `/v1/band/${link.linkId}/leave`, {})).status).toBe(404);
  });
});
