/**
 * Rappel « série avec Léa : à toi d'écrire, quand tu veux » (spéc §24) : le soir seulement, à la personne qui n'a pas
 * encore écrit quand l'autre l'a fait, une fois par jour au plus, un seul envoi qui résume plusieurs liens ; heures
 * calmes, réglage et plafond du notifieur respectés ; idempotent d'un passage du minuteur à l'autre.
 */
import type { ApiClient } from '@blowy/api-client';
import { notificationText } from '@blowy/content';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { PUSHER } from '../src/integrations/push/pusher';
import { LinkJobs } from '../src/modules/links/minimoas/link-jobs';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, onboardBody, startWorld } from './helpers';

type Person = { id: string; api: ApiClient; token: string; links: Map<string, string> };

describe('rappel « à toi d’écrire »', () => {
  let world: TestWorld;
  let pusher: MemoryPusher;
  let db: MemoryDb;
  const people = new Map<string, Person>();

  /** Inscrit une personne (invitée par `by`, ce qui crée le lien), avec un appareil. */
  async function join(name: string, by?: string, timeZone = 'Europe/Paris'): Promise<Person> {
    const c = world.client();
    const inviter = by ? people.get(by) : undefined;
    const me = await c.api.me.onboard(onboardBody({ displayName: name, ...(inviter ? { inviteCode: (await inviter.api.me.get()).inviteCode } : {}) }));
    const token = `ExponentPushToken[${name}]`;
    await c.api.notifications.registerDevice({ token, platform: 'ios', timeZone });
    const p: Person = { id: me.id, api: c.api, token, links: new Map() };
    people.set(name, p);
    if (inviter) {
      const [link] = (await c.api.links.list()).filter((l) => l.other.id === inviter.id);
      p.links.set(by ?? '', link?.id ?? '');
      inviter.links.set(name, link?.id ?? '');
    }
    return p;
  }
  const person = (name: string): Person => people.get(name) as Person;
  const write = (from: string, to: string) => person(from).api.links.send(person(from).links.get(to) ?? '', { body: `${from} → ${to}` });
  const reminders = (name: string) => pusher.outbox.filter((m) => m.to === person(name).token && m.data.kind === 'your_turn');
  const run = () => world.app.get(LinkJobs).runDue(world.clock.now());

  beforeAll(async () => {
    world = await startWorld();
    pusher = world.app.get<MemoryPusher>(PUSHER);
    db = world.app.get<MemoryDb>(MEMORY_DB);
    // Tom a quatre liens : Léa, Zoé, Max, Noa. Kim vit à Tokyo, Lou a coupé le rappel.
    await join('Tom');
    for (const name of ['Léa', 'Zoé', 'Max', 'Noa']) await join(name, 'Tom');
    await join('Kim', undefined, 'Asia/Tokyo');
    await join('Ana', 'Kim');
    await join('Lou');
    await join('Eli', 'Lou');
    await person('Lou').api.notifications.updateSettings({ kinds: { your_turn: false } });
  });
  afterAll(() => world.close());

  it('jour 1 : Léa et Tom s’écrivent (série 1)', async () => {
    await write('Léa', 'Tom');
    const both = await write('Tom', 'Léa');
    expect(both.link.streak).toBe(1);
  });

  it('jour 2, l’après-midi : rien, même quand l’autre a écrit', async () => {
    world.clock.advanceDays(1); // 12 novembre, 11 h à Paris
    await write('Léa', 'Tom');
    await write('Zoé', 'Tom');
    await write('Max', 'Tom');
    await write('Tom', 'Max'); // les deux ont écrit : rien à rappeler
    await write('Ana', 'Kim');
    await write('Eli', 'Lou');
    await run();
    expect(pusher.outbox.filter((m) => m.data.kind === 'your_turn')).toHaveLength(0);
  });

  it('le soir : un seul rappel pour Tom, qui résume ses liens (la plus longue série en avant)', async () => {
    world.clock.advanceHours(8); // 19 h à Paris
    await run();
    const [push, ...more] = reminders('Tom');
    expect(more).toHaveLength(0);
    expect(push).toMatchObject({
      title: 'Série avec Léa',
      body: notificationText('fr', 'your_turn', { name: 'Léa', count: '1', more: '1' }).body,
      data: { kind: 'your_turn', url: 'blowy://chats', state: { writeTo: 'Léa', streak: 1 } },
    });
    expect(push?.body).toBe('À toi d’écrire, quand tu veux. Et dans 1 autre lien.');
    // Personne d'autre : Léa, Zoé et Max ont écrit ; Max et Tom se sont écrit tous les deux.
    for (const name of ['Léa', 'Zoé', 'Max', 'Noa', 'Ana', 'Eli']) expect(reminders(name)).toHaveLength(0);
  });

  it('heures calmes de la personne (Tokyo : 3 h du matin) et réglage coupé : rien, et pas de report', async () => {
    expect(reminders('Kim')).toHaveLength(0);
    expect(reminders('Lou')).toHaveLength(0);
    expect(db.notificationLog.filter((l) => l.kind === 'your_turn' && l.status === 'deferred')).toHaveLength(0);
  });

  it('idempotent : un deuxième passage n’envoie rien de plus', async () => {
    await run();
    await run();
    expect(reminders('Tom')).toHaveLength(1);
  });

  it('un lien qui s’anime plus tard dans la soirée est rattrapé ; une personne déjà rappelée ne l’est pas deux fois', async () => {
    world.clock.advanceMinutes(40);
    await write('Tom', 'Noa'); // Noa doit maintenant écrire
    await write('Noa', 'Tom'); // … et le fait aussitôt : plus rien pour elle
    await write('Tom', 'Zoé'); // Zoé et Tom : réglé
    await write('Max', 'Tom'); // déjà écrit tous les deux
    world.clock.advanceMinutes(10);
    await write('Tom', 'Léa'); // la série avec Léa avance
    expect((await person('Léa').api.links.get(person('Léa').links.get('Tom') ?? '')).streak).toBe(2);
    // Un nouveau lien de Tom où l'autre écrit : Tom a déjà eu son rappel aujourd'hui.
    await join('Rui', 'Tom');
    await write('Rui', 'Tom');
    await run();
    expect(reminders('Tom')).toHaveLength(1);
    // Quelqu'un qui n'a pas encore été rappelé l'est le soir même, dès qu'un lien s'anime.
    await join('Sam', 'Max');
    await write('Max', 'Sam');
    await run();
    expect(reminders('Sam')).toHaveLength(1);
    expect(reminders('Sam')[0]).toMatchObject({ title: 'Série avec Max', body: 'Max t’a écrit aujourd’hui. Réponds quand tu veux.', data: { url: expect.stringMatching(/^blowy:\/\/link\//) } });
  });

  it('après 22 h : plus de rappel ; le lendemain soir, ça recommence', async () => {
    world.clock.advanceHours(2.5); // 22 h 20 à Paris
    await write('Léa', 'Tom');
    await run();
    expect(reminders('Tom')).toHaveLength(1);
    world.clock.advanceHours(21); // lendemain, 19 h 20
    await write('Zoé', 'Tom');
    await run();
    expect(reminders('Tom')).toHaveLength(2);
    expect(reminders('Tom')[1]).toMatchObject({ title: 'Série avec Zoé' });
  });
});
