/** Invitations, « 3 mots », amis d'amis, défi du jour, sécurité et suppression de compte. */
import type { ApiClient } from '@blowy/api-client';
import { WORD_KEYS } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestWorld, errorCode, onboardBody, startWorld, upload } from './helpers';

describe('vie sociale et sécurité', () => {
  let world: TestWorld;
  let alice: { id: string; api: ApiClient };
  let bob: { id: string; api: ApiClient };
  let carol: { id: string; api: ApiClient };
  let aliceInvite: string;
  let aliceWords: string;

  beforeAll(async () => {
    world = await startWorld();
    alice = world.client(undefined, 'alice@example.com');
    bob = world.client();
    carol = world.client();
    const me = await alice.api.me.onboard(onboardBody({ displayName: 'Alice', city: 'Nantes' }));
    aliceInvite = me.inviteCode;
    aliceWords = me.wordsCode;
  });
  afterAll(() => world.close());

  it("invitation : page publique, inscription avec code, acceptation, refus de son propre code", async () => {
    const invite = await world.anonymous.invites.get(aliceInvite.toLowerCase());
    expect(invite).toMatchObject({ displayName: 'Alice', pet: { name: 'Nino', mood: 'salut' } });
    expect(await errorCode(world.anonymous.invites.get('ZZZZZZZZ'))).toBe('not_found');

    await bob.api.me.onboard(onboardBody({ displayName: 'Bob', city: 'Lille', inviteCode: aliceInvite, pet: { name: 'Gaston', species: 'gaston' } }));
    const bobLinks = await bob.api.links.list();
    expect(bobLinks).toHaveLength(1);
    expect(bobLinks[0]?.other.id).toBe(alice.id);
    expect(world.outbox.at(-1)).toMatchObject({ to: 'alice@example.com', subject: 'Nino et Gaston se sont trouvés' });

    await carol.api.me.onboard(onboardBody({ displayName: 'Carol', city: 'Brest', pet: { name: 'Pia', species: 'pia' } }));
    const link = await carol.api.invites.accept(aliceInvite);
    expect(link.other.displayName).toBe('Alice');
    // Accepter deux fois rend le même lien.
    expect((await carol.api.invites.accept(aliceInvite)).id).toBe(link.id);
    expect(await errorCode(alice.api.invites.accept(aliceInvite))).toBe('conflict');
    expect(await alice.api.links.list()).toHaveLength(2);
  });

  it("rencontres : amis d'amis d'abord, avec l'ami commun", async () => {
    const dave = world.client();
    await dave.api.me.onboard(onboardBody({ displayName: 'Dave', city: 'Brest' }));
    const { suggestions } = await carol.api.encounters.list();
    expect(suggestions[0]).toMatchObject({ via: 'friend_of_friend', mutualName: 'Alice', user: { id: bob.id } });
    expect(suggestions.find((s) => s.user.id === dave.id)?.via).toBe('nearby');
    expect(suggestions.some((s) => s.user.id === alice.id)).toBe(false);
  });

  it('deux coucous croisés créent le lien tout de suite', async () => {
    await bob.api.encounters.wave(carol.id);
    expect(await carol.api.links.list()).toHaveLength(1);
    await carol.api.encounters.wave(bob.id);
    const links = await carol.api.links.list();
    expect(links.map((l) => l.other.id).sort()).toEqual([alice.id, bob.id].sort());
    expect(await errorCode(carol.api.encounters.wave(bob.id))).toBe('conflict');
  });

  it('refuser une rencontre la fait disparaître', async () => {
    const erin = world.client();
    await erin.api.me.onboard(onboardBody({ displayName: 'Erin' }));
    await erin.api.encounters.wave(alice.id);
    const [incoming] = (await alice.api.encounters.list()).incoming;
    expect(incoming?.from.displayName).toBe('Erin');
    await alice.api.encounters.decline(incoming?.id ?? '');
    const after = await alice.api.encounters.list();
    expect(after.incoming).toHaveLength(0);
    expect(after.suggestions.some((s) => s.user.id === erin.id)).toBe(false);
  });

  it('« 3 mots » : page publique, vote qui fait bouger les jauges, second vote refusé', async () => {
    const page = await world.anonymous.words.get(aliceWords);
    expect(page.words).toEqual(WORD_KEYS);
    const before = (await alice.api.pet.get()).pet.gauges;
    await world.anonymous.words.send(aliceWords, ['drole', 'taquin', 'curieux']);
    const view = await alice.api.pet.get();
    expect(view.wordsCount).toBe(1);
    expect(view.pet.gauges.play).toBe(before.play + 12);
    expect(view.events[0]?.kind).toBe('three_words');
    expect(await errorCode(world.anonymous.words.send(aliceWords, ['doux', 'calme', 'cash']))).toBe('already_done');
    expect(await errorCode(world.anonymous.words.send(aliceWords, ['doux', 'doux', 'cash']))).toBe('invalid');
    for (let i = 0; i < 3; i++) await world.anonymous.words.send(aliceWords, ['doux', 'calme', 'cash']).catch(() => undefined);
    expect(await errorCode(world.anonymous.words.send(aliceWords, ['doux', 'calme', 'cash']))).toBe('rate_limited');
  });

  it('défi du jour : une fois par jour, renommage du pet', async () => {
    const before = await bob.api.pet.get();
    expect(before.challenge.doneToday).toBe(false);
    const after = await bob.api.pet.answerChallenge(0);
    expect(after.challenge.doneToday).toBe(true);
    expect(after.events[0]?.kind).toBe('challenge_done');
    expect(await errorCode(bob.api.pet.answerChallenge(1))).toBe('already_done');
    world.clock.advanceDays(1);
    expect((await bob.api.pet.get()).challenge.doneToday).toBe(false);
    expect((await bob.api.pet.rename('  Gaston   le G  ')).pet.name).toBe('Gaston le G');
  });

  it('profil : mise à jour et avatar sous son propre préfixe', async () => {
    expect((await bob.api.me.update({ city: null, displayName: 'Bobby' })).city).toBeNull();
    const ticket = await bob.api.me.avatarTicket('image/webp');
    expect(ticket.path.startsWith(`avatars/${bob.id}/`)).toBe(true);
    await upload(ticket.uploadUrl, 'image/webp');
    expect((await bob.api.me.setAvatar(ticket.path)).avatarUrl).toBeTruthy();
    expect(await errorCode(alice.api.me.setAvatar(ticket.path))).toBe('forbidden');
    // Visages cachés au niveau 1 : l'avatar n'est pas transmis.
    const aliceSeesBob = (await alice.api.links.list()).find((l) => l.other.id === bob.id);
    expect(aliceSeesBob?.other).toMatchObject({ face: 'hidden', avatarUrl: null });
  });

  it('blocage : le lien et les suggestions disparaissent ; signalement', async () => {
    const aliceToBob = (await alice.api.links.list()).find((l) => l.other.id === bob.id);
    await alice.api.safety.block(bob.id);
    expect((await alice.api.links.list()).some((l) => l.other.id === bob.id)).toBe(false);
    expect((await bob.api.links.list()).some((l) => l.other.id === alice.id)).toBe(false);
    expect((await carol.api.encounters.list()).suggestions.some((s) => s.user.id === bob.id)).toBe(false);
    expect(await alice.api.safety.blocks()).toEqual([{ userId: bob.id, displayName: 'Bobby' }]);
    expect(await errorCode(bob.api.encounters.wave(alice.id))).toBe('not_found');
    expect(await errorCode(bob.api.invites.accept(aliceInvite))).toBe('forbidden');

    await alice.api.safety.report({ userId: bob.id, linkId: aliceToBob?.id, reason: 'harcelement', details: 'messages insistants' });
    expect(await errorCode(alice.api.safety.report({ userId: carol.id, linkId: aliceToBob?.id, reason: 'autre' }))).toBe('not_found');

    await alice.api.safety.unblock(bob.id);
    expect(await alice.api.safety.blocks()).toEqual([]);
  });

  it('suppression du compte : médias, données et accès effacés', async () => {
    const carolLink = (await carol.api.links.list()).find((l) => l.other.id === bob.id);
    const ticket = await carol.api.links.photoTicket(carolLink?.id ?? '', 'image/jpeg');
    await upload(ticket.uploadUrl);
    await carol.api.links.sendPhoto(carolLink?.id ?? '', ticket.path);
    const bobTicket = await bob.api.links.photoTicket(carolLink?.id ?? '', 'image/jpeg');
    await upload(bobTicket.uploadUrl);
    await bob.api.links.sendPhoto(carolLink?.id ?? '', bobTicket.path);
    const theirUrl = (await carol.api.links.get(carolLink?.id ?? '')).today.theirPhotoUrl ?? '';
    expect((await fetch(theirUrl)).status).toBe(200);

    expect(await bob.api.me.remove()).toEqual({ ok: true });
    expect(await errorCode(bob.api.me.get())).toBe('unauthorized');
    expect((await carol.api.links.list()).some((l) => l.other.id === bob.id)).toBe(false);
    expect((await fetch(theirUrl)).status).toBe(404);
  });
});

describe('configuration', () => {
  it('refuse la production avec les adaptateurs mémoire', async () => {
    await expect(startWorld({ BLOWY_ENV: 'production' })).rejects.toThrow(/adaptateurs mémoire/);
    await expect(startWorld({ BLOWY_ADAPTERS: 'supabase', SUPABASE_URL: '' })).rejects.toThrow(/SUPABASE_URL/);
  });

  it('monde de démo : suggestions, coucou de Léa et lien avec Malo à l’inscription', async () => {
    const world = await startWorld({ BLOWY_DEMO: '1' });
    try {
      const me = world.client();
      await me.api.me.onboard(onboardBody());
      const enc = await me.api.encounters.list();
      expect(enc.incoming.map((i) => i.from.displayName)).toEqual(['Léa']);
      expect(enc.suggestions.find((s) => s.user.displayName === 'Sasha')).toMatchObject({ via: 'friend_of_friend', mutualName: 'Malo' });
      const [link] = await me.api.links.list();
      expect(link?.other.displayName).toBe('Malo');
      expect(link?.unread).toBeGreaterThan(0);
    } finally {
      await world.close();
    }
  });
});
