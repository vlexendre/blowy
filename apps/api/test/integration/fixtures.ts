/** Fixtures d'intégration construites par l'API (aucune écriture directe sauf mention). */
import { onboard, TestClient, type Harness } from './harness.js';

export interface Matched {
  a: TestClient;
  b: TestClient;
  aPet: string;
  bPet: string;
  relId: string;
  convId: string;
}

let n = 0;
/** Crée deux comptes onboardés et une relation par double acceptation. */
export async function matchedPair(h: Harness, prefix = 'u'): Promise<Matched> {
  const k = `${prefix}${++n}`;
  const a = new TestClient(h);
  const b = new TestClient(h);
  const ra = await onboard(a, `${k}.a`, { gender: 'WOMAN', seeking: ['MAN'] });
  const rb = await onboard(b, `${k}.b`, { gender: 'MAN', seeking: ['WOMAN'] });
  const relId = await matchUsers(h, a, b);
  const rel = await a.call('GET', `/v1/relationships/${relId}`);
  return { a, b, aPet: ra.petId, bPet: rb.petId, relId, convId: rel.body.conversationId };
}

/** Lance un lot d'onboarding ciblé et accepte des deux côtés la proposition entre a et b. */
export async function matchUsers(h: Harness, a: TestClient, b: TestClient): Promise<string> {
  const feed = await a.call('POST', '/v1/matches/onboarding-batch', {});
  const bPet = (await b.call('GET', '/v1/pets/mine')).body.id;
  const p = feed.body.items.find((i: { otherPet: { id: string } }) => i.otherPet.id === bPet);
  if (!p) throw new Error(`aucune proposition a→b : ${JSON.stringify(feed.body)}`);
  await a.call('POST', `/v1/match-proposals/${p.id}/accept`, {});
  const r = await b.call('POST', `/v1/match-proposals/${p.id}/accept`, {});
  if (r.body.status !== 'MATCHED') throw new Error(JSON.stringify(r.body));
  return r.body.relationshipId;
}

/** Fixture explicite : force le niveau atteint (pour tester les portes N3) — écriture de test documentée. */
export async function setLevel(h: Harness, relId: string, level: number) {
  const th = [0, 150, 500, 900, 1400, 2000, 3000][level - 1]!;
  await h.db.relationshipContext.update({ where: { id: relId }, data: { reachedLevel: level, eligibleLevel: level, xpMilli: th * 1000 } });
}
