/**
 * Parcours complet de deux personnes, à travers le vrai client `@blowy/api-client`
 * (chaque réponse est donc validée par les schémas du contrat).
 */
import type { ApiClient } from '@blowy/api-client';
import { HealthZ, type Link } from '@blowy/contract';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestWorld, errorCode, onboardBody, seedPastPhoto, startWorld } from './helpers';

describe('parcours : rencontre, chat, vies, série de la conversation, niveaux', () => {
  let world: TestWorld;
  let alice: { id: string; api: ApiClient };
  let bob: { id: string; api: ApiClient };
  let link: Link;

  beforeAll(async () => {
    world = await startWorld();
    alice = world.client(undefined, 'alice@example.com');
    bob = world.client(undefined, 'bob@example.com');
  });
  afterAll(() => world.close());

  it('répond à /health et refuse sans jeton', async () => {
    expect(await world.anonymous.me.get().catch((e: { code: string }) => e.code)).toBe('unauthorized');
    const res = await fetch(`${world.baseUrl}/health`);
    expect(HealthZ.parse(await res.json())).toEqual({ ok: true, env: 'local' });
  });

  it('refuse les moins de 18 ans puis inscrit deux personnes', async () => {
    expect(await errorCode(alice.api.me.onboard(onboardBody({ birthdate: '2008-11-12' })))).toBe('too_young');
    expect(await errorCode(alice.api.me.get())).toBe('not_onboarded');

    const me = await alice.api.me.onboard(onboardBody({ displayName: 'Alice', quiz: { social: 30, tender: -40 } }));
    expect(me.pet.gauges).toEqual({ social: 30, play: 0, tender: -40, talk: 0 });
    expect(me.inviteCode).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(world.outbox.filter((m) => m.to === 'alice@example.com')).toHaveLength(1);
    expect(await errorCode(alice.api.me.onboard(onboardBody()))).toBe('already_onboarded');

    await bob.api.me.onboard(onboardBody({ displayName: 'Bob', pet: { name: 'Gaston', species: 'gaston' } }));
    const pet = await alice.api.pet.get();
    expect(pet.events.map((e) => e.kind)).toEqual(['quiz']);
    // Un seul défi du jour : celui des rituels (`/v1/rituals/today`).
    expect(pet).not.toHaveProperty('challenge');
  });

  it('salue, accepte et crée le lien', async () => {
    const enc = await alice.api.encounters.list();
    const sugg = enc.suggestions.find((s) => s.user.id === bob.id);
    expect(sugg).toMatchObject({ via: 'nearby', waved: false, user: { face: 'hidden', avatarUrl: null } });
    expect(sugg?.intro).toContain('Gaston');

    await alice.api.encounters.wave(bob.id);
    await alice.api.encounters.wave(bob.id); // idempotent
    expect((await alice.api.encounters.list()).suggestions.find((s) => s.user.id === bob.id)?.waved).toBe(true);
    expect(world.outbox.at(-1)).toMatchObject({ to: 'bob@example.com', subject: 'Alice te fait signe' });

    const incoming = (await bob.api.encounters.list()).incoming;
    expect(incoming).toHaveLength(1);
    const encounterId = incoming[0]?.id ?? '';
    expect(await errorCode(alice.api.encounters.accept(encounterId))).toBe('forbidden');

    link = await bob.api.encounters.accept(encounterId);
    expect(link).toMatchObject({ status: 'active', lives: 7, level: 1, other: { id: alice.id, face: 'clear', avatarUrl: null } });
    expect(world.outbox.at(-1)?.to).toBe('alice@example.com');
    expect((await bob.api.encounters.list()).incoming).toHaveLength(0);
    expect((await alice.api.encounters.list()).suggestions.some((s) => s.user.id === bob.id)).toBe(false);

    const { messages } = await alice.api.links.messages(link.id);
    // Bandeau, puis le brise-glace d'un des deux minimoas (une question tirée des points communs).
    expect(messages.map((m) => m.author)[0]).toBe('system');
    expect(messages.slice(1).map((m) => m.petRole)).toEqual(['icebreaker']);
    // met_new_pet (+12) et waved (+4) font bouger la jauge sociale d'Alice.
    expect((await alice.api.pet.get()).pet.gauges.social).toBe(46);
  });

  it('échange des messages : auteurs relatifs, non-lus, plus de remarques des pets', async () => {
    const action = await alice.api.links.send(link.id, { body: 'salut bob', tone: 'sweet' });
    // Plus de remarques des minimoas (21 nov. 2026) : le message seul.
    expect(action.messages.map((m) => m.author)).toEqual(['me']);

    const bobView = await bob.api.links.get(link.id);
    const seenByBob = (await bob.api.links.messages(link.id)).messages;
    expect(bobView.unread).toBe(seenByBob.filter((m) => m.author !== 'me' && m.author !== 'my_pet').length);
    expect(bobView.lastMessage?.preview).toBeTruthy();
    const page = await bob.api.links.messages(link.id);
    const authors = page.messages.map((m) => m.author);
    expect(authors.at(-1)).toBe('other');
    await bob.api.links.read(link.id);
    expect((await bob.api.links.get(link.id)).unread).toBe(0);

    const reply = await bob.api.links.send(link.id, { body: 'hello', tone: 'tease' });
    expect(reply.messages.map((m) => m.author)).toEqual(['me']);
    expect((await alice.api.pet.get()).events.some((e) => e.kind === 'sweet_word')).toBe(true);
  });

  it("plafonne l'expérience des messages et pagine par 40", async () => {
    for (let i = 0; i < 35; i++) await alice.api.links.send(link.id, { body: `message ${i}` });
    const l = await alice.api.links.get(link.id);
    // 20 xp de messages (plafond du jour) + 8 et 8 pour le premier message de chacun + 12 pour le jour à deux.
    expect(l.xp).toBe(48);
    expect(l).toMatchObject({ level: 2, streak: 1, bestStreak: 1, today: { mine: true, theirs: true, atStake: false } });
    const first = await alice.api.links.messages(link.id);
    expect(first.messages).toHaveLength(40);
    expect(first.nextBefore).not.toBeNull();
    const second = await alice.api.links.messages(link.id, first.nextBefore ?? undefined);
    const ids = new Set([...first.messages, ...second.messages].map((m) => m.id));
    expect(ids.size).toBe(first.messages.length + second.messages.length);
    expect(second.messages.at(-1)?.at.localeCompare(first.messages[0]?.at ?? '')).toBe(-1);
  });

  it('perd une vie par jour entier de silence (une seule réplique par rattrapage)', async () => {
    world.clock.advanceDays(1);
    expect((await bob.api.links.get(link.id)).lives).toBe(7);
    world.clock.advanceDays(2);
    const hurt = await bob.api.links.get(link.id);
    expect(hurt.lives).toBe(5);
    expect(hurt.myPet.mood).toBe('neutre');
    const again = await alice.api.links.messages(link.id);
    const lines = again.messages.filter((m) => /5\svies/.test(m.body ?? ''));
    expect(lines).toHaveLength(1);
  });

  it('série de la conversation : un jour compte quand les deux ont écrit, et rend une vie', async () => {
    // Samedi 14 novembre : Alice écrit seule, la série (tombée pendant le silence) n'avance pas.
    const solo = await alice.api.links.send(link.id, { body: 'tu es là ?' });
    expect(solo.link).toMatchObject({ lives: 5, streak: 0, bestStreak: 1 });
    expect(solo.link.today).toMatchObject({ day: '2026-11-14', mine: true, theirs: false, atStake: false });
    expect((await bob.api.links.get(link.id)).today).toMatchObject({ mine: false, theirs: true });

    const duo = await bob.api.links.send(link.id, { body: 'oui !' });
    expect(duo.link).toMatchObject({ lives: 6, streak: 1, bestStreak: 1 });
    expect(duo.link.today).toMatchObject({ mine: true, theirs: true, atStake: false });
    // La vie rendue est dite par un minimoa (comme le faisait la photo à deux).
    expect(duo.messages.some((m) => m.author === 'my_pet' && m.petRole === 'event' && /\b6\b/.test(m.body ?? ''))).toBe(true);
    // La semaine, du lundi 9 au dimanche 15 : le lien est né mercredi 11, écrit à deux ce jour-là et aujourd'hui.
    expect(duo.link.today.week.map((d) => `${d.day.slice(8)}:${d.when}:${d.beforeLink ? 'avant' : d.mine && d.theirs ? 'deux' : d.mine || d.theirs ? 'un' : '-'}`)).toEqual([
      '09:past:avant',
      '10:past:avant',
      '11:past:deux',
      '12:past:-',
      '13:past:-',
      '14:today:deux',
      '15:future:-',
    ]);
    // Le niveau suivant et ce qu'il manque : ce que l'écran « Aujourd'hui » montre.
    expect(duo.link.next).toMatchObject({ level: 3, key: 'emmenagent' });

    // Dimanche : la série est en jeu jusqu'à minuit.
    world.clock.advanceDays(1);
    const sunday = await alice.api.links.get(link.id);
    expect(sunday).toMatchObject({ streak: 1, today: { day: '2026-11-15', mine: false, theirs: false, atStake: true } });
    await bob.api.links.send(link.id, { body: 'bon dimanche' });
    expect((await alice.api.links.get(link.id)).today).toMatchObject({ mine: false, theirs: true, atStake: true });
    const kept = await alice.api.links.send(link.id, { body: 'à toi aussi' });
    expect(kept.link).toMatchObject({ streak: 2, bestStreak: 2, today: { atStake: false } });
  });

  it('les anciennes photos du jour restent dans les souvenirs (celle de l’autre seulement si vous aviez posté tous les deux)', async () => {
    await seedPastPhoto(world, link.id, alice.id, '2026-11-12');
    await seedPastPhoto(world, link.id, bob.id, '2026-11-12');
    await seedPastPhoto(world, link.id, bob.id, '2026-11-13');
    const memories = await alice.api.links.memories(link.id);
    expect(memories.photos.map((d) => d.day)).toEqual(['2026-11-12']);
    expect(memories.photos[0]?.theirPhotoUrl).toBeTruthy();
    expect((await fetch(memories.photos[0]?.myPhotoUrl ?? '')).status).toBe(200);
    const bobs = await bob.api.links.memories(link.id);
    expect(bobs.photos.map((d) => [d.day, d.theirPhotoUrl !== null])).toEqual([
      ['2026-11-13', false],
      ['2026-11-12', true],
    ]);
    // Dans le chat, même règle qu'avant : la photo de Bob du 13 reste cachée pour Alice.
    const photos = (await alice.api.links.messages(link.id)).messages.filter((m) => m.kind === 'photo' && m.author === 'other');
    expect(photos.map((m) => m.mediaUrl !== null).sort()).toEqual([false, true]);
  });

  it('souvenirs : les étapes du lien et les chiffres', async () => {
    const memories = await alice.api.links.memories(link.id);
    expect(memories.milestones).toEqual([
      { kind: 'level', value: 2, on: '2026-11-11' },
      { kind: 'met', value: 0, on: '2026-11-11' },
    ]);
    expect(memories.stats).toEqual({ messages: 41, daysTogether: 5, duoDays: 3, bestStreak: 2, photos: 3 });
  });

  it('plus de photo du jour : les anciennes routes n’existent plus', async () => {
    for (const path of [`/v1/links/${link.id}/photo/ticket`, `/v1/links/${link.id}/photo`]) {
      const res = await fetch(`${world.baseUrl}${path}`, {
        method: 'POST',
        headers: { authorization: `Bearer test:${alice.id}`, 'content-type': 'application/json' },
        body: JSON.stringify({ contentType: 'image/jpeg', path: 'x' }),
      });
      expect(res.status).toBe(404);
    }
  });

  it('devient fantôme, se ranime une fois, pas deux', async () => {
    world.clock.advanceDays(10);
    const ghost = await alice.api.links.get(link.id);
    expect(ghost).toMatchObject({ status: 'ghost', lives: 0, canRevive: true, myPet: { mood: 'triste' } });
    expect(await errorCode(alice.api.links.send(link.id, { body: 'tu es là ?' }))).toBe('link_not_active');

    const revived = await bob.api.links.revive(link.id);
    expect(revived.link).toMatchObject({ status: 'active', lives: 3, canRevive: false, streak: 0, bestStreak: 2 });
    expect(revived.messages.map((m) => m.author)).toEqual(['system', 'my_pet', 'other_pet']);

    world.clock.advanceDays(10);
    expect((await alice.api.links.get(link.id)).status).toBe('ghost');
    expect(await errorCode(alice.api.links.revive(link.id))).toBe('cannot_revive');
  });

  it('archive un lien (il disparaît de la liste)', async () => {
    expect(await alice.api.links.list()).toHaveLength(1);
    await alice.api.links.archive(link.id);
    expect(await alice.api.links.list()).toHaveLength(0);
    expect(await errorCode(alice.api.links.get('not-a-uuid'))).toBe('invalid');
    expect(await errorCode(world.client().api.links.get(link.id))).toBe('not_found');
  });
});
