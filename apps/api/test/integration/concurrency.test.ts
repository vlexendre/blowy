/**
 * §21 n°3 : deux acceptations simultanées n'excèdent pas la capacité (1 slot gratuit) ;
 * deux emménagements concurrents ne créent qu'une exclusivité.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';
import { matchUsers, setLevel } from './fixtures.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
  await h.reset();
});
afterAll(async () => h?.close());

async function liveDates(userId: string) {
  return h.db.relationshipContext.count({ where: { type: 'DATE', status: { not: 'ENDED' }, sides: { some: { userId, active: true } } } });
}

describe('concurrence', () => {
  it('deux secondes acceptations simultanées ne dépassent pas 1 slot', async () => {
    const hub = new TestClient(h);
    const x = new TestClient(h);
    const y = new TestClient(h);
    await onboard(hub, 'cc.hub', { gender: 'WOMAN', seeking: ['MAN'] });
    await onboard(x, 'cc.x', { gender: 'MAN', seeking: ['WOMAN'] });
    await onboard(y, 'cc.y', { gender: 'MAN', seeking: ['WOMAN'] });
    const feed = await hub.call('POST', '/v1/matches/onboarding-batch', {});
    expect(feed.body.items.length).toBe(2);
    // x et y acceptent d'abord ; hub accepte les deux en même temps (chacune = seconde acceptation).
    for (const p of feed.body.items) {
      const owner = p.otherPet.id === (await x.call('GET', '/v1/pets/mine')).body.id ? x : y;
      await owner.call('POST', `/v1/match-proposals/${p.id}/accept`, {});
    }
    const rs = await Promise.all(feed.body.items.map((p: { id: string }) => hub.call('POST', `/v1/match-proposals/${p.id}/accept`, {})));
    const matched = rs.filter((r) => r.body.status === 'MATCHED');
    expect(matched).toHaveLength(1);
    expect(rs.some((r) => r.status === 409 && r.body.code === 'CAPACITY_EXCEEDED')).toBe(true);
    expect(await liveDates(hub.userId)).toBe(1);
  });

  it('deux emménagements concurrents : une seule exclusivité', async () => {
    // P (Blowy+ démo : 3 slots) a deux rendez-vous N3 : avec Q et avec R.
    const p = new TestClient(h);
    const q = new TestClient(h);
    const r = new TestClient(h);
    await onboard(p, 'mv.p', { gender: 'WOMAN', seeking: ['MAN'] });
    await h.db.entitlementGrant.create({ data: { beneficiaryUserId: p.userId, entitlementId: 'blowy_plus', source: 'LOCAL_DEMO', environment: 'LOCAL_DEMO', startsAt: new Date('2026-01-01') } });
    await onboard(q, 'mv.q', { gender: 'MAN', seeking: ['WOMAN'] });
    const relQ = await matchUsers(h, p, q);
    await onboard(r, 'mv.r', { gender: 'MAN', seeking: ['WOMAN'] });
    const relR = await matchUsers(h, r, p);
    await setLevel(h, relQ, 3);
    await setLevel(h, relR, 3);
    // Q et R proposent ; P accepte les deux simultanément.
    const oq = await q.call('POST', `/v1/relationships/${relQ}/move-in`, {});
    const or = await r.call('POST', `/v1/relationships/${relR}/move-in`, {});
    expect(oq.status).toBe(201);
    expect(or.status).toBe(201);
    const offer = (rel: { pendingOffers: { id: string; version: number; scope: string }[] }) => rel.pendingOffers.find((o) => o.scope === 'MOVE_IN')!;
    const offQ = offer((await p.call('GET', `/v1/relationships/${relQ}`)).body);
    const offR = offer((await p.call('GET', `/v1/relationships/${relR}`)).body);
    const [aq, ar] = await Promise.all([
      p.call('POST', `/v1/relationships/${relQ}/consents/respond`, { offerId: offQ.id, decision: 'ACCEPT', version: offQ.version }),
      p.call('POST', `/v1/relationships/${relR}/consents/respond`, { offerId: offR.id, decision: 'ACCEPT', version: offR.version }),
    ]);
    const ok = [aq, ar].filter((x) => x.status === 201 && x.body.status === 'MOVED_IN');
    expect(ok).toHaveLength(1);
    const loser = [aq, ar].find((x) => x !== ok[0])!;
    expect(loser.status).toBe(412);
    expect(await h.db.relationshipSide.count({ where: { userId: p.userId, exclusive: true, active: true } })).toBe(1);
    // L'autre rendez-vous a été clôturé avec un message système pré-écrit.
    const movedRel = ok[0] === aq ? relQ : relR;
    const otherRel = movedRel === relQ ? relR : relQ;
    const closed = await h.db.relationshipContext.findUniqueOrThrow({ where: { id: otherRel }, include: { conversation: { include: { messages: true } } } });
    expect(closed.status).toBe('ENDED');
    expect(closed.endReason).toBe('MOVED_IN_ELSEWHERE');
    expect(closed.conversation!.messages.some((m) => m.systemTemplate === 'system.leave.moved_in_elsewhere')).toBe(true);
    // Les pets emménagés sont à la maison commune.
    const loc = await h.db.virtualLocation.findUniqueOrThrow({ where: { petId: (await p.call('GET', '/v1/pets/mine')).body.id } });
    expect(loc).toMatchObject({ kind: 'SHARED_HOME', contextId: movedRel });
  });
});
