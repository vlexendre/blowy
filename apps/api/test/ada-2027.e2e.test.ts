/**
 * Version simplifiée (docs/ADA-2027.md), côté API :
 * - décision 7 et item 26 : aucune réponse ne contient l'URL de la photo d'origine d'une personne sans lien noué (carte,
 *   rencontres, coucous reçus, historique) ; seule sort sa vignette très floue, faite par le serveur (`face: 'blurred'`),
 *   ou rien tant qu'elle n'existe pas (`hidden`) ; la photo nette arrive avec le lien ; la vignette suit la photo
 *   (changée, effacée avec le compte) ;
 * - les notifications des fonctions supprimées de l'app (ligue, défi et série hors Ton chemin, habitudes, bilans,
 *   groupes, premiers pas « habitude » et « groupe », lien « en danger ») ne partent plus vers un compte dont la dernière app vue est la version simplifiée ; les anciennes versions les reçoivent.
 * - item 27 : un lien ne perd plus de vies ; après un long silence, le minuteur n'envoie aucune alerte et le lien reste
 *   ouvert, il dit seulement son état (`warmth`) ; « Le réveiller » prévient l'autre une fois (réplique et notification
 *   `message`), un second appel ne fait rien ;
 * - relecture du 23/11/2026 (B1, B2) : aucune photo de l'autre (profil, anciennes photos) vers une paire bloquée ou un
 *   lien quitté ; les anciennes photos de l'autre seulement à partir du niveau 5 ; la photo de profil ne laisse rien
 *   derrière elle (changement, suppression du compte, refus), même en course avec le minuteur des vignettes.
 */
import { randomUUID } from 'node:crypto';
import { type ApiClient, createApiClient } from '@blowy/api-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { PUSHER } from '../src/integrations/push/pusher';
import type { MemoryImages } from '../src/integrations/images/memory-images';
import type { MemoryStorage } from '../src/integrations/storage/memory-storage';
import type { MemoryModel } from '../src/integrations/ai/memory-model';
import { AI_MODEL } from '../src/integrations/plateforme/plateforme.module';
import { AvatarBlurJobs } from '../src/modules/me/application/avatar-blur.jobs';
import { AvatarModeration } from '../src/modules/moderation/avatar-moderation';
import { blurPathOf } from '../src/modules/me/application/avatar-blurs';
import type { MemoryDb } from '../src/persistence/memory-db';
import { IMAGES, MEMORY_DB, STORAGE } from '../src/shared/tokens';
import { type TestWorld, errorCode, onboardBody, seedPastPhoto, startWorld, upload } from './helpers';

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
  describe('relecture B1 : rien de l’autre vers une paire bloquée ou un lien quitté', () => {
    /** Ana et Bob, liés, avec photos de profil et anciennes photos du jour des deux, lien au niveau 5. */
    const linked = async () => {
      const ana = await person('Ana');
      const bob = await person('Bob');
      await withPhoto(ana);
      await withPhoto(bob);
      await bob.api.encounters.wave(ana.id);
      const wave = (await ana.api.encounters.list()).incoming.find((i) => i.from.id === bob.id);
      const link = await ana.api.encounters.accept(wave?.id ?? '');
      await seedPastPhoto(world, link.id, ana.id, '2026-11-09');
      const bobPhoto = await seedPastPhoto(world, link.id, bob.id, '2026-11-09');
      const row = db.links.get(link.id);
      if (!row) throw new Error('lien absent');
      db.links.set(link.id, { ...row, level: 5, xp: 480 });
      // Lien ouvert : la photo de Bob et son ancienne photo arrivent chez Ana.
      expect((await ana.api.links.get(link.id)).other.avatarUrl).toMatch(AVATAR_URL);
      expect((await ana.api.links.memories(link.id)).photos[0]?.theirPhotoUrl).toBeTruthy();
      return { ana, bob, linkId: link.id, bobPhoto };
    };
    const photoUrl = (path: string): RegExp => new RegExp(path.split('/').map(encodeURIComponent).join('/').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    it('B bloque A : fiche, liste, messages et souvenirs introuvables pour les deux, aucune URL de photo', async () => {
      const { ana, bob, linkId, bobPhoto } = await linked();
      await bob.api.safety.block(ana.id);
      for (const [viewer, other] of [[ana, bob], [bob, ana]] as const) {
        expect(await errorCode(viewer.api.links.get(linkId))).toBe('not_found');
        expect(await errorCode(viewer.api.links.messages(linkId))).toBe('not_found');
        expect(await errorCode(viewer.api.links.memories(linkId))).toBe('not_found');
        expect(await errorCode(viewer.api.links.send(linkId, { body: 'hé' }))).toBe('not_found');
        const list = await viewer.api.links.list();
        expect(list.some((l) => l.other.id === other.id)).toBe(false);
        expect(JSON.stringify(list)).not.toMatch(AVATAR_URL);
      }
      expect(JSON.stringify(await ana.api.links.list())).not.toMatch(photoUrl(bobPhoto));
    });

    it('« Le laisser partir » : le lien rangé ne montre plus ni la photo ni les anciennes photos de l’autre', async () => {
      const { ana, bob, linkId, bobPhoto } = await linked();
      await bob.api.links.archive(linkId);
      const link = await ana.api.links.get(linkId);
      expect(link.status).toBe('archived');
      expect(link.other).toMatchObject({ face: 'hidden', avatarUrl: null });
      const messages = await ana.api.links.messages(linkId);
      const memories = await ana.api.links.memories(linkId);
      expect(memories.photos.every((d) => d.theirPhotoUrl === null)).toBe(true);
      for (const body of [link, messages, memories, await ana.api.links.list()].map((x) => JSON.stringify(x))) {
        expect(body).not.toMatch(AVATAR_URL);
        expect(body).not.toMatch(photoUrl(bobPhoto));
      }
      // Et de l'autre côté aussi.
      expect((await bob.api.links.get(linkId)).other).toMatchObject({ face: 'hidden', avatarUrl: null });
    });
  });

  describe('relecture B2 : la photo de profil ne laisse rien derrière elle', () => {
    const files = async (userId: string): Promise<string[]> => {
      const storage = world.app.get<MemoryStorage>(STORAGE);
      return [...(await storage.list(`avatars/${userId}`)), ...(await storage.list(`blurred/${userId}`))].map((f) => f.path).sort();
    };

    it('confirmation : tout sauf la nouvelle photo et sa vignette est effacé ; suppression du compte : les deux dossiers vides', async () => {
      const storage = world.app.get<MemoryStorage>(STORAGE);
      const bob = await person('Bob');
      // Un envoi jamais confirmé et une vignette égarée (course d'avant ce correctif).
      const stray = await bob.api.me.avatarTicket('image/jpeg');
      await upload(stray.uploadUrl);
      await storage.write(`blurred/${bob.id}/00000000-0000-0000-0000-000000000000.jpg`, { bytes: Buffer.from([1]), contentType: 'image/jpeg' });
      // Plus vieux que le ticket d'envoi (deux heures) : plus rien ne peut arriver, le ménage les efface.
      world.clock.advanceHours(3);
      const path = await withPhoto(bob);
      expect(await files(bob.id)).toEqual([path, blurPathOf(path)].sort());
      // La photo remplacée part tout de suite, même récente ; un envoi récent non confirmé reste (il peut être confirmé).
      const pending = await bob.api.me.avatarTicket('image/jpeg');
      await upload(pending.uploadUrl);
      const next = await withPhoto(bob);
      expect(await files(bob.id)).toEqual([pending.path, next, blurPathOf(next)].sort());

      // Un autre envoi non confirmé, puis la suppression du compte : rien ne reste.
      await upload((await bob.api.me.avatarTicket('image/jpeg')).uploadUrl);
      await bob.api.me.remove();
      expect(await files(bob.id)).toEqual([]);
    });

    it('vignette ratée à la confirmation : la photo est quand même à jour', async () => {
      const images = world.app.get<MemoryImages>(IMAGES);
      const bob = await person('Bob');
      const original = images.blurredThumbnail.bind(images);
      images.blurredThumbnail = async () => {
        throw new Error('panne');
      };
      try {
        const path = await withPhoto(bob);
        expect(db.profiles.get(bob.id)?.avatarPath).toBe(path);
        expect(await files(bob.id)).toEqual([path]);
      } finally {
        images.blurredThumbnail = original;
      }
    });

    describe('deux confirmations entrelacées : la photo courante survit', () => {
      /** Bob envoie deux photos ; la confirmation de la première laisse passer toute la seconde pendant `pause`. */
      const interleave = async (pause: 'moderation' | 'blur') => {
        const images = world.app.get<MemoryImages>(IMAGES);
        const moderation = world.app.get(AvatarModeration);
        const bob = await person('Bob');
        const tickets = [await bob.api.me.avatarTicket('image/jpeg'), await bob.api.me.avatarTicket('image/jpeg')];
        for (const t of tickets) await upload(t.uploadUrl);
        const [first, second] = tickets.map((t) => t.path) as [string, string];
        let armed = true;
        const during = async (): Promise<void> => {
          if (!armed) return;
          armed = false;
          await bob.api.me.setAvatar(second);
        };
        const review = moderation.review.bind(moderation);
        const blur = images.blurredThumbnail.bind(images);
        if (pause === 'moderation') {
          moderation.review = async (profile, path) => {
            await during();
            return review(profile, path);
          };
        } else {
          images.blurredThumbnail = async (input) => {
            await during();
            return blur(input);
          };
        }
        try {
          await bob.api.me.setAvatar(first);
        } finally {
          moderation.review = review;
          images.blurredThumbnail = blur;
        }
        return { bob, first, second };
      };

      it('la seconde confirmée pendant la modération de la première : la première, devenue courante, reste', async () => {
        const { bob, first } = await interleave('moderation');
        expect(db.profiles.get(bob.id)?.avatarPath).toBe(first);
        const current = await files(bob.id);
        expect(current).toContain(first);
        expect(current).toContain(blurPathOf(first));
        expect((await bob.api.me.get()).avatarUrl).toMatch(AVATAR_URL);
      });

      it('la seconde confirmée pendant la vignette de la première : la seconde, devenue courante, reste', async () => {
        const { bob, first, second } = await interleave('blur');
        expect(db.profiles.get(bob.id)?.avatarPath).toBe(second);
        expect(await files(bob.id)).toEqual(expect.arrayContaining([second, blurPathOf(second)]));
        // La vignette de la première, écrite après coup, est effacée par `AvatarBlurs.make`.
        expect(await files(bob.id)).not.toContain(blurPathOf(first));
      });
    });

    describe('courses avec le minuteur des vignettes', () => {
      /** Bob avec une photo d'avant la vignette ; le minuteur la traite et `during` se passe pendant le calcul. */
      const race = async (during: (bob: { id: string; api: ApiClient }, path: string) => Promise<void>) => {
        const storage = world.app.get<MemoryStorage>(STORAGE);
        const images = world.app.get<MemoryImages>(IMAGES);
        const bob = await person('Bob');
        const path = await withPhoto(bob);
        await storage.remove([blurPathOf(path)]);
        const original = images.blurredThumbnail.bind(images);
        let armed = true;
        images.blurredThumbnail = async (input) => {
          if (armed) {
            armed = false;
            await during(bob, path);
          }
          return original(input);
        };
        try {
          await world.app.get(AvatarBlurJobs).runDue(world.clock.now());
        } finally {
          images.blurredThumbnail = original;
        }
        return { bob, path };
      };

      it('pendant un changement de photo : seule la vignette de la nouvelle reste', async () => {
        let next = '';
        const { bob, path } = await race(async (b) => {
          next = await withPhoto(b);
        });
        expect(next).not.toBe(path);
        expect(await files(bob.id)).toEqual([next, blurPathOf(next)].sort());
      });

      it('pendant la suppression du compte : aucune vignette ne reste', async () => {
        const { bob } = await race(async (b) => {
          await b.api.me.remove();
        });
        expect(await files(bob.id)).toEqual([]);
      });

      it('pendant un refus de la modération : aucune vignette ne reste', async () => {
        const model = world.app.get<MemoryModel>(AI_MODEL);
        const { bob } = await race(async (b, path) => {
          const profile = db.profiles.get(b.id);
          if (!profile) throw new Error('profil absent');
          model.respondWith((c) => (c.system.includes('photos de profil') ? 'SEXUAL' : 'oui'));
          try {
            expect(await world.app.get(AvatarModeration).review(profile, path)).toBe('rejected');
          } finally {
            model.respondWith(null);
          }
        });
        expect(db.profiles.get(bob.id)?.avatarPath).toBeNull();
        expect(await files(bob.id)).toEqual([]);
      });
    });
  });

  describe('relecture B5 : « Le réveiller » prévient l’autre, une fois, doucement', () => {
    it('un réveil : deux répliques (chacun la sienne) et une notification `message` ; un second appel le même jour : rien', async () => {
      const pusher = world.app.get<MemoryPusher>(PUSHER);
      const ana = await person('Ana');
      const bob = await person('Bob');
      const token = `ExponentPushToken[bob-${bob.id.slice(0, 6)}]`;
      await bob.api.notifications.registerDevice({ token, platform: 'ios', timeZone: 'Europe/Paris' });
      await bob.api.encounters.wave(ana.id);
      const wave = (await ana.api.encounters.list()).incoming.find((i) => i.from.id === bob.id);
      const link = await ana.api.encounters.accept(wave?.id ?? '');
      // Un lien qui ne dort pas : rien, sans erreur.
      expect((await ana.api.links.revive(link.id)).messages).toEqual([]);
      world.clock.advanceDays(15);
      expect((await ana.api.links.get(link.id)).warmth).toBe('endormi');
      const sent = () => pusher.outbox.filter((m) => m.to === token);
      const before = sent().length;
      const xp = db.links.get(link.id)?.xp;
      // Tout est lu avant le réveil : les non-lus qui suivent ne comptent que le coucou.
      await ana.api.links.read(link.id);
      await bob.api.links.read(link.id);

      const woken = await ana.api.links.revive(link.id);
      expect(woken.link).toMatchObject({ warmth: 'calme', streak: 0 });
      expect(db.links.get(link.id)?.xp).toBe(xp);
      expect(woken.messages.map((m) => [m.author, m.body])).toEqual([['my_pet', 'Je lui ai fait un petit coucou.']]);
      const bobSees = (await bob.api.links.messages(link.id)).messages.slice(-1);
      expect(bobSees.map((m) => [m.author, m.body])).toEqual([['other_pet', 'Coucou de la part de Ana. Un mot quand tu veux.']]);
      // Le coucou compte comme non lu chez Bob, et rien chez Ana (sa propre réplique ne compte pas).
      const unreadOf = async (c: { api: ApiClient }) => (await c.api.links.list()).find((l) => l.id === link.id)?.unread;
      expect(await unreadOf(bob)).toBe(1);
      expect(await unreadOf(ana)).toBe(0);
      const anaSees = (await ana.api.links.messages(link.id)).messages.map((m) => m.body);
      expect(anaSees).not.toContain('Coucou de la part de Ana. Un mot quand tu veux.');
      const pushes = sent().slice(before);
      expect(pushes).toHaveLength(1);
      expect(pushes[0]?.data.kind).toBe('message');
      expect(pushes[0]?.body).toMatch(/te fait un petit coucou\.$/);
      expect(JSON.stringify(pushes[0])).not.toMatch(/t’attend|attend/);

      // Second appel le même jour : ni réplique, ni notification, ni erreur.
      const again = await ana.api.links.revive(link.id);
      expect(again.messages).toEqual([]);
      expect(sent().slice(before)).toHaveLength(1);
    });
  });
});
