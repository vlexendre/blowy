/**
 * Parcours complet de deux personnes, à travers le vrai client `@blowy/api-client`
 * (chaque réponse est donc validée par les schémas du contrat).
 */
import type { ApiClient } from '@blowy/api-client';
import type { Link } from '@blowy/contract';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestWorld, errorCode, onboardBody, startWorld, upload } from './helpers';

describe('parcours : rencontre, chat, vies, photo du jour, niveaux', () => {
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
    expect(await res.json()).toEqual({ ok: true });
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
    expect(pet.challenge.choices).toHaveLength(2);
  });

  it('salue, accepte et crée le lien', async () => {
    const enc = await alice.api.encounters.list();
    const sugg = enc.suggestions.find((s) => s.user.id === bob.id);
    expect(sugg).toMatchObject({ via: 'nearby', waved: false, user: { face: 'hidden', avatarUrl: null } });
    expect(sugg?.intro).toContain('Gaston');

    await alice.api.encounters.wave(bob.id);
    await alice.api.encounters.wave(bob.id); // idempotent
    expect((await alice.api.encounters.list()).suggestions.find((s) => s.user.id === bob.id)?.waved).toBe(true);
    expect(world.outbox.at(-1)).toMatchObject({ to: 'bob@example.com', subject: 'Gaston a croisé le pet de Alice' });

    const incoming = (await bob.api.encounters.list()).incoming;
    expect(incoming).toHaveLength(1);
    const encounterId = incoming[0]?.id ?? '';
    expect(await errorCode(alice.api.encounters.accept(encounterId))).toBe('forbidden');

    link = await bob.api.encounters.accept(encounterId);
    expect(link).toMatchObject({ status: 'active', lives: 7, level: 1, other: { id: alice.id, face: 'hidden', avatarUrl: null } });
    expect(world.outbox.at(-1)?.to).toBe('alice@example.com');
    expect((await bob.api.encounters.list()).incoming).toHaveLength(0);
    expect((await alice.api.encounters.list()).suggestions.some((s) => s.user.id === bob.id)).toBe(false);

    const { messages } = await alice.api.links.messages(link.id);
    expect(messages.map((m) => m.author)).toEqual(['system', 'my_pet', 'other_pet']);
    // met_new_pet (+12) et waved (+4) font bouger la jauge sociale d'Alice.
    expect((await alice.api.pet.get()).pet.gauges.social).toBe(46);
  });

  it('échange des messages : auteurs relatifs, non-lus, répliques des pets', async () => {
    const action = await alice.api.links.send(link.id, { body: 'salut bob', tone: 'sweet' });
    expect(action.messages.map((m) => m.author)).toEqual(['me', 'my_pet', 'other_pet']);

    const bobView = await bob.api.links.get(link.id);
    expect(bobView.unread).toBe(4);
    expect(bobView.lastMessage?.preview).toBeTruthy();
    const page = await bob.api.links.messages(link.id);
    const authors = page.messages.map((m) => m.author);
    expect(authors.slice(-3)).toEqual(['other', 'other_pet', 'my_pet']);
    await bob.api.links.read(link.id);
    expect((await bob.api.links.get(link.id)).unread).toBe(0);

    const reply = await bob.api.links.send(link.id, { body: 'hello', tone: 'tease' });
    // Pas de réplique « premier message du jour » : le lien a déjà parlé aujourd'hui.
    expect(reply.messages.map((m) => m.author)).toEqual(['me', 'other_pet']);
    expect((await alice.api.pet.get()).events.some((e) => e.kind === 'sweet_word')).toBe(true);
  });

  it("plafonne l'expérience des messages et pagine par 40", async () => {
    for (let i = 0; i < 35; i++) await alice.api.links.send(link.id, { body: `message ${i}` });
    const l = await alice.api.links.get(link.id);
    expect(l.xp).toBe(20);
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
    const lines = again.messages.filter((m) => m.body?.includes('5 vies'));
    expect(lines).toHaveLength(1);
  });

  it('photo du jour : visible chez l’autre seulement à deux, rend une vie, fait monter de niveau', async () => {
    const ticket = await alice.api.links.photoTicket(link.id, 'image/jpeg');
    expect(ticket.path).toMatch(new RegExp(`^links/${link.id}/${alice.id}/2026-11-14-`));
    expect(await errorCode(alice.api.links.sendPhoto(link.id, ticket.path))).toBe('invalid'); // pas encore envoyée
    await upload(ticket.uploadUrl);
    const mine = await alice.api.links.sendPhoto(link.id, ticket.path);
    expect(mine.link.today).toMatchObject({ mine: true, theirs: false });
    expect(mine.link.today.myPhotoUrl).toBeTruthy();
    expect(await errorCode(alice.api.links.sendPhoto(link.id, ticket.path))).toBe('already_done');

    const bobBefore = await bob.api.links.get(link.id);
    expect(bobBefore.today).toMatchObject({ mine: false, theirs: true, theirPhotoUrl: null });
    const hidden = (await bob.api.links.messages(link.id)).messages.find((m) => m.kind === 'photo');
    expect(hidden).toMatchObject({ author: 'other', mediaUrl: null });

    const bobTicket = await bob.api.links.photoTicket(link.id, 'image/png');
    await upload(bobTicket.uploadUrl, 'image/png');
    const duo = await bob.api.links.sendPhoto(link.id, bobTicket.path);
    expect(duo.link).toMatchObject({ lives: 6, streak: 1, level: 2 });
    expect(duo.link.today.theirPhotoUrl).toBeTruthy();
    expect(duo.messages.some((m) => m.kind === 'event' && m.body?.includes('ils jouent ensemble'))).toBe(true);
    expect(duo.messages.filter((m) => m.author === 'other_pet' || m.author === 'my_pet').length).toBeGreaterThanOrEqual(2);

    const aliceView = await alice.api.links.get(link.id);
    expect(aliceView.today.theirPhotoUrl).toBeTruthy();
    const photoRes = await fetch(aliceView.today.theirPhotoUrl ?? '');
    expect(photoRes.status).toBe(200);
    expect(photoRes.headers.get('content-type')).toBe('image/png');
    const shown = (await bob.api.links.messages(link.id)).messages.find((m) => m.kind === 'photo' && m.author === 'other');
    expect(shown?.mediaUrl).toBeTruthy();
  });

  it('souvenirs : les jours à deux et les statistiques', async () => {
    const memories = await alice.api.links.memories(link.id);
    expect(memories.days).toHaveLength(1);
    expect(memories.days[0]).toMatchObject({ day: '2026-11-14' });
    expect(memories.days[0]?.myPhotoUrl).toBeTruthy();
    expect(memories.days[0]?.theirPhotoUrl).toBeTruthy();
    expect(memories.stats).toMatchObject({ photos: 2, bestStreak: 1, daysTogether: 4, messages: 37 });
  });

  it('devient fantôme, se ranime une fois, pas deux', async () => {
    world.clock.advanceDays(10);
    const ghost = await alice.api.links.get(link.id);
    expect(ghost).toMatchObject({ status: 'ghost', lives: 0, canRevive: true, myPet: { mood: 'triste' } });
    expect(await errorCode(alice.api.links.send(link.id, { body: 'tu es là ?' }))).toBe('link_not_active');

    const revived = await bob.api.links.revive(link.id);
    expect(revived.link).toMatchObject({ status: 'active', lives: 3, canRevive: false });
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
