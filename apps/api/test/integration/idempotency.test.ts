/** §21 n°2 : commande rejouée / double tap — aucun effet dupliqué ; même clé + payload différent = conflit. */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { onboard, startHarness, TestClient, VISION, type Harness } from './harness.js';
import { matchedPair } from './fixtures.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
  await h.reset();
});
afterAll(async () => h?.close());

describe('idempotence des commandes', () => {
  it('rejoue une commande identique sans double effet et refuse un payload différent', async () => {
    const c = new TestClient(h);
    await c.signIn('idem.1');
    await c.call('PATCH', '/v1/me', { birthDate: '1995-01-01', zoneCode: 'PARIS_11' });
    const cid = randomUUID();
    const body = { name: 'Rejoue', species: 'GASTON', vision: VISION };
    const [r1, r2] = await Promise.all([c.call('POST', '/v1/pets', body, { commandId: cid }), c.call('POST', '/v1/pets', body, { commandId: cid })]);
    const statuses = [r1.status, r2.status].sort();
    // Double tap concurrent : un succès ; l'autre rejoue (201) ou voit « en cours » (409 retryable).
    expect(statuses[0]).toBe(201);
    const r3 = await c.call('POST', '/v1/pets', body, { commandId: cid });
    expect(r3.status).toBe(201);
    expect(await h.db.pet.count({ where: { primaryOwnerId: c.userId } })).toBe(1);
    const conflict = await c.call('POST', '/v1/pets', { ...body, name: 'Autre' }, { commandId: cid });
    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe('IDEMPOTENCY_CONFLICT');
    // Nouvelle commande : contrainte « un pet principal par personne ».
    const again = await c.call('POST', '/v1/pets', body);
    expect(again.status).toBe(409);
  });

  it('double tap sur l’envoi de message : un seul message (clientMessageId)', async () => {
    const m = await matchedPair(h, 'idem');
    const body = { clientMessageId: 'tap-tap-0001', body: 'Un seul exemplaire' };
    const rs = await Promise.all([m.a.call('POST', `/v1/conversations/${m.convId}/messages`, body), m.a.call('POST', `/v1/conversations/${m.convId}/messages`, body)]);
    expect(rs.some((r) => r.status === 201)).toBe(true);
    // Renvoi hors ligne avec un autre commandId mais même clientMessageId → même message.
    const r3 = await m.a.call('POST', `/v1/conversations/${m.convId}/messages`, body);
    expect(r3.status).toBe(201);
    expect(await h.db.message.count({ where: { clientMessageId: 'tap-tap-0001' } })).toBe(1);
  });

  it('acceptation de proposition rejouée : une seule relation', async () => {
    const a = new TestClient(h);
    const b = new TestClient(h);
    await onboard(a, 'idem.pa', { gender: 'WOMAN', seeking: ['MAN'] });
    await onboard(b, 'idem.pb', { gender: 'MAN', seeking: ['WOMAN'] });
    const feed = await a.call('POST', '/v1/matches/onboarding-batch', {});
    const bPet = (await b.call('GET', '/v1/pets/mine')).body.id;
    const p = feed.body.items.find((i: { otherPet: { id: string } }) => i.otherPet.id === bPet);
    await a.call('POST', `/v1/match-proposals/${p.id}/accept`, {});
    const cid = randomUUID();
    const [x, y] = await Promise.all([b.call('POST', `/v1/match-proposals/${p.id}/accept`, {}, { commandId: cid }), b.call('POST', `/v1/match-proposals/${p.id}/accept`, {})]);
    expect([x.body.status, y.body.status].filter(Boolean)).toContain('MATCHED');
    expect(await h.db.relationshipContext.count({ where: { sides: { some: { userId: b.userId } } } })).toBe(1);
  });

  it('relais outbox rejoué : effet consommateur appliqué une seule fois', async () => {
    await h.drain();
    const before = await h.db.consumerDeduplication.count();
    await h.db.outboxEvent.updateMany({ data: { publishedAt: null } }); // simule une redélivrance totale
    await h.drain();
    expect(await h.db.consumerDeduplication.count()).toBe(before);
  });
});
