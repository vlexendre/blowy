/**
 * §21 n°3 : deux acceptations simultanées n'excèdent pas la capacité (1 slot gratuit) ;
 * V5 : l'emménagement est retiré (410) ; voir connections-v5 pour l'équivalent duo.
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

  it('V5 : emménagement concurrent retiré (410, aucune exclusivité créée) — l’équivalent V5 « deux accords simultanés → un seul duo, 1 duo gratuit » est couvert par connections-v5', async () => {
    const p = new TestClient(h);
    const q = new TestClient(h);
    await onboard(p, 'mv.p', { gender: 'WOMAN', seeking: ['MAN'] });
    await onboard(q, 'mv.q', { gender: 'MAN', seeking: ['WOMAN'] });
    const relQ = await matchUsers(h, p, q);
    await setLevel(h, relQ, 3);
    const [a, b] = await Promise.all([q.call('POST', `/v1/relationships/${relQ}/move-in`, {}), p.call('POST', `/v1/relationships/${relQ}/move-in`, {})]);
    for (const r of [a, b]) expect([r.status, r.body.detailsSafe?.reason]).toEqual([410, 'RETIRED_IN_V5']);
    expect(await h.db.relationshipSide.count({ where: { userId: p.userId, exclusive: true, active: true } })).toBe(0);
  });
});
