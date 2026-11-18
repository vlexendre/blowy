import { labels } from '@blowy/content';

const { careLabel } = labels.in('fr');
/** Soins du pet (besoins, forme, jours de soin), garde-robe (objets gagnés, tenue) et conséquences sur les rencontres. */
import type { ApiClient } from '@blowy/api-client';
import { ITEM_IDS, START_NEEDS } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, apiError, doToday, errorCode, onboardBody, startWorld } from './helpers';

type Person = { id: string; api: ApiClient };

const START_ITEMS = ['bob', 'casquette', 'lunettes_rondes', 'joues_roses', 'echarpe', 'bandana', 'ballon', 'doudou'];

describe('soins et garde-robe', () => {
  let world: TestWorld;
  let alice: Person;
  let bob: Person;

  beforeAll(async () => {
    world = await startWorld();
    alice = world.client();
    bob = world.client();
    await alice.api.me.onboard(onboardBody({ displayName: 'Alice', pet: { name: 'Nino', species: 'nino' } }));
    await bob.api.me.onboard(onboardBody({ displayName: 'Bob', pet: { name: 'Gaston', species: 'gaston' } }));
  });
  afterAll(() => world.close());

  it("à l'inscription : besoins de départ, objets de départ possédés mais pas « nouveaux »", async () => {
    const view = await alice.api.pet.get();
    expect(view.pet).toMatchObject({ needs: START_NEEDS, wellbeing: 80, shape: 'en_forme', outfit: {} });
    expect(view.careDays).toBe(0);
    expect(view.newItems).toEqual([]);

    const wardrobe = await alice.api.pet.wardrobe();
    expect(wardrobe.items.map((i) => i.id)).toEqual(ITEM_IDS);
    expect(wardrobe.items.filter((i) => i.state === 'owned').map((i) => i.id)).toEqual(START_ITEMS);
    expect(wardrobe.items.find((i) => i.id === 'coeur')).toEqual({ id: 'coeur', slot: 'toy', state: 'locked', plus: false, goal: { stat: 'careDays', have: 0, need: 1 } });
    expect(wardrobe.items.find((i) => i.id === 'aureole')).toEqual({ id: 'aureole', slot: 'head', state: 'premium', plus: true, goal: null });
    expect(wardrobe.items.find((i) => i.id === 'bob')?.goal).toBeNull();
    expect(wardrobe.outfit).toEqual({});
  });

  it('soins : comblent un besoin, refusés quand il est comblé, un jour de soin par jour', async () => {
    const fed = await alice.api.pet.care('feed');
    expect(fed.pet.needs).toEqual({ sociability: 80, hunger: 100, energy: 80, mood: 80 });
    expect(fed.careDays).toBe(1);
    expect(fed.events[0]?.kind).toBe('care_feed');
    // Premier jour de soin : deux objets débloqués, fêtés une seule fois.
    expect(fed.newItems).toEqual(['taches_rousseur', 'coeur']);
    expect((await alice.api.pet.get()).newItems).toEqual([]);

    expect(await apiError(alice.api.pet.care('feed'))).toEqual({ code: 'already_done', message: careLabel.feed?.refused });

    const cuddled = await alice.api.pet.care('cuddle');
    expect(cuddled.pet.needs.mood).toBe(95);
    expect(cuddled.pet.gauges.tender).toBe(3);
    expect(cuddled.careDays).toBe(1);
    expect(cuddled.newItems).toEqual([]);
    expect(await errorCode(alice.api.pet.care('cuddle'))).toBe('already_done');
    expect(await apiError(alice.api.pet.care('play'))).toMatchObject({ code: 'already_done' }); // humeur comblée

    const napped = await alice.api.pet.care('nap');
    expect(napped.pet.needs.energy).toBe(100);
    expect(napped.careDays).toBe(1);
    expect(await errorCode(alice.api.pet.care('nap'))).toBe('already_done');
  });

  it('un nouveau jour de soin compte, deux soins le même jour non', async () => {
    world.clock.advanceHours(14); // 1 h du matin à Paris : un autre jour
    const before = await alice.api.pet.get();
    expect(before.careDays).toBe(1);
    // La sociabilité baisse aussi (1,5 point par heure) : les gestes ne la comblent pas.
    expect(before.pet.needs).toEqual({ sociability: 59, hunger: 51, energy: 65, mood: 60 });
    const fed = await alice.api.pet.care('feed');
    expect(fed.careDays).toBe(2);
    expect(fed.newItems).toEqual(['bonnet']);
    const napped = await alice.api.pet.care('nap');
    expect(napped.careDays).toBe(2);
  });

  it('tenue : acceptée avec des objets possédés, refusée sinon', async () => {
    const dressed = await alice.api.pet.setOutfit({ head: 'bonnet', toy: 'coeur' });
    expect(dressed.pet.outfit).toEqual({ head: 'bonnet', toy: 'coeur' });
    expect((await alice.api.pet.wardrobe()).outfit).toEqual({ head: 'bonnet', toy: 'coeur' });

    expect(await apiError(alice.api.pet.setOutfit({ head: 'couronne' }))).toEqual({ code: 'forbidden', message: 'Cet objet n’est pas encore à toi.' });
    expect(await errorCode(alice.api.pet.setOutfit({ head: 'aureole' }))).toBe('forbidden'); // premium
    expect(await errorCode(alice.api.pet.setOutfit({ head: 'ballon' }))).toBe('forbidden'); // mauvais emplacement
    expect(await errorCode(alice.api.pet.setOutfit({ head: 'pas_un_objet' }))).toBe('invalid');
    // Rien n'a changé après un refus.
    expect((await alice.api.pet.get()).pet.outfit).toEqual({ head: 'bonnet', toy: 'coeur' });
  });

  it('la tenue se voit dans les rencontres et dans le lien ; le premier lien débloque des objets une fois', async () => {
    await bob.api.pet.care('feed');
    await bob.api.pet.care('nap');
    expect((await bob.api.pet.care('cuddle')).pet.shape).toBe('en_forme');
    const enc = await bob.api.encounters.list();
    expect(enc.petShape).toBe('en_forme');
    const sugg = enc.suggestions.find((s) => s.user.id === alice.id);
    expect(sugg?.user.pet).toMatchObject({ outfit: { head: 'bonnet', toy: 'coeur' }, mood: 'joie' });

    await bob.api.encounters.wave(alice.id);
    const [incoming] = (await alice.api.encounters.list()).incoming;
    const link = await alice.api.encounters.accept(incoming?.id ?? '');
    const seenByBob = await bob.api.links.get(link.id);
    expect(seenByBob.other.pet.outfit).toEqual({ head: 'bonnet', toy: 'coeur' });
    expect(seenByBob.myPet.outfit).toEqual({});

    const first = await bob.api.pet.get();
    expect(first.newItems).toEqual(['chapeau_fete', 'bulle']);
    expect((await bob.api.pet.get()).newItems).toEqual([]);
    const goal = (await bob.api.pet.wardrobe()).items.find((i) => i.id === 'chapeau_fete');
    expect(goal).toMatchObject({ state: 'owned', goal: { stat: 'links', have: 1, need: 1 } });
  });

  it('le premier défi relevé débloque le pansement', async () => {
    await doToday(bob);
    const view = await bob.api.pet.get();
    expect(view.newItems).toEqual(['pansement']);
    expect((await bob.api.pet.get()).newItems).toEqual([]);
    expect((await bob.api.pet.wardrobe()).items.find((i) => i.id === 'livre')?.goal).toEqual({ stat: 'challenges', have: 1, need: 2 });
  });

  it('la meilleure série d’un lien reste acquise quand la série retombe', async () => {
    const [link] = await alice.api.links.list();
    const linkId = link?.id ?? '';
    for (let day = 0; day < 2; day++) {
      for (const p of [alice, bob]) await p.api.links.send(linkId, { body: 'coucou' });
      if (day === 0) world.clock.advanceDays(1);
    }
    expect((await alice.api.links.get(linkId)).streak).toBe(2);
    expect((await alice.api.pet.get()).newItems).toContain('fleur');

    world.clock.advanceDays(3);
    expect((await alice.api.links.get(linkId)).streak).toBe(0);
    // V7 : les paliers de 3 jours et plus suivent la série des défis du jour, plus celle des liens.
    const fleurs = (await alice.api.pet.wardrobe()).items.find((i) => i.id === 'fleurs');
    expect(fleurs?.goal).toEqual({ stat: 'ritualStreak', have: 0, need: 3 });
    expect((await bob.api.pet.wardrobe()).items.find((i) => i.id === 'fleur')?.state).toBe('owned');
  });
});

describe('un pet qui boude ne sort plus', () => {
  let world: TestWorld;

  beforeAll(async () => {
    world = await startWorld();
  });
  afterAll(() => world.close());

  it("les besoins s'usent avec les heures, sans dériver quand on relit souvent ; la forme suit", async () => {
    const carol = world.client();
    await carol.api.me.onboard(onboardBody({ displayName: 'Carol' }));
    // Relire toutes les 20 minutes pendant 10 h donne la même usure qu'une seule lecture.
    for (let i = 0; i < 30; i++) {
      world.clock.advanceMinutes(20);
      await carol.api.pet.get();
    }
    const after10 = (await carol.api.pet.get()).pet;
    expect(after10.needs).toEqual({ sociability: 65, hunger: 45, energy: 55, mood: 55 });
    // Forme : 60 % sociabilité (65) + 40 % petits besoins (50).
    expect(after10).toMatchObject({ wellbeing: 59, shape: 'bof' });

    world.clock.advanceHours(10);
    const after20 = (await carol.api.me.get()).pet;
    expect(after20.needs).toEqual({ sociability: 50, hunger: 10, energy: 30, mood: 30 });
    expect(after20).toMatchObject({ wellbeing: 38, shape: 'bof' });

    world.clock.advanceHours(10);
    expect((await carol.api.pet.get()).pet).toMatchObject({ needs: { sociability: 35 }, shape: 'boude' });

    world.clock.advanceHours(20);
    expect((await carol.api.pet.get()).pet.needs).toEqual({ sociability: 5, hunger: 0, energy: 0, mood: 0 });
    // Trop fatigué pour jouer.
    expect(await apiError(carol.api.pet.care('play'))).toEqual({ code: 'already_done', message: careLabel.play?.refused });
  });

  it('il boude mais présente quand même, salue quand même ; coucous reçus visibles et acceptables ; repart après des soins', async () => {
    const dana = world.client();
    const eli = world.client();
    const fred = world.client();
    await dana.api.me.onboard(onboardBody({ displayName: 'Dana' }));
    await eli.api.me.onboard(onboardBody({ displayName: 'Eli' }));
    world.clock.advanceHours(30);
    await fred.api.me.onboard(onboardBody({ displayName: 'Fred' }));
    await fred.api.encounters.wave(dana.id);

    const sulking = await dana.api.encounters.list();
    expect(sulking.petShape).toBe('boude');
    // Les soins ne bloquent pas les gens : au moins une présentation par jour, même quand il boude.
    expect(sulking.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(sulking.incoming.map((i) => i.from.displayName)).toEqual(['Fred']);

    // Vu par les autres : un pet qui boude a l'air triste.
    const seen = (await fred.api.encounters.list()).suggestions.find((s) => s.user.id === eli.id);
    expect(seen?.user.pet.mood).toBe('triste');

    const link = await dana.api.encounters.accept(sulking.incoming[0]?.id ?? '');
    expect(link.status).toBe('active');

    await dana.api.pet.care('feed');
    await dana.api.pet.care('nap');
    const cuddled = await dana.api.pet.care('cuddle');
    // Sociabilité : 35 après 30 h, +12 pour la rencontre acceptée avec Fred.
    expect(cuddled.pet.needs).toEqual({ sociability: 47, hunger: 40, energy: 50, mood: 20 });
    await dana.api.encounters.wave(eli.id); // saluer, même sans être en forme : +4 de sociabilité
    expect(cuddled.pet.shape).toBe('bof');
    expect((await dana.api.encounters.list()).petShape).toBe('bof');

    const played = await dana.api.pet.care('play');
    expect(played.pet).toMatchObject({ needs: { sociability: 51, hunger: 40, energy: 40, mood: 50 }, wellbeing: 48, shape: 'bof' });
    // Les gestes ne suffisent plus : il faut sortir (V7, sociabilité d'abord).
    const out = await dana.api.rituals.outing('saw_people');
    expect(out.sociability).toBe(91);
    expect((await dana.api.pet.get()).pet).toMatchObject({ wellbeing: 72, shape: 'en_forme' });
  });

  it('le quota de suggestions dépend de la sociabilité seule, pas des soins', async () => {
    const people: Person[] = [];
    for (let i = 0; i < 9; i++) {
      const p = world.client();
      await p.api.me.onboard(onboardBody({ displayName: `P${i}` }));
      people.push(p);
    }
    const [first] = people;
    if (!first) throw new Error('personne');
    expect((await first.api.encounters.list()).suggestions.length).toBeGreaterThan(6);
    // 10 h plus tard : sociabilité 65, faim basse ; il est « bof » mais présente toujours autant.
    world.clock.advanceHours(10);
    const tired = await first.api.encounters.list();
    expect(tired.petShape).toBe('bof');
    expect(tired.suggestions.length).toBeGreaterThan(6);
    // Sans sortir pendant 2 jours : sociabilité basse, quota réduit, jamais nul.
    world.clock.advanceHours(40);
    const low = await first.api.encounters.list();
    expect(low.suggestions).toHaveLength(3);
  });

  it('un objet retiré du jeu (vieille tenue, vieille ligne pet_items) est ignoré à la lecture et retiré à la prochaine écriture', async () => {
    const carol = world.client();
    await carol.api.me.onboard(onboardBody({ displayName: 'Carol', pet: { name: 'Pia', species: 'pia' } }));
    const db = world.app.get<MemoryDb>(MEMORY_DB);
    const pet = [...db.pets.values()].find((p) => p.ownerId === carol.id);
    if (!pet) throw new Error('pet introuvable');
    const retired = 'sw' + 'eat';
    pet.outfit = { head: 'bob', body: retired };
    db.petItems.push({ petId: pet.id, itemId: retired, source: 'milestone', acquiredAt: new Date().toISOString() });

    const view = await carol.api.pet.get();
    expect(view.pet.outfit).toEqual({ head: 'bob' });
    expect(view.newItems).not.toContain(retired);
    const wardrobe = await carol.api.pet.wardrobe();
    expect(wardrobe.outfit).toEqual({ head: 'bob' });
    expect(wardrobe.items.map((i) => i.id)).not.toContain(retired);
    expect(await errorCode(carol.api.pet.setOutfit({ head: 'bob', body: retired } as never))).toBeTruthy();

    await carol.api.pet.setOutfit({ head: 'casquette' });
    expect(db.pets.get(pet.id)?.outfit).toEqual({ head: 'casquette' });
  });
});
