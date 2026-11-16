/** Historique des rencontres (acceptées, refusées, envoyées) et changement de nom du pet limité à un tous les 60 jours. */
import type { ApiClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, apiError, errorCode, onboardBody, startWorld } from './helpers';

type Person = { id: string; api: ApiClient };

describe('historique des rencontres', () => {
  let world: TestWorld;
  const people: Record<string, Person> = {};
  const join = async (name: string): Promise<Person> => {
    const p = world.client();
    await p.api.me.onboard(onboardBody({ displayName: name }));
    people[name] = p;
    return p;
  };
  const p = (name: string): Person => {
    const found = people[name];
    if (!found) throw new Error(`personne inconnue : ${name}`);
    return found;
  };
  const history = async (name: string) => (await p(name).api.encounters.history()).items.map((i) => `${i.person.displayName}:${i.direction}:${i.outcome}`);

  beforeAll(async () => {
    world = await startWorld();
    for (const name of ['Alice', 'Bob', 'Carol', 'Dave', 'Erin', 'Frank']) await join(name);
  });
  afterAll(() => world.close());

  it('vide au départ', async () => {
    expect(await p('Alice').api.encounters.history()).toEqual({ items: [], nextBefore: null });
  });

  it('acceptée : reste dans l’historique des deux côtés, avec le lien à ouvrir', async () => {
    await p('Bob').api.encounters.wave(p('Alice').id);
    // Coucou reçu sans réponse : dans « reçus », pas dans l'historique ; chez Bob, il attend.
    expect(await history('Alice')).toEqual([]);
    expect(await history('Bob')).toEqual(['Alice:sent:waiting']);
    world.clock.advanceMinutes(5);
    const [incoming] = (await p('Alice').api.encounters.list()).incoming;
    const link = await p('Alice').api.encounters.accept(incoming?.id ?? '');
    expect((await p('Alice').api.encounters.list()).incoming).toEqual([]);

    const [item] = (await p('Alice').api.encounters.history()).items;
    expect(item).toMatchObject({ id: incoming?.id, direction: 'received', outcome: 'linked', linkId: link.id, person: { id: p('Bob').id, face: 'hidden', avatarUrl: null } });
    expect(item?.at).toBe(world.clock.now().toISOString());
    expect((await p('Bob').api.encounters.history()).items[0]).toMatchObject({ direction: 'sent', outcome: 'linked', linkId: link.id });
  });

  it('refusée : « passé ton tour » pour qui refuse, toujours « en attente » pour qui a salué', async () => {
    world.clock.advanceMinutes(5);
    await p('Carol').api.encounters.wave(p('Alice').id);
    const carolWave = (await p('Alice').api.encounters.list()).incoming.find((i) => i.from.id === p('Carol').id);
    world.clock.advanceMinutes(5);
    await p('Alice').api.encounters.decline(carolWave?.id ?? '');
    // Du plus récent au plus ancien.
    expect(await history('Alice')).toEqual(['Carol:received:declined', 'Bob:received:linked']);
    expect(await history('Carol')).toEqual(['Alice:sent:waiting']);
    const [declined] = (await p('Alice').api.encounters.history()).items;
    expect(declined?.linkId).toBeNull();
  });

  it('deux coucous croisés : une seule ligne ; lien archivé : terminé, sans lien à ouvrir', async () => {
    world.clock.advanceMinutes(5);
    await p('Dave').api.encounters.wave(p('Erin').id);
    world.clock.advanceMinutes(5);
    await p('Erin').api.encounters.wave(p('Dave').id);
    expect(await history('Dave')).toEqual(['Erin:sent:linked']);
    expect(await history('Erin')).toEqual(['Dave:sent:linked']);
    const [item] = (await p('Dave').api.encounters.history()).items;
    await p('Dave').api.links.archive(item?.linkId ?? '');
    expect((await p('Dave').api.encounters.history()).items[0]).toMatchObject({ outcome: 'ended', linkId: null });
  });

  it('personnes bloquées (dans les deux sens), signalées ou supprimées : absentes', async () => {
    await p('Alice').api.safety.block(p('Bob').id);
    expect(await history('Alice')).toEqual(['Carol:received:declined']);
    expect(await history('Bob')).toEqual([]);
    await p('Alice').api.safety.unblock(p('Bob').id);
    // Le lien a été archivé par le blocage : la rencontre revient, terminée.
    expect(await history('Alice')).toEqual(['Carol:received:declined', 'Bob:received:ended']);

    await p('Alice').api.safety.report({ userId: p('Carol').id, reason: 'autre' });
    expect(await history('Alice')).toEqual(['Bob:received:ended']);
    // Le signalement ne cache rien chez la personne signalée.
    expect(await history('Carol')).toEqual(['Alice:sent:waiting']);

    await p('Erin').api.me.remove();
    expect(await history('Dave')).toEqual([]);
  });

  it('par pages de 20, du plus récent au plus ancien', async () => {
    const zed = await join('Zed');
    const names = Array.from({ length: 23 }, (_, i) => `Pote${String(i).padStart(2, '0')}`);
    for (const name of names) {
      const other = await join(name);
      world.clock.advanceMinutes(1);
      await zed.api.encounters.wave(other.id);
      await zed.api.pet.care('feed').catch(() => undefined); // garde Zed en forme : un pet qui boude ne salue plus
    }
    const first = await zed.api.encounters.history();
    expect(first.items).toHaveLength(20);
    expect(first.items[0]?.person.displayName).toBe('Pote22');
    expect(first.nextBefore).toBe(first.items[19]?.at);
    const second = await zed.api.encounters.history(first.nextBefore ?? undefined);
    expect(second.items.map((i) => i.person.displayName)).toEqual(['Pote02', 'Pote01', 'Pote00']);
    expect(second.nextBefore).toBeNull();
    expect(await errorCode(zed.api.encounters.history('pas-une-date'))).toBe('invalid');
  });
});

describe('changement de nom du pet', () => {
  let world: TestWorld;
  let me: Person;
  let db: MemoryDb;

  beforeAll(async () => {
    world = await startWorld();
    db = world.app.get<MemoryDb>(MEMORY_DB);
    me = world.client();
    await me.api.me.onboard(onboardBody({ pet: { name: 'Nino', species: 'nino' } }));
  });
  afterAll(() => world.close());

  const setPlus = (until: Date | null) => {
    const profile = db.profiles.get(me.id);
    if (!profile) throw new Error('profil introuvable');
    db.profiles.set(me.id, { ...profile, plusUntil: until ? until.toISOString() : null });
  };

  it('le nom donné à la création ne compte pas : le premier changement est possible', async () => {
    expect((await me.api.pet.get()).rename).toEqual({ allowed: true, availableOn: null, unlimited: false });
  });

  it('après un changement : bloqué 60 jours, erreur claire ; redonner le même nom ne compte pas', async () => {
    // 11 novembre 2026 → possible à nouveau le 10 janvier 2027.
    const view = await me.api.pet.rename('Pepito');
    expect(view.pet.name).toBe('Pepito');
    expect(view.rename).toEqual({ allowed: false, availableOn: '2027-01-10', unlimited: false });
    expect(await apiError(me.api.pet.rename('Bidule'))).toEqual({
      code: 'rename_locked',
      message: 'Tu pourras renommer Pepito à partir du 10 janvier 2027. Avec Minimoa+, pas d’attente.',
    });
    expect((await me.api.pet.rename(' Pepito ')).pet.name).toBe('Pepito');
    expect((await me.api.me.get()).pet.name).toBe('Pepito');
  });

  it('59 jours plus tard : toujours bloqué ; le 60e jour : possible', async () => {
    world.clock.advanceDays(59);
    expect((await me.api.pet.get()).rename.allowed).toBe(false);
    expect(await errorCode(me.api.pet.rename('Bidule'))).toBe('rename_locked');
    world.clock.advanceDays(1);
    expect((await me.api.pet.get()).rename).toEqual({ allowed: true, availableOn: null, unlimited: false });
    const view = await me.api.pet.rename('Bidule');
    expect(view.pet.name).toBe('Bidule');
    expect(view.rename.availableOn).toBe('2027-03-11');
  });

  it('Minimoa+ : sans attente ; à la fin de Minimoa+, l’attente part du dernier changement', async () => {
    setPlus(new Date(world.clock.now().getTime() + 30 * 86_400_000));
    expect((await me.api.pet.get()).rename).toEqual({ allowed: true, availableOn: null, unlimited: true });
    expect((await me.api.pet.rename('Truc')).pet.name).toBe('Truc');
    const view = await me.api.pet.rename('Machin');
    expect(view.pet.name).toBe('Machin');
    expect(view.rename.unlimited).toBe(true);
    setPlus(null);
    expect((await me.api.pet.get()).rename).toMatchObject({ allowed: false, unlimited: false });
    expect(await errorCode(me.api.pet.rename('Encore'))).toBe('rename_locked');
  });
});
