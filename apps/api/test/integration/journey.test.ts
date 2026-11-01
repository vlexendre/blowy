/**
 * §21 n°1 (partie API) : deux comptes locaux → onboarding → vérification démo identifiée →
 * proposition → double acceptation → chat réel (modération) → progression du Lien.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
  await h.reset();
});
afterAll(async () => h?.close());

describe('parcours n°1 — de l’onboarding au chat', () => {
  it('va de deux comptes à une relation qui progresse', async () => {
    const alice = new TestClient(h);
    const bob = new TestClient(h);
    const a = await onboard(alice, 'alice', { gender: 'WOMAN', seeking: ['MAN'] });
    const b = await onboard(bob, 'bob', { gender: 'MAN', seeking: ['WOMAN'] });

    const me = await alice.call('GET', '/v1/me');
    expect(me.body.verification).toMatchObject({ status: 'VERIFIED', provenance: 'LOCAL_DEMO', mode: 'LOCAL_DEMO' });
    expect(me.body).not.toHaveProperty('email');

    // Premier lot d'onboarding : proposition réelle entre les deux.
    const feed = await alice.call('POST', '/v1/matches/onboarding-batch', {});
    expect(feed.status).toBe(201);
    expect(feed.body.items).toHaveLength(1);
    const proposal = feed.body.items[0];
    expect(proposal.otherPet.id).toBe(b.petId);
    expect(proposal.visionScore).toBeGreaterThan(0);

    // Double acceptation.
    const acc1 = await alice.call('POST', `/v1/match-proposals/${proposal.id}/accept`, {});
    expect(acc1.body).toEqual({ status: 'WAITING_OTHER', relationshipId: null });
    const bobFeed = await bob.call('GET', '/v1/matches');
    expect(bobFeed.body.items[0].acceptedByMe).toBe(false); // jamais l'état de l'autre
    const acc2 = await bob.call('POST', `/v1/match-proposals/${proposal.id}/accept`, {});
    expect(acc2.body.status).toBe('MATCHED');
    const relId = acc2.body.relationshipId as string;

    // Relation créée sans déplacer les pets.
    const rel = await alice.call('GET', `/v1/relationships/${relId}`);
    expect(rel.status).toBe(200);
    expect(rel.body).toMatchObject({ status: 'ACTIVE', branch: 'UNDECIDED', reachedLevel: 1, myPetHere: false, otherPresence: 'OUT' });
    const convId = rel.body.conversationId as string;

    // Déplacement explicite par commande dédiée.
    const moved = await alice.call('POST', `/v1/pets/${a.petId}/move`, { destination: 'DATE_SPOT', relationshipId: relId });
    expect(moved.body.location).toMatchObject({ kind: 'DATE_SPOT', relationshipId: relId });
    expect((await bob.call('GET', `/v1/relationships/${relId}`)).body.otherPresence).toBe('HERE');

    // Chat : pending → modération (worker) → publié ; réponse de Bob → aller-retour XP.
    const m1 = await alice.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'alice-0001', body: 'Coucou Bob, ton pet a l’air drôle !' });
    expect(m1.body.status).toBe('PENDING_MODERATION');
    await h.drain();
    h.clock.advance(5 * 60_000);
    const m2 = await bob.call('POST', `/v1/conversations/${convId}/messages`, { clientMessageId: 'bob-0001', body: 'Merci ! On se retrouve au café ?' });
    expect(m2.status).toBe(201);
    await h.drain();
    const msgs = await alice.call('GET', `/v1/conversations/${convId}/messages`);
    const bodies = msgs.body.items.map((m: { body: string | null }) => m.body);
    expect(bodies).toContain('Merci ! On se retrouve au café ?');
    const after = await alice.call('GET', `/v1/relationships/${relId}`);
    expect(after.body.xp).toBeGreaterThan(0); // premier aller-retour (+2 +10 bonus, × k × m)
    expect(after.body.xp).toBeLessThanOrEqual(20);

    // Jouer au même lieu (les deux pets présents) : XP du Lien via le moteur.
    await bob.call('POST', `/v1/pets/${b.petId}/move`, { destination: 'DATE_SPOT', relationshipId: relId });
    const play = await alice.call('POST', `/v1/pets/${a.petId}/actions`, { action: 'PLAY', relationshipId: relId });
    expect(play.status).toBe(201);
    expect(play.body.outcome).toBe('APPLIED');
    const final = await alice.call('GET', `/v1/relationships/${relId}`);
    expect(final.body.xp).toBeGreaterThan(after.body.xp);
  });
});
