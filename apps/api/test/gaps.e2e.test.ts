/**
 * Manques signalés par l'app, de bout en bout en mémoire : repères de l'explication, ce que vous cherchez tous les
 * deux, accord de l'autre, réglage par défaut de la lecture, carte et coucous, révocation d'Apple, défi du jour,
 * bilan, série.
 */
import type { ApiClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { APPLE_TOKEN_CLIENT, type MemoryAppleTokenClient } from '../src/integrations/auth/apple-revocation';
import { ReviewsService } from '../src/modules/rituels/application/reviews.service';
import { RitualsContext } from '../src/modules/rituels/application/rituals-context';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, apiError, onboardBody, startWorld, upload } from './helpers';

type Client = { id: string; api: ApiClient };

describe('manques signalés par l’app', () => {
  let world: TestWorld;
  let db: MemoryDb;

  beforeAll(async () => {
    world = await startWorld();
    db = world.app.get<MemoryDb>(MEMORY_DB);
  });
  afterAll(() => world.close());

  const person = async (name: string, overrides: Parameters<typeof onboardBody>[0] = {}): Promise<Client> => {
    const c = world.client();
    await c.api.me.onboard(onboardBody({ displayName: name, ...overrides }));
    return c;
  };
  /** Un lien entre deux personnes, par le code d'invitation. */
  const link = async (a: Client, b: Client): Promise<string> => {
    const code = (await a.api.me.get()).inviteCode;
    return (await b.api.invites.accept(code)).id;
  };

  it('explication : où penche chacun sur les 4 axes (côté et cran), rien de plus ; ce que vous cherchez tous les deux', async () => {
    const ana = await person('Ana', { gender: 'femme', seeking: 'les_deux', whom: 'hommes', consents: { sensitive: true, location: true } });
    const ben = await person('Ben', { gender: 'homme', seeking: 'les_deux', whom: 'femmes', consents: { sensitive: true, location: true } });
    const cam = await person('Cam', { gender: 'homme', seeking: 'potes' });

    const { suggestions } = await ana.api.encounters.list();
    const toBen = suggestions.find((s) => s.user.id === ben.id);
    const toCam = suggestions.find((s) => s.user.id === cam.id);
    expect(toBen?.lookingFor).toBe('both');
    expect(toCam?.lookingFor).toBe('friends');
    const e = toBen?.explanation;
    for (const axis of [...(e?.common ?? []), e?.explore]) {
      expect(axis?.mine).toMatchObject({ side: expect.stringMatching(/^(low|mid|high)$/), strength: expect.stringMatching(/^(light|clear|strong)$/) });
      expect(Object.keys(axis?.theirs ?? {}).sort()).toEqual(['side', 'strength']);
    }
    // Même vision (mêmes réponses) : mêmes repères des deux côtés.
    expect(e?.common.every((c) => JSON.stringify(c.mine) === JSON.stringify(c.theirs))).toBe(true);
    // Toujours rien de « qui » ni de valeur chiffrée.
    const json = JSON.stringify(suggestions);
    for (const word of ['whom', 'seeking', '"value"', 'confidence']) expect(json).not.toContain(word);

    // Un coucou reçu porte aussi ce que vous cherchez tous les deux, et ses repères.
    await cam.api.encounters.wave(ana.id);
    const incoming = (await ana.api.encounters.list()).incoming.find((i) => i.from.id === cam.id);
    expect(incoming?.lookingFor).toBe('friends');
    expect(incoming?.explanation?.explore.theirs).toBeDefined();

    // Carte : les mêmes repères, et où vous en êtes.
    const pin = (await ben.api.vision.map()).pins.find((p) => p.user.id === ana.id);
    expect(pin?.explanation.common[0]?.mine).toBeDefined();
    expect(pin?.lookingFor).toBe('both');
  });

  it('carte : coucou envoyé ou reçu dit sur le repère ; liens et refus disparaissent comme dans les rencontres', async () => {
    const zoe = await person('Zoé');
    const yan = await person('Yan');
    const xia = await person('Xia');
    const wes = await person('Wes');
    const vic = await person('Vic');
    await yan.api.encounters.wave(zoe.id); // on salue Zoé
    await zoe.api.encounters.wave(xia.id); // Zoé salue Xia
    await link(zoe, wes); // déjà liés

    const map = await zoe.api.vision.map();
    const byId = new Map(map.pins.map((p) => [p.user.id, p]));
    expect(byId.get(yan.id)).toMatchObject({ relation: 'waved_you', encounterId: expect.any(String) });
    expect(byId.get(xia.id)).toMatchObject({ relation: 'waved', encounterId: null });
    expect(byId.get(vic.id)).toMatchObject({ relation: 'none', encounterId: null });
    expect(byId.has(wes.id)).toBe(false);
    expect(JSON.stringify(map)).not.toContain(wes.id);

    // Le coucou reçu s'accepte depuis la carte : le lien se crée, le repère disparaît.
    const encounterId = byId.get(yan.id)?.encounterId ?? '';
    await zoe.api.encounters.accept(encounterId);
    expect((await zoe.api.vision.map()).pins.map((p) => p.user.id)).not.toContain(yan.id);
    // Un refus retire la personne des deux côtés, tout de suite (malgré le cache du jour).
    const fromVic = await (async () => {
      await vic.api.encounters.wave(zoe.id);
      return (await zoe.api.encounters.list()).incoming.find((i) => i.from.id === vic.id)?.id ?? '';
    })();
    await zoe.api.encounters.decline(fromVic);
    expect((await zoe.api.vision.map()).pins.map((p) => p.user.id)).not.toContain(vic.id);
    expect((await vic.api.vision.map()).pins.map((p) => p.user.id)).not.toContain(zoe.id);
  });

  it('accord de l’autre : « pas encore » pour un refus comme pour une question pas vue ; « oui » quand il a dit oui', async () => {
    const lou = await person('Lou');
    const max = await person('Max');
    const id = await link(lou, max);
    expect((await lou.api.minimoas.get(id)).consent).toMatchObject({ mine: null, theirs: 'not_yet', byDefault: false, reading: false });
    await max.api.minimoas.update(id, { consent: false });
    const afterRefusal = await lou.api.minimoas.get(id);
    expect(afterRefusal.consent.theirs).toBe('not_yet');
    expect(JSON.stringify(afterRefusal)).not.toContain('declin');
    await max.api.minimoas.update(id, { consent: true });
    expect((await lou.api.minimoas.get(id)).consent.theirs).toBe('agreed');
    await lou.api.minimoas.update(id, { consent: true });
    expect((await lou.api.minimoas.get(id)).consent).toMatchObject({ mine: true, theirs: 'agreed', reading: true });
  });

  it('réglage par défaut : appliqué aux nouveaux liens (sans question), et un appel pour tous les liens', async () => {
    const noa = await person('Noa');
    const oli = await person('Oli');
    const pia = await person('Pia');
    const first = await link(noa, oli);
    expect((await noa.api.minimoas.mine()).readingDefault).toBe('ask');

    expect(await noa.api.minimoas.setDefault('on')).toEqual({ readingDefault: 'on' });
    expect((await noa.api.minimoas.mine()).readingDefault).toBe('on');
    // Le lien d'avant ne change pas ; le nouveau part de « oui » d'office, et le dit.
    expect((await noa.api.minimoas.get(first)).consent.mine).toBeNull();
    const second = await link(pia, noa);
    expect((await noa.api.minimoas.get(second)).consent).toMatchObject({ mine: true, byDefault: true, reading: false });
    expect((await pia.api.minimoas.get(second)).consent).toMatchObject({ mine: null, theirs: 'agreed' });
    // Répondre dans le chat remplace l'accord par défaut.
    await noa.api.minimoas.update(second, { consent: false });
    expect((await noa.api.minimoas.get(second)).consent).toMatchObject({ mine: false, byDefault: false });

    // Tous les liens d'un coup : un seul appel, le nombre de liens changés.
    expect(await noa.api.minimoas.setAll(true)).toEqual({ updated: 2 });
    const all = await noa.api.minimoas.mine();
    expect(all.items.map((i) => i.consent.mine)).toEqual([true, true]);
    expect(all.items.every((i) => i.consent.byDefault === false)).toBe(true);
    expect(await noa.api.minimoas.setAll(true)).toEqual({ updated: 0 });

    // « Toujours non » : le nouveau lien part de « non », sans question.
    await oli.api.minimoas.setDefault('off');
    const third = await link(oli, pia);
    expect((await oli.api.minimoas.get(third)).consent).toMatchObject({ mine: false, byDefault: true });
    expect(await apiError(oli.api.minimoas.setDefault('maybe' as 'on'))).toMatchObject({ code: 'invalid' });
  });

  it('Apple : le code de connexion est gardé, révoqué à la suppression ; un échec d’Apple ne bloque pas la suppression', async () => {
    const apple = world.app.get<MemoryAppleTokenClient>(APPLE_TOKEN_CLIENT);
    // La connexion précède l'inscription : le code s'envoie avant d'avoir un profil.
    const rae = world.client();
    expect(await rae.api.me.appleAuthorization('code-de-rae-123')).toEqual({ status: 'stored' });
    await rae.api.me.onboard(onboardBody({ displayName: 'Rae' }));
    expect(await apiError(rae.api.me.appleAuthorization('refuse-expired-code'))).toMatchObject({ code: 'invalid' });
    await rae.api.me.remove();
    expect(apple.revoked).toContainEqual({ refreshToken: 'memory-refresh:code-de-rae-123', clientId: 'app.blowy' });
    expect(db.appleTokens.has(rae.id)).toBe(false);

    const sam = await person('Sam');
    await sam.api.me.appleAuthorization('code-de-sam-456');
    apple.failRevoke = true;
    await sam.api.me.remove();
    apple.failRevoke = false;
    expect(db.profiles.has(sam.id)).toBe(false);
    expect(db.appleTokens.has(sam.id)).toBe(false);
    expect(apple.revoked.map((g) => g.refreshToken)).not.toContain('memory-refresh:code-de-sam-456');

    // Sans code envoyé (Google, mode local) : rien à révoquer, rien de bloqué.
    const tim = await person('Tim');
    const before = apple.revoked.length;
    await tim.api.me.remove();
    expect(apple.revoked).toHaveLength(before);
  });

  it('compte suspendu : il peut encore retirer le jeton push de son téléphone (déconnexion), rien d’autre', async () => {
    const kim = await person('Kim');
    const token = 'ExponentPushToken[suspendu-kim]';
    await kim.api.notifications.registerDevice({ token, platform: 'ios', timeZone: 'Europe/Paris' });
    db.suspensions.set(kim.id, { userId: kim.id, since: world.clock.now().toISOString(), until: null, reason: 'test', byEmail: 'admin@blowy.local' });
    world.clock.advanceMinutes(1); // le cache de la garde (30 s) expire
    expect(await apiError(kim.api.me.get())).toMatchObject({ code: 'suspended' });
    await kim.api.notifications.removeDevice(token);
    expect(db.pushDevices.has(token)).toBe(false);
    expect(await apiError(kim.api.notifications.settings())).toMatchObject({ code: 'suspended' });
  });

  it('défi du jour : l’axe visé ; défi photo : l’identifiant de la photo pour la garder après le verdict', async () => {
    const uma = await person('Uma');
    const { challenge } = await uma.api.rituals.today();
    expect(challenge).toHaveProperty('axis');
    const rec = db.dailyChallenges.find((c) => c.userId === uma.id);
    if (!rec) throw new Error('défi absent');
    expect(challenge.axis).toBe(rec.axis);

    Object.assign(rec, { kind: 'photo', challengeId: 'p_sourire', axis: null });
    const ticket = await uma.api.rituals.challengePhotoTicket('image/jpeg');
    await upload(ticket.uploadUrl);
    const done = await uma.api.rituals.challengePhoto(ticket.path);
    expect(done.photoId).toEqual(expect.any(String));
    expect(done.challenge.howTo).toBeDefined();
    await uma.api.rituals.keepPhoto(done.photoId ?? '', true);
    expect((await uma.api.rituals.memories()).items.map((m) => m.id)).toContain(done.photoId);
    // Les autres réponses : pas de photo.
    expect((await uma.api.rituals.streak()).current).toBe(1);
  });

  it('série : jours d’avant le compte neutres ; prochain palier = premier objet pas encore gagné', async () => {
    // Mercredi 11 novembre : lundi et mardi précèdent le compte.
    const vera = await person('Véra');
    const week = (await vera.api.rituals.streak()).week.map((d) => d.status);
    expect(week).toEqual(['not_yet', 'not_yet', 'today', 'future', 'future', 'future', 'future']);
    // Record de 9, série retombée puis repartie à 1 : 3 et 7 sont gagnés, on vise 14.
    const state = db.ritualStates.get(vera.id);
    db.ritualStates.set(vera.id, { ...(state ?? (await world.app.get(RitualsContext).state(vera.id))), streak: { current: 1, best: 9, lastDoneOn: '2026-11-10', jokerDays: [] } });
    const streak = await vera.api.rituals.streak();
    expect(streak.nextMilestone?.days).toBe(14);
    // Le jour compté par la série est « fait » dans la semaine, même s'il précède le compte.
    expect(streak.week[1]?.status).toBe('done');
  });

  it('bilan : mouvement de chaque axe en crans (vide pour un premier bilan)', async () => {
    const wil = await person('Wil');
    const ctx = world.app.get(RitualsContext);
    const reviews = world.app.get(ReviewsService);
    const profile = await ctx.profile(wil.id);
    await reviews.build(await ctx.state(wil.id), profile, '2026-10-26');
    await reviews.build(await ctx.state(wil.id), profile, '2026-11-02');
    const [latest, first] = (await wil.api.rituals.reviews()).reviews;
    expect(first?.axisMoves).toEqual([]);
    expect(latest?.axisMoves).toHaveLength(5);
    for (const m of latest?.axisMoves ?? []) expect(m).toEqual({ axis: m.axis, direction: 'steady', size: null });
  });
});
