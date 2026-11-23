/**
 * Version simplifiée (docs/ADA-2027.md), côté API :
 * - décision 7 et item 26 : aucune réponse ne contient l'URL de la photo d'origine d'une personne sans lien noué (carte,
 *   rencontres, coucous reçus, historique) ; seule sort sa vignette très floue, faite par le serveur (`face: 'blurred'`),
 *   ou rien tant qu'elle n'existe pas (`hidden`) ; la photo nette arrive avec le lien ; la vignette suit la photo
 *   (changée, effacée avec le compte) ;
 * - les notifications des fonctions supprimées de l'app (ligue, défi et série hors Ton chemin, habitudes, bilans,
 *   groupes, premiers pas « habitude » et « groupe », lien « en danger ») ne partent plus vers un compte dont la dernière app vue est la version simplifiée ; les anciennes versions les reçoivent.
 * - item 27 : un lien ne perd plus de vies ; après un long silence, le minuteur n'envoie aucune alerte et le lien reste
 *   ouvert, il dit seulement son état (`warmth`).
 */
import { randomUUID } from 'node:crypto';
import { type ApiClient, createApiClient } from '@blowy/api-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { PUSHER } from '../src/integrations/push/pusher';
import type { MemoryImages } from '../src/integrations/images/memory-images';
import type { MemoryStorage } from '../src/integrations/storage/memory-storage';
import { AvatarBlurJobs } from '../src/modules/me/application/avatar-blur.jobs';
import { blurPathOf } from '../src/modules/me/application/avatar-blurs';
import type { MemoryDb } from '../src/persistence/memory-db';
import { IMAGES, MEMORY_DB, STORAGE } from '../src/shared/tokens';
import { type TestWorld, onboardBody, startWorld, upload } from './helpers';

/** Premier build de la version simplifiée, dans ces tests. */
const ADA_BUILD = 70;
const OLD_BUILD = 60;
/** ~300 m de la place de la République. */
const NEAR = { latitude: 48.87, longitude: 2.366 };
/** Une URL de lecture d'une photo de profil (stockage en mémoire : `/dev/media/avatars/…`). */
const AVATAR_URL = /\/dev\/media\/avatars/;
/** Une URL de lecture d'une vignette floue (`/dev/media/blurred/…`). */
const BLURRED_URL = /\/dev\/media\/blurred\//;

describe('ADA 2027 : visages et notifications', () => {
  let world: TestWorld;
  let db: MemoryDb;

  beforeEach(async () => {
    world = await startWorld({ APP_IOS_ADA_BUILD: String(ADA_BUILD) });
    db = world.app.get<MemoryDb>(MEMORY_DB);
  });
  afterEach(() => world.close());

  const app = (id: string, build: number): ApiClient =>
    createApiClient({ baseUrl: world.baseUrl, getToken: () => `test:${id}`, getClientInfo: () => ({ platform: 'ios', build }) });
  const person = async (name: string, build = ADA_BUILD, location = NEAR) => {
    const id = randomUUID();
    const api = app(id, build);
    await api.me.onboard(onboardBody({ displayName: name, location }));
    return { id, api };
  };
  /** Minimoa en forme (sinon il boude et ne présente personne). */
  const cheerUp = (): void => {
    for (const [key, pet] of db.pets) {
      const full = Object.fromEntries(Object.keys(pet.needs).map((k) => [k, 100])) as typeof pet.needs;
      db.pets.set(key, { ...pet, needs: full, needsAt: world.clock.now().toISOString() });
    }
  };

  /** Bob avec une photo de profil ; rend son chemin dans le stockage. */
  const withPhoto = async (c: { api: ApiClient }): Promise<string> => {
    const ticket = await c.api.me.avatarTicket('image/jpeg');
    await upload(ticket.uploadUrl);
    expect((await c.api.me.setAvatar(ticket.path)).avatarUrl).toMatch(AVATAR_URL);
    return ticket.path;
  };
  const fetchBytes = async (url: string): Promise<Buffer> => {
    const res = await fetch(url);
    expect(res.status).toBe(200);
    return Buffer.from(await res.arrayBuffer());
  };

  it('sans lien : jamais l’original, la vignette floue du serveur (carte, rencontres, coucous, historique) ; nette une fois liés', async () => {
    const ana = await person('Ana');
    const bob = await person('Bob');
    const path = await withPhoto(bob);
    const storage = world.app.get<MemoryStorage>(STORAGE);
    const original = storage.peek(path)?.bytes;
    expect(storage.peek(blurPathOf(path)), 'vignette faite à l’envoi').not.toBeNull();
    // Gratuit puis Minimoa+ : même règle (Minimoa+ vend l'étendue, jamais les visages).
    for (const plus of [false, true]) {
      const p = db.profiles.get(ana.id);
      if (!p) throw new Error('profil absent');
      db.profiles.set(ana.id, { ...p, plusUntil: plus ? new Date(world.clock.now().getTime() + 30 * 86_400_000).toISOString() : null });
      world.clock.advanceDays(1);
      cheerUp();

      const map = await ana.api.vision.map();
      const pin = map.pins.find((x) => x.user.id === bob.id);
      expect(pin, 'Bob est sur la carte').toBeDefined();
      expect(pin?.user.face).toBe('blurred');
      expect(pin?.user.avatarUrl).toMatch(BLURRED_URL);
      expect(JSON.stringify(map)).not.toMatch(AVATAR_URL);

      const encounters = await ana.api.encounters.list();
      const suggested = encounters.suggestions.find((s) => s.user.id === bob.id);
      expect(suggested?.user.face).toBe('blurred');
      expect(suggested?.user.avatarUrl).toMatch(BLURRED_URL);
      expect(JSON.stringify(encounters)).not.toMatch(AVATAR_URL);
    }

    // La vignette n'est pas la photo : rien de ses octets ne sort.
    const pin = (await ana.api.vision.map()).pins.find((x) => x.user.id === bob.id);
    const blurred = await fetchBytes(pin?.user.avatarUrl ?? '');
    expect(original).toBeDefined();
    expect(blurred.equals(original ?? Buffer.alloc(0))).toBe(false);
    expect(blurred.includes(original ?? Buffer.alloc(0))).toBe(false);

    // Bob salue Ana : le coucou reçu montre la vignette floue, pas la photo.
    await bob.api.encounters.wave(ana.id);
    const withWave = await ana.api.encounters.list();
    const wave = withWave.incoming.find((i) => i.from.id === bob.id);
    expect(wave?.from.face).toBe('blurred');
    expect(wave?.from.avatarUrl).toMatch(BLURRED_URL);
    expect(JSON.stringify(withWave)).not.toMatch(AVATAR_URL);
    expect(JSON.stringify(await ana.api.vision.map())).not.toMatch(AVATAR_URL);

    // Lien noué : la photo arrive, nette ; l'historique des rencontres, lui, reste flou.
    const link = await ana.api.encounters.accept(wave?.id ?? '');
    expect(link.other).toMatchObject({ id: bob.id, face: 'clear' });
    expect(link.other.avatarUrl).toMatch(AVATAR_URL);
    const history = await ana.api.encounters.history();
    expect(history.items.find((i) => i.person.id === bob.id)?.person).toMatchObject({ face: 'blurred' });
    expect(JSON.stringify(history)).not.toMatch(AVATAR_URL);
  });

  it('photo changée : nouvelle vignette, l’ancienne effacée ; compte supprimé : photo et vignette effacées', async () => {
    const storage = world.app.get<MemoryStorage>(STORAGE);
    const bob = await person('Bob');
    const first = await withPhoto(bob);
    const second = await withPhoto(bob);
    expect(await storage.exists(blurPathOf(first))).toBe(false);
    expect(await storage.exists(first)).toBe(false);
    expect(await storage.exists(blurPathOf(second))).toBe(true);

    await bob.api.me.remove();
    expect(await storage.exists(second)).toBe(false);
    expect(await storage.exists(blurPathOf(second))).toBe(false);
  });

  it('photo d’avant la vignette : minimoa (hidden) jusqu’au rattrapage du minuteur, puis floue ; idempotent', async () => {
    const storage = world.app.get<MemoryStorage>(STORAGE);
    const images = world.app.get<MemoryImages>(IMAGES);
    const ana = await person('Ana');
    const bob = await person('Bob');
    const path = await withPhoto(bob);
    // Comme une photo envoyée avant le déploiement : pas de vignette.
    await storage.remove([blurPathOf(path)]);
    world.clock.advanceDays(1);
    cheerUp();

    const before = (await ana.api.vision.map()).pins.find((x) => x.user.id === bob.id);
    expect(before?.user).toMatchObject({ face: 'hidden', avatarUrl: null });

    const jobs = world.app.get(AvatarBlurJobs);
    const made = images.made;
    expect(await jobs.runDue(world.clock.now())).toBe(1);
    expect(images.made).toBe(made + 1);
    // Deuxième passage (même après la pause de 24 h) : rien à refaire.
    world.clock.advanceDays(2);
    cheerUp();
    expect(await jobs.runDue(world.clock.now())).toBe(0);
    expect(images.made).toBe(made + 1);

    const after = (await ana.api.vision.map()).pins.find((x) => x.user.id === bob.id);
    expect(after?.user.face).toBe('blurred');
    expect(after?.user.avatarUrl).toMatch(BLURRED_URL);
  });

  describe('notifications des fonctions retirées', () => {
    let pusher: MemoryPusher;
    let notifier: Notifier;

    beforeEach(() => {
      pusher = world.app.get<MemoryPusher>(PUSHER);
      notifier = world.app.get<Notifier>(NOTIFIER);
      // 19 h à Paris : dans la fenêtre de la série en danger (17-22 h), hors heures calmes.
      world.clock.advanceHours(8);
    });

    /** Inscrit, avec un appareil, et vu sur Ton chemin avec ce build (dernière app vue du compte). */
    const withDevice = async (name: string, build: number) => {
      const c = await person(name, build);
      const token = `ExponentPushToken[${name}-${c.id.slice(0, 6)}]`;
      await c.api.notifications.registerDevice({ token, platform: 'ios', timeZone: 'Europe/Paris' });
      await c.api.chemin.map();
      return { ...c, token };
    };
    const kindsSentTo = (token: string) => pusher.outbox.filter((m) => m.to === token).map((m) => m.data.kind);
    const loggedKinds = (userId: string) => db.notificationLog.filter((l) => l.userId === userId).map((l) => l.kind);

    const RETIRED = [
      ['league', { step: 'up' }],
      ['habit_proof', { habit: 'Sport', ask: 'Une photo ?' }],
      ['weekly_review', { petName: 'Nino' }],
      ['group_invite', { name: 'Léa', groupId: randomUUID() }],
      ['together_proposal', { name: 'Léa', habit: 'Sport' }],
      ['group_message', { name: 'Léa', groupId: randomUUID() }],
      ['group_life_lost', { groupId: randomUUID() }],
      ['group_asleep', { groupId: randomUUID() }],
      ['group_joined', { name: 'Léa', groupId: randomUUID() }],
      ['daily_challenge', { challenge: 'Dis bonjour à un voisin' }],
      ['streak_in_danger', { count: '4' }],
      ['first_steps', { step: 'habit', minimoa: 'Nino' }],
      ['first_steps', { step: 'group', minimoa: 'Nino' }],
      // Ancienne clé d'un report : `d3` était le premier pas « groupe ».
      ['first_steps', { step: 'd3', minimoa: 'Nino' }],
      // Item 27 : « un mot pour un lien » venait des vies d'un lien, retirées.
      ['link_in_danger', { name: 'Léa', linkId: randomUUID(), lives: '2' }],
    ] as const;

    it('version simplifiée : rien des fonctions retirées ; le rappel de la séance et les messages partent', async () => {
      const nina = await withDevice('Nina', ADA_BUILD);
      for (const [kind, vars] of RETIRED) await notifier.notify(nina.id, kind, { ...vars });
      expect(kindsSentTo(nina.token)).toEqual([]);
      expect(loggedKinds(nina.id)).toEqual([]);

      await notifier.notify(nina.id, 'daily_challenge', { step: 'chemin', minimoa: 'Nino' });
      await notifier.notify(nina.id, 'message', { name: 'Léa', linkId: randomUUID() });
      expect(kindsSentTo(nina.token)).toEqual(['daily_challenge', 'message']);
    });

    it('version simplifiée : la série de Ton chemin et les premiers pas qui ont un écran restent', async () => {
      const kept = [
        ['streak_in_danger', { count: '4', step: 'chemin' }],
        ['first_steps', { step: 'people', minimoa: 'Nino' }],
        ['first_steps', { step: 'words', minimoa: 'Nino' }],
        ['first_steps', { step: 'week', minimoa: 'Nino' }],
      ] as const;
      for (const [i, [kind, vars]] of kept.entries()) {
        const c = await withDevice(`Kept${i}`, ADA_BUILD);
        await notifier.notify(c.id, kind, { ...vars });
        expect(loggedKinds(c.id), `${kind} ${vars.step}`).toContain(kind);
      }
    });

    it('ancienne version : elle les reçoit toujours', async () => {
      for (const [i, [kind, vars]] of RETIRED.entries()) {
        const old = await withDevice(`Old${i}`, OLD_BUILD);
        await notifier.notify(old.id, kind, { ...vars });
        // Envoyée (ou gardée pour plus tard par les règles habituelles) : la notification passe par la décision.
        expect(loggedKinds(old.id), kind).toContain(kind);
      }
    });

    it('un compte jamais vu sur Ton chemin (build inconnu) : comme avant', async () => {
      const c = await person('Zoé', ADA_BUILD);
      const token = `ExponentPushToken[zoe-${c.id.slice(0, 6)}]`;
      await c.api.notifications.registerDevice({ token, platform: 'ios', timeZone: 'Europe/Paris' });
      await notifier.notify(c.id, 'weekly_review', { petName: 'Nino' });
      expect(loggedKinds(c.id)).toContain('weekly_review');
    });

    it('le minuteur du matin envoie la séance, jamais le défi, à la version simplifiée', async () => {
      const secret = 'un-secret-de-test-assez-long-pour-passer';
      await world.close();
      world = await startWorld({ APP_IOS_ADA_BUILD: String(ADA_BUILD), INTERNAL_TICK_SECRET: secret });
      db = world.app.get<MemoryDb>(MEMORY_DB);
      pusher = world.app.get<MemoryPusher>(PUSHER);
      const nina = await withDevice('Nina', ADA_BUILD);
      const old = await withDevice('Olga', OLD_BUILD);
      for (let i = 0; i < 2; i++) {
        world.clock.advanceDays(1);
        cheerUp();
        await nina.api.chemin.map();
        await old.api.chemin.map();
        await fetch(`${world.baseUrl}/internal/tick`, { method: 'POST', headers: { 'x-tick-secret': secret } });
      }
      const morning = (token: string) => pusher.outbox.filter((m) => m.to === token && m.data.kind === 'daily_challenge');
      expect(morning(nina.token).length).toBeGreaterThan(0);
      expect(morning(nina.token).every((m) => m.data.url === 'blowy://chemin')).toBe(true);
      expect(morning(old.token).length).toBeGreaterThan(0);
      expect(morning(old.token).every((m) => m.data.url !== 'blowy://chemin')).toBe(true);
    });
  });

  describe('item 27 : le lien ne se perd plus', () => {
    it('après deux semaines de silence et le minuteur chaque jour : aucune alerte, aucune réplique, le lien reste ouvert', async () => {
      const secret = 'un-secret-de-test-assez-long-pour-passer';
      await world.close();
      world = await startWorld({ APP_IOS_ADA_BUILD: String(ADA_BUILD), INTERNAL_TICK_SECRET: secret });
      db = world.app.get<MemoryDb>(MEMORY_DB);
      const ana = await person('Ana', OLD_BUILD);
      const bob = await person('Bob', OLD_BUILD);
      await bob.api.encounters.wave(ana.id);
      const incoming = (await ana.api.encounters.list()).incoming.find((i) => i.from.id === bob.id);
      const link = await ana.api.encounters.accept(incoming?.id ?? '');
      expect(link).toMatchObject({ status: 'active', lives: 7, canRevive: false, warmth: 'calme' });
      const before = (await ana.api.links.messages(link.id)).messages.length;
      for (let i = 0; i < 14; i++) {
        world.clock.advanceDays(1);
        await fetch(`${world.baseUrl}/internal/tick`, { method: 'POST', headers: { 'x-tick-secret': secret } });
      }
      expect(db.notificationLog.filter((l) => l.kind === 'link_in_danger')).toEqual([]);
      const later = await ana.api.links.get(link.id);
      expect(later).toMatchObject({ status: 'active', lives: 7, canRevive: false, warmth: 'endormi' });
      const page = await ana.api.links.messages(link.id);
      // Les relances des minimoas (silence de 72 h) peuvent parler ; aucune ne compte des vies.
      const added = page.messages.slice(0, page.messages.length - before);
      expect(added.filter((m) => /\bvies?\b|\blives?\b/i.test(m.body ?? ''))).toEqual([]);
      const back = await ana.api.links.send(link.id, { body: 'Coucou, ça fait un moment !' });
      expect(back.link.warmth).toBe('vivant');
    });
  });
});
