/** IDOR basique : identifiants connus d'un autre compte sur pets, relations, conversations, messages, propositions. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { onboard, startHarness, TestClient, type Harness } from './harness.js';
import { matchedPair } from './fixtures.js';

let h: Harness;
beforeAll(async () => {
  h = await startHarness();
  await h.reset();
});
afterAll(async () => h?.close());

describe('autorisations objet', () => {
  it('un tiers ne lit ni n’agit sur les objets d’autrui', async () => {
    const m = await matchedPair(h, 'idor');
    const eve = new TestClient(h);
    const { petId: evePet } = await onboard(eve, 'idor.eve', { gender: 'WOMAN', seeking: ['MAN'] });
    await m.a.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: 'idor-msg-001', body: 'privé' });
    await h.drain();
    const msgId = (await h.db.message.findFirstOrThrow({ where: { clientMessageId: 'idor-msg-001' } })).id;

    const checks = await Promise.all([
      eve.call('GET', `/v1/pets/${m.aPet}`),
      eve.call('POST', `/v1/pets/${m.aPet}/actions`, { action: 'FEED' }),
      eve.call('POST', `/v1/pets/${m.aPet}/move`, { destination: 'HOME' }),
      eve.call('POST', `/v1/pets/${evePet}/move`, { destination: 'DATE_SPOT', relationshipId: m.relId }),
      eve.call('GET', `/v1/relationships/${m.relId}`),
      eve.call('POST', `/v1/relationships/${m.relId}/leave`, {}),
      eve.call('POST', `/v1/relationships/${m.relId}/branch/ballot`, { choice: 'PLUS' }),
      eve.call('GET', `/v1/conversations/${m.convId}/messages`),
      eve.call('POST', `/v1/conversations/${m.convId}/messages`, { clientMessageId: 'eve-intrude-1', body: 'coucou' }),
      eve.call('POST', `/v1/messages/${msgId}/reveal`, {}),
    ]);
    for (const r of checks) expect(r.status, JSON.stringify(r.body)).toBe(404);

    // Un partenaire voit le profil PUBLIC du pet de l'autre (pas les jauges ni le lieu).
    const pub = await m.b.call('GET', `/v1/pets/${m.aPet}`);
    expect(pub.status).toBe(200);
    expect(pub.body).not.toHaveProperty('gauges');
    expect(pub.body).not.toHaveProperty('location');
    // Le pet de B ne peut pas être actionné par A.
    expect((await m.a.call('POST', `/v1/pets/${m.bPet}/actions`, { action: 'FEED' })).status).toBe(404);
    // Sans jeton : 401 structuré.
    const anon = new TestClient(h);
    const r = await anon.call('GET', '/v1/me');
    expect(r.status).toBe(401);
    expect(r.body).toMatchObject({ code: 'UNAUTHENTICATED', retryable: false });
    expect(typeof r.body.requestId).toBe('string');
  });

  it('sessions appareil révocables', async () => {
    const c = new TestClient(h);
    await c.signIn('idor.sess');
    expect((await c.call('GET', '/v1/auth/sessions')).body.items).toHaveLength(1);
    expect((await c.call('DELETE', '/v1/auth/sessions/current')).status).toBe(204);
    expect((await c.call('GET', '/v1/me')).status).toBe(401);
  });

  it('âge < 18 refusé côté serveur', async () => {
    const c = new TestClient(h);
    await c.signIn('idor.minor');
    const r = await c.call('PATCH', '/v1/me', { birthDate: '2010-01-01' });
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('AGE_RESTRICTED');
  });

  it('espèce premium refusée sans droit', async () => {
    const c = new TestClient(h);
    await c.signIn('idor.premium');
    const r = await c.call('POST', '/v1/pets', { name: 'Pia', species: 'PIA', vision: { axes: { kindMischief: 0, sportyContemplative: 0, scienceArt: 0, homeAdventure: 0 }, school: 'CIRQUE', sunday: 'RANDO', passions: ['SPORT'], limit: 'JUGER' } });
    expect(r.status).toBe(402);
    expect(r.body.code).toBe('ENTITLEMENT_REQUIRED');
  });
});
