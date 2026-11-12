import { careLabel } from '@blowy/content';
/** Soins du pet (besoins, forme, jours de soin), garde-robe (objets gagnés, tenue) et conséquences sur les rencontres. */
import type { ApiClient } from '@blowy/api-client';
import { ITEM_IDS, START_NEEDS } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestWorld, apiError, errorCode, onboardBody, startWorld, upload } from './helpers';

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
    await alice.api.me.onboard(onboardBody({ displayName: 'Alice', city: 'Nantes', pet: { name: 'Nino', species: 'nino' } }));
    await bob.api.me.onboard(onboardBody({ displayName: 'Bob', city: 'Nantes', pet: { name: 'Gaston', species: 'gaston' } }));
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
    expect(wardrobe.items.find((i) => i.id === 'coeur')).toEqual({ id: 'coeur', slot: 'toy', state: 'locked', goal: { stat: 'careDays', have: 0, need: 1 } });
    expect(wardrobe.items.find((i) => i.id === 'aureole')).toEqual({ id: 'aureole', slot: 'head', state: 'premium', goal: null });
    expect(wardrobe.items.find((i) => i.id === 'bob')?.goal).toBeNull();
    expect(wardrobe.outfit).toEqual({});
  });

  it('soins : comblent un besoin, refusés quand il est comblé, un jour de soin par jour', async () => {
    const fed = await alice.api.pet.care('feed');
    expect(fed.pet.needs).toEqual({ hunger: 100, energy: 80, mood: 80 });
    expect(fed.careDays).toBe(1);
    expect(fed.events[0]?.kind).toBe('care_feed');
    // Premier jour de soin : deux objets débloqués, fêtés une seule fois.
    expect(fed.newItems).toEqual(['taches_rousseur', 'coeur']);
    expect((await alice.api.pet.get()).newItems).toEqual([]);

    expect(await apiError(alice.api.pet.care('feed'))).toEqual({ code: 'already_done', message: 'il n’a plus faim.' });

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
    expect(before.pet.needs).toEqual({ hunger: 51, energy: 65, mood: 60 });
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

    expect(await apiError(alice.api.pet.setOutfit({ head: 'couronne' }))).toEqual({ code: 'forbidden', message: 'cet objet n’est pas encore à toi.' });
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
    expect(first.newItems).toEqual(['chapeau_fete', 'noeud_pap', 'bulle']);
    expect((await bob.api.pet.get()).newItems).toEqual([]);
    const goal = (await bob.api.pet.wardrobe()).items.find((i) => i.id === 'chapeau_fete');
    expect(goal).toMatchObject({ state: 'owned', goal: { stat: 'links', have: 1, need: 1 } });
  });

  it('le premier défi relevé débloque le pansement', async () => {
    const view = await bob.api.pet.answerChallenge(0);
    expect(view.newItems).toEqual(['pansement']);
    expect((await bob.api.pet.get()).newItems).toEqual([]);
    expect((await bob.api.pet.wardrobe()).items.find((i) => i.id === 'livre')?.goal).toEqual({ stat: 'challenges', have: 1, need: 2 });
  });

  it('la meilleure série de photos reste acquise quand la série retombe', async () => {
    const [link] = await alice.api.links.list();
    const linkId = link?.id ?? '';
    for (let day = 0; day < 2; day++) {
      for (const p of [alice, bob]) {
        const ticket = await p.api.links.photoTicket(linkId, 'image/jpeg');
        await upload(ticket.uploadUrl);
        await p.api.links.sendPhoto(linkId, ticket.path);
      }
      if (day === 0) world.clock.advanceDays(1);
    }
    expect((await alice.api.links.get(linkId)).streak).toBe(2);
    expect((await alice.api.pet.get()).newItems).toContain('fleur');

    world.clock.advanceDays(3);
    expect((await alice.api.links.get(linkId)).streak).toBe(0);
    const fleurs = (await alice.api.pet.wardrobe()).items.find((i) => i.id === 'fleurs');
    expect(fleurs?.goal).toEqual({ stat: 'bestStreak', have: 2, need: 3 });
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
    expect(after10.needs).toEqual({ hunger: 45, energy: 55, mood: 55 });
    expect(after10).toMatchObject({ wellbeing: 50, shape: 'bof' });

    world.clock.advanceHours(10);
    const after20 = (await carol.api.me.get()).pet;
    expect(after20.needs).toEqual({ hunger: 10, energy: 30, mood: 30 });
    expect(after20).toMatchObject({ wellbeing: 20, shape: 'boude' });

    world.clock.advanceHours(30);
    expect((await carol.api.pet.get()).pet.needs).toEqual({ hunger: 0, energy: 0, mood: 0 });
    // Trop fatigué pour jouer.
    expect(await apiError(carol.api.pet.care('play'))).toEqual({ code: 'already_done', message: careLabel.play?.refused });
  });

  it('pas de suggestions, coucou refusé, coucous reçus toujours visibles et acceptables ; repart après des soins', async () => {
    const dana = world.client();
    const eli = world.client();
    const fred = world.client();
    await dana.api.me.onboard(onboardBody({ displayName: 'Dana' }));
    await eli.api.me.onboard(onboardBody({ displayName: 'Eli' }));
    world.clock.advanceHours(20);
    await fred.api.me.onboard(onboardBody({ displayName: 'Fred' }));
    await fred.api.encounters.wave(dana.id);

    const sulking = await dana.api.encounters.list();
    expect(sulking.petShape).toBe('boude');
    expect(sulking.suggestions).toEqual([]);
    expect(sulking.incoming.map((i) => i.from.displayName)).toEqual(['Fred']);
    expect(await apiError(dana.api.encounters.wave(eli.id))).toEqual({ code: 'forbidden', message: 'ton pet boude : occupe-toi de lui avant de saluer.' });

    // Vu par les autres : un pet qui boude a l'air triste.
    const seen = (await fred.api.encounters.list()).suggestions.find((s) => s.user.id === eli.id);
    expect(seen?.user.pet.mood).toBe('triste');

    const link = await dana.api.encounters.accept(sulking.incoming[0]?.id ?? '');
    expect(link.status).toBe('active');

    await dana.api.pet.care('feed');
    await dana.api.pet.care('nap');
    const cuddled = await dana.api.pet.care('cuddle');
    expect(cuddled.pet.needs).toEqual({ hunger: 50, energy: 75, mood: 45 });
    expect(cuddled.pet.shape).toBe('bof');
    expect((await dana.api.encounters.list()).petShape).toBe('bof');
    await dana.api.encounters.wave(eli.id);

    const played = await dana.api.pet.care('play');
    expect(played.pet).toMatchObject({ needs: { hunger: 50, energy: 65, mood: 75 }, wellbeing: 60, shape: 'en_forme' });
  });

  it('le quota de suggestions dépend de la forme', async () => {
    const people: Person[] = [];
    for (let i = 0; i < 9; i++) {
      const p = world.client();
      await p.api.me.onboard(onboardBody({ displayName: `P${i}` }));
      people.push(p);
    }
    const [first] = people;
    if (!first) throw new Error('personne');
    expect((await first.api.encounters.list()).suggestions.length).toBeGreaterThan(6);
    world.clock.advanceHours(10);
    const tired = await first.api.encounters.list();
    expect(tired.petShape).toBe('bof');
    expect(tired.suggestions).toHaveLength(6);
  });
});
