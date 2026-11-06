/* eslint-disable @typescript-eslint/no-explicit-any -- vues JSON des tests V4 */
/** Fixtures d'intégration construites par l'API (aucune écriture directe sauf mention). */
import { MatchFeedSchema } from '@blowy/api-contract';
import { GetMatchFeedQuery } from '../../src/modules/matching/application/get-match-feed.query.js';
import { RequestOnboardingBatchUseCase } from '../../src/modules/matching/application/request-onboarding-batch.use-case.js';
import { onboard, TestClient, type Harness } from './harness.js';

/**
 * V5.6 (E20) : `GET /v1/matches` et `POST /v1/matches/onboarding-batch` sont retirées (410). Les tests V4 qui ont
 * encore besoin d'une relation passent par les cas d'usage, dans le processus (écriture de test documentée).
 */
export async function v4Feed(h: Harness, c: TestClient) {
  return { status: 200, body: MatchFeedSchema.parse(await h.app.get(GetMatchFeedQuery).execute(c.userId)) } as { status: number; body: any };
}
export async function v4Batch(h: Harness, c: TestClient) {
  await h.app.get(RequestOnboardingBatchUseCase).execute(c.userId);
  return { ...(await v4Feed(h, c)), status: 201 };
}

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
  const feed = await v4Batch(h, a);
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
