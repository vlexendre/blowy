/** Invitations, « 3 mots », amis d'amis, défi du jour, sécurité et suppression de compte. */
import type { ApiClient } from '@blowy/api-client';
import { START_NEEDS, WORD_KEYS } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestWorld, doToday, errorCode, onboardBody, seedPastPhoto, startWorld, upload } from './helpers';

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
    const me = await alice.api.me.onboard(onboardBody({ displayName: 'Alice' }));
    aliceInvite = me.inviteCode;
    aliceWords = me.wordsCode;
  });
  afterAll(() => world.close());

  it("invitation : page publique, inscription avec code, acceptation, refus de son propre code", async () => {
    const invite = await world.anonymous.invites.get(aliceInvite.toLowerCase());
    expect(invite).toMatchObject({ displayName: 'Alice', pet: { name: 'Nino', mood: 'joie', outfit: {} } });
    expect(await errorCode(world.anonymous.invites.get('ZZZZZZZZ'))).toBe('not_found');

    await bob.api.me.onboard(onboardBody({ displayName: 'Bob', inviteCode: aliceInvite, pet: { name: 'Gaston', species: 'gaston' } }));
    const bobLinks = await bob.api.links.list();
    expect(bobLinks).toHaveLength(1);
    expect(bobLinks[0]?.other.id).toBe(alice.id);
    expect(world.outbox.at(-1)).toMatchObject({ to: 'alice@example.com', subject: 'Nino et Gaston se sont trouvés' });

    await carol.api.me.onboard(onboardBody({ displayName: 'Carol', pet: { name: 'Pia', species: 'pia' } }));
    const link = await carol.api.invites.accept(aliceInvite);
    expect(link.other.displayName).toBe('Alice');
    // Accepter deux fois rend le même lien.
    expect((await carol.api.invites.accept(aliceInvite)).id).toBe(link.id);
    expect(await errorCode(alice.api.invites.accept(aliceInvite))).toBe('conflict');
    expect(await alice.api.links.list()).toHaveLength(2);
  });

  it("rencontres : amis d'amis d'abord, avec l'ami commun", async () => {
    const dave = world.client();
    await dave.api.me.onboard(onboardBody({ displayName: 'Dave' }));
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

  it('défi du jour : un seul système (celui des rituels), une fois par jour ; renommage du pet', async () => {
    // L'ancien défi (V6) n'existe plus.
    const legacy = await fetch(`${world.baseUrl}/v1/pet/challenge`, { method: 'POST', headers: { authorization: `Bearer test:${bob.id}`, 'content-type': 'application/json' }, body: '{"choice":0}' });
    expect(legacy.status).toBe(404);
    expect('challenge' in (await bob.api.pet.get())).toBe(false);
    expect((await bob.api.rituals.today()).streak.doneToday).toBe(false);
    await doToday(bob);
    expect((await bob.api.rituals.today()).streak.doneToday).toBe(true);
    expect((await bob.api.pet.get()).events.some((e) => e.kind === 'challenge_done')).toBe(true);
    world.clock.advanceDays(1);
    expect((await bob.api.rituals.today()).streak.doneToday).toBe(false);
    expect((await bob.api.pet.rename('  Gaston   le G  ')).pet.name).toBe('Gaston le G');
  });

  it('profil : mise à jour et avatar sous son propre préfixe', async () => {
    expect((await bob.api.me.update({ displayName: 'Bobby' })).displayName).toBe('Bobby');
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
    // Comme le coucou : introuvable, rien ne trahit le blocage (audit du 17 nov.).
    expect(await errorCode(bob.api.invites.accept(aliceInvite))).toBe('not_found');

    await alice.api.safety.report({ userId: bob.id, linkId: aliceToBob?.id, reason: 'harcelement', details: 'messages insistants' });
    expect(await errorCode(alice.api.safety.report({ userId: carol.id, linkId: aliceToBob?.id, reason: 'autre' }))).toBe('not_found');

    await alice.api.safety.unblock(bob.id);
    expect(await alice.api.safety.blocks()).toEqual([]);
  });

  it('suppression du compte : médias, données et accès effacés', async () => {
    // Anciennes photos du jour (gardées dans les souvenirs) : elles partent avec le compte et le lien.
    const carolLink = (await carol.api.links.list()).find((l) => l.other.id === bob.id);
    await seedPastPhoto(world, carolLink?.id ?? '', carol.id, '2026-11-10');
    await seedPastPhoto(world, carolLink?.id ?? '', bob.id, '2026-11-10');
    const [day] = (await carol.api.links.memories(carolLink?.id ?? '')).photos;
    const theirUrl = day?.theirPhotoUrl ?? '';
    const myUrl = day?.myPhotoUrl ?? '';
    expect((await fetch(theirUrl)).status).toBe(200);
    expect((await fetch(myUrl)).status).toBe(200);

    expect(await bob.api.me.remove()).toEqual({ ok: true });
    expect(await errorCode(bob.api.me.get())).toBe('unauthorized');
    expect((await carol.api.links.list()).some((l) => l.other.id === bob.id)).toBe(false);
    expect((await fetch(theirUrl)).status).toBe(404);
    // Le lien disparaît avec Bob : la photo de Carol dans ce lien ne doit pas rester orpheline.
    expect((await fetch(myUrl)).status).toBe(404);
  });
});

describe('configuration', () => {
  it('refuse la production avec les adaptateurs mémoire', async () => {
    await expect(startWorld({ BLOWY_ENV: 'production' })).rejects.toThrow(/adaptateurs mémoire/);
    await expect(startWorld({ BLOWY_ADAPTERS: 'supabase', SUPABASE_URL: '' })).rejects.toThrow(/SUPABASE_URL/);
  });

  it('avance du temps : en local seulement, et elle fait bouder le pet', async () => {
    const world = await startWorld();
    try {
      const me = world.client();
      await me.api.me.onboard(onboardBody());
      const before = await (await fetch(`${world.baseUrl}/dev/clock`)).json() as { now: string };
      const res = await fetch(`${world.baseUrl}/dev/clock/advance`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hours: 30 }) });
      expect(res.status).toBe(201);
      const after = await res.json() as { now: string };
      expect(Date.parse(after.now) - Date.parse(before.now)).toBe(30 * 3_600_000);
      expect((await me.api.pet.get()).pet.shape).toBe('boude');
      const bad = await fetch(`${world.baseUrl}/dev/clock/advance`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hours: -1 }) });
      expect(bad.status).toBe(400);
    } finally {
      await world.close();
    }
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
      // Malo arrive par une rencontre acceptée : l'historique n'est pas vide et mène au lien.
      const history = await me.api.encounters.history();
      expect(history.items).toHaveLength(1);
      expect(history.items[0]).toMatchObject({ person: { displayName: 'Malo' }, direction: 'received', outcome: 'linked', linkId: link?.id });
      // Pets de démo habillés ; la nouvelle personne part avec les objets de départ.
      expect(enc.incoming[0]?.from.pet.outfit).toEqual({ head: 'noeud', face: 'lunettes_etoile' });
      expect(link?.other.pet.outfit).toEqual({ head: 'casquette', body: 'echarpe' });
      expect(enc.suggestions.find((s) => s.user.displayName === 'Sasha')?.user.pet.outfit).toEqual({ head: 'cornes', toy: 'skate' });
      const wardrobe = await me.api.pet.wardrobe();
      expect(wardrobe.items.filter((i) => i.state === 'owned')).toHaveLength(8 + 2); // + objets du premier lien (avec Malo) : chapeau de fête, bulle
      const view = await me.api.pet.get();
      // Rencontre acceptée avec Malo : +12 de sociabilité.
      expect(view.pet.needs).toEqual({ ...START_NEEDS, sociability: START_NEEDS.sociability + 12 });
      expect(view.newItems).toEqual(['chapeau_fete', 'bulle']);
    } finally {
      await world.close();
    }
  });

  it('monde de démo : inscription avec le code de Léa (déjà liée, son coucou est ignoré)', async () => {
    const world = await startWorld({ BLOWY_DEMO: '1' });
    try {
      const me = world.client();
      await me.api.me.onboard(onboardBody({ inviteCode: 'LEADEMO2' }));
      const names = (await me.api.links.list()).map((l) => l.other.displayName).sort();
      expect(names).toEqual(['Léa', 'Malo']);
      expect((await me.api.encounters.list()).incoming).toEqual([]);
    } finally {
      await world.close();
    }
  });

  it('monde de démo : états d’un lien à la demande (série en jeu, lien en danger, fantôme)', async () => {
    const world = await startWorld({ BLOWY_DEMO: '1' });
    try {
      const me = world.client();
      await me.api.me.onboard(onboardBody());
      const res = await fetch(`${world.baseUrl}/dev/demo/links`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      expect(await res.json()).toEqual({ userId: me.id });
      const byName = new Map((await me.api.links.list()).map((l) => [l.other.displayName, l]));
      expect(byName.get('Malo')?.today).toMatchObject({ mine: false, theirs: true, atStake: false });
      expect(byName.get('Sasha')).toMatchObject({ status: 'active', streak: 6, bestStreak: 9, lives: 7, today: { mine: false, theirs: false, atStake: true } });
      expect(byName.get('Inès')).toMatchObject({ status: 'active', lives: 2, streak: 0 });
      expect(byName.get('Yanis')).toMatchObject({ status: 'ghost', lives: 0, canRevive: true });
      const memories = await me.api.links.memories(byName.get('Sasha')?.id ?? '');
      expect(memories.milestones.map((m) => `${m.kind}:${m.value}`)).toEqual(['level:4', 'streak:7', 'level:3', 'streak:3', 'level:2', 'met:0']);
    } finally {
      await world.close();
    }
  });
});
