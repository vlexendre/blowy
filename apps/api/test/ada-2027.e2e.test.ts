/**
 * Version simplifiée (docs/ADA-2027.md), côté API :
 * - décision 7 : aucune réponse ne contient l'URL de la photo d'une personne sans lien noué (carte, rencontres, coucous
 *   reçus) ; le flou n'est plus confié au téléphone ;
 * - les notifications des fonctions supprimées de l'app (ligue, défi et série hors Ton chemin, habitudes, bilans,
 *   groupes, premiers pas « habitude » et « groupe ») ne partent plus vers un compte dont la dernière app vue est la version simplifiée ; les anciennes versions les reçoivent.
 */
import { randomUUID } from 'node:crypto';
import { type ApiClient, createApiClient } from '@blowy/api-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { PUSHER } from '../src/integrations/push/pusher';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { type TestWorld, onboardBody, startWorld, upload } from './helpers';

/** Premier build de la version simplifiée, dans ces tests. */
const ADA_BUILD = 70;
const OLD_BUILD = 60;
/** ~300 m de la place de la République. */
const NEAR = { latitude: 48.87, longitude: 2.366 };
/** Une URL de lecture d'une photo de profil (stockage en mémoire : `/dev/media/avatars/…`). */
const AVATAR_URL = /\/dev\/media\/avatars/;

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

  it('aucune URL de photo pour une personne sans lien noué (carte, rencontres, coucous) ; nette une fois liés', async () => {
    const ana = await person('Ana');
    const bob = await person('Bob');
    const ticket = await bob.api.me.avatarTicket('image/jpeg');
    await upload(ticket.uploadUrl);
    expect((await bob.api.me.setAvatar(ticket.path)).avatarUrl).toMatch(AVATAR_URL);
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
      expect(pin?.user).toMatchObject({ face: 'hidden', avatarUrl: null });
      expect(JSON.stringify(map)).not.toMatch(AVATAR_URL);

      const encounters = await ana.api.encounters.list();
      expect(encounters.suggestions.map((s) => s.user.id)).toContain(bob.id);
      expect(JSON.stringify(encounters)).not.toMatch(AVATAR_URL);
    }

    // Bob salue Ana : le coucou reçu ne montre pas sa photo non plus.
    await bob.api.encounters.wave(ana.id);
    const withWave = await ana.api.encounters.list();
    expect(withWave.incoming.map((i) => i.from.id)).toContain(bob.id);
    expect(JSON.stringify(withWave)).not.toMatch(AVATAR_URL);
    expect(JSON.stringify(await ana.api.vision.map())).not.toMatch(AVATAR_URL);

    // Lien noué : la photo arrive, nette.
    const link = await ana.api.encounters.accept(withWave.incoming.find((i) => i.from.id === bob.id)?.id ?? '');
    expect(link.other).toMatchObject({ id: bob.id, face: 'clear' });
    expect(link.other.avatarUrl).toMatch(AVATAR_URL);
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
});
