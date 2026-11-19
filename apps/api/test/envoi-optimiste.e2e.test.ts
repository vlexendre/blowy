/**
 * Envoi optimiste du chat : l'app tire un `clientId` par message ; un réessai (réponse perdue, coupure, relance) ou
 * deux envois simultanés avec la même clé n'écrivent qu'un message. Sans clé, comme avant (anciennes apps).
 */
import { randomUUID } from 'node:crypto';
import type { ApiClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestWorld, errorCode, onboardBody, startWorld } from './helpers';

type P = { id: string; api: ApiClient };

describe('envoi optimiste : clé d’idempotence des messages', () => {
  let w: TestWorld;
  let a: P;
  let b: P;
  let c: P;
  let linkId = '';

  beforeAll(async () => {
    w = await startWorld();
    const people: P[] = [];
    for (const name of ['Alix', 'Bao', 'Cyd']) {
      const p = w.client();
      await p.api.me.onboard(onboardBody({ displayName: name }));
      people.push(p);
    }
    [a, b, c] = people as [P, P, P];
    const code = (await a.api.me.get()).inviteCode;
    await b.api.invites.accept(code);
    await c.api.invites.accept(code);
    linkId = (await a.api.links.list()).find((l) => l.other.id === b.id)?.id ?? '';
  });
  afterAll(() => w.close());

  const mine = async (p: P, body: string): Promise<number> =>
    (await p.api.links.messages(linkId)).messages.filter((m) => m.author === 'me' && m.body === body).length;

  it('un réessai avec la même clé rend la même réponse sans écrire deux fois', async () => {
    const clientId = randomUUID();
    const first = await a.api.links.send(linkId, { body: 'Salut toi', clientId });
    const again = await a.api.links.send(linkId, { body: 'Salut toi', clientId });
    expect(again.messages.map((m) => m.id)).toEqual(first.messages.map((m) => m.id));
    expect(await mine(a, 'Salut toi')).toBe(1);
  });

  it('deux envois simultanés avec la même clé : un seul message', async () => {
    const clientId = randomUUID();
    const [x, y] = await Promise.all([a.api.links.send(linkId, { body: 'En même temps', clientId }), a.api.links.send(linkId, { body: 'En même temps', clientId })]);
    expect(x.messages[0]?.id).toBe(y.messages[0]?.id);
    expect(await mine(a, 'En même temps')).toBe(1);
  });

  it('sans clé, ou avec deux clés différentes : deux messages (anciennes apps, vrais doublons voulus)', async () => {
    await a.api.links.send(linkId, { body: 'ok' });
    await a.api.links.send(linkId, { body: 'ok' });
    await a.api.links.send(linkId, { body: 'ok', clientId: randomUUID() });
    expect(await mine(a, 'ok')).toBe(3);
  });

  it('la clé est propre à chaque personne et à chaque lien', async () => {
    const clientId = randomUUID();
    await a.api.links.send(linkId, { body: 'Même clé', clientId });
    await b.api.links.send(linkId, { body: 'Même clé', clientId });
    const page = await a.api.links.messages(linkId);
    expect(page.messages.filter((m) => m.body === 'Même clé').map((m) => m.author).sort()).toEqual(['me', 'other']);
  });

  it('une clé qui n’est pas un uuid est refusée', async () => {
    expect(await errorCode(a.api.links.send(linkId, { body: 'x', clientId: 'pas-un-uuid' }))).toBe('invalid');
  });

  it('groupes : même règle', async () => {
    const g = await a.api.groups.create({ name: 'Les potes', kind: 'free', memberIds: [b.id, c.id] });
    await b.api.groups.accept(g.id);
    await c.api.groups.accept(g.id);
    const clientId = randomUUID();
    const first = await a.api.groups.send(g.id, 'Coucou la bande', clientId);
    const again = await a.api.groups.send(g.id, 'Coucou la bande', clientId);
    expect(again.messages.map((m) => m.id)).toEqual(first.messages.map((m) => m.id));
    const page = await a.api.groups.messages(g.id);
    expect(page.messages.filter((m) => m.body === 'Coucou la bande')).toHaveLength(1);
    // Sans clé : comme avant.
    await a.api.groups.send(g.id, 'Coucou la bande');
    expect((await a.api.groups.messages(g.id)).messages.filter((m) => m.body === 'Coucou la bande')).toHaveLength(2);
  });
});
