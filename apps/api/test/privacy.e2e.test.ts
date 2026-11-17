/**
 * Confidentialité (audit du 17 nov., `work/w3/s/AUDIT.md`) : ce que l'API renvoie des autres, en JSON brut (le client
 * typé retire les champs inconnus : on lit donc la réponse telle qu'elle part), et la zone de sa propre carte.
 */
import { randomUUID } from 'node:crypto';
import type { ApiClient } from '@blowy/api-client';
import { GRID_METERS, HOME_SETTLE_CONFIRM_MINUTES, HOME_SETTLE_HOURS, distanceKm } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type TestWorld, errorCode, onboardBody, startWorld } from './helpers';

type Client = { id: string; api: ApiClient; token: string };

/** Paris 14e : un premier relevé « faux » (position en cache, inscription faite ailleurs). */
const PARIS_14 = { latitude: 48.8402, longitude: 2.3201 };
/** Saint-Cloud : là où la personne est vraiment. */
const SAINT_CLOUD = { latitude: 48.8443, longitude: 2.2196 };
/** À ~400 m de Saint-Cloud : dans la zone visible. */
const SAINT_CLOUD_NEAR = { latitude: 48.8471, longitude: 2.2231 };

const km = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number =>
  distanceKm({ lat: a.latitude, lng: a.longitude }, { lat: b.latitude, lng: b.longitude });

/** Clés qui ne doivent jamais apparaître dans ce qu'on voit des autres. */
const FORBIDDEN_KEYS = ['email', 'birthdate', 'age', 'gender', 'seeking', 'whom', 'identity', 'distance', 'distanceKm', 'lastSeen', 'lastSeenAt', 'locatedAt', 'consentAt', 'home', 'axes', 'confidence', 'lowLabel', 'inviteCode', 'wordsCode', 'visionAnswers', 'sensitiveConsentAt'];

function keysOf(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const v of value) keysOf(v, out);
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keysOf(v, out);
    }
  }
  return out;
}

function numbersOf(value: unknown, out: number[] = []): number[] {
  if (typeof value === 'number') out.push(value);
  else if (Array.isArray(value)) for (const v of value) numbersOf(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) numbersOf(v, out);
  return out;
}

describe('confidentialité', () => {
  let world: TestWorld;

  beforeAll(async () => {
    world = await startWorld();
  });
  afterAll(() => world.close());

  const person = async (name: string, overrides: Parameters<typeof onboardBody>[0] = {}, email?: string): Promise<Client> => {
    const id = randomUUID();
    const c = world.client(id, email);
    await c.api.me.onboard(onboardBody({ displayName: name, ...overrides }));
    return { ...c, token: email ? `test:${id}:${email}` : `test:${id}` };
  };

  /** La réponse brute (JSON tel qu'il part de l'API), sans passer par les schémas du client. */
  const raw = async (who: Client | null, method: string, path: string): Promise<{ status: number; body: unknown }> => {
    const res = await fetch(`${world.baseUrl}${path}`, { method, headers: who ? { authorization: `Bearer ${who.token}` } : {} });
    return { status: res.status, body: await res.json().catch(() => null) };
  };

  it('ma zone : un premier relevé faux ne la fixe pas ; elle se cale sur ma vraie position (arrondie), centre de ma carte', async () => {
    const me = await person('Sam', { location: PARIS_14 });
    expect(km((await me.api.me.get()).identity.location.zone?.center ?? PARIS_14, PARIS_14)).toBeLessThan(0.3);

    world.clock.advanceMinutes(4);
    await me.api.vision.locate(SAINT_CLOUD);
    world.clock.advanceMinutes(HOME_SETTLE_CONFIRM_MINUTES);
    const status = await me.api.vision.locate(SAINT_CLOUD);
    const center = status.zone?.center;
    if (!center) throw new Error('zone absente');
    // Centre de la maille de ~300 m : proche, jamais le point exact.
    expect(km(center, SAINT_CLOUD)).toBeLessThan((GRID_METERS / 1000) * 0.75);
    expect(center).not.toEqual(SAINT_CLOUD);
    const map = await me.api.vision.map();
    expect(map.center).toEqual(center);

    // Les premiers jours passés, une sortie d'une heure ne déplace plus la zone (règle des 72 h).
    world.clock.advanceHours(HOME_SETTLE_HOURS);
    await me.api.vision.locate(PARIS_14);
    world.clock.advanceMinutes(HOME_SETTLE_CONFIRM_MINUTES);
    expect((await me.api.vision.locate(PARIS_14)).zone?.center).toEqual(center);
    await me.api.vision.locate(SAINT_CLOUD);
  });

  it('ce que je vois des autres : ni e-mail, ni naissance, ni sexe, ni distance, ni position exacte', async () => {
    const ana = await person('Ana', { gender: 'femme', location: SAINT_CLOUD }, 'ana@example.org');
    const hugoEmail = 'hugo.secret@example.org';
    const hugo = await person(
      'Hugo',
      { gender: 'homme', location: SAINT_CLOUD_NEAR, birthdate: '1993-02-17' },
      hugoEmail,
    );
    const lea = await person('Léa', { gender: 'femme', location: SAINT_CLOUD_NEAR, birthdate: '1990-07-08' }, 'lea.secret@example.org');
    world.clock.advanceDays(1);

    // Léa et Ana sont liées (invitation) ; Hugo salue Ana.
    const leaMe = await lea.api.me.get();
    const link = await ana.api.invites.accept(leaMe.inviteCode);
    await lea.api.links.send(link.id, { body: 'Coucou' });
    await hugo.api.encounters.wave(ana.id);
    const hugoMe = await hugo.api.me.get();

    const map = await raw(ana, 'GET', '/v1/map');
    expect(map.status).toBe(200);
    const pins = (map.body as { pins: { user: { id: string }; position: { latitude: number; longitude: number } }[] }).pins;
    const pin = pins.find((p) => p.user.id === hugo.id);
    expect(pin).toBeDefined();
    if (pin) {
      // Arrondie (~300 m) et décalée : ni le point exact, ni le centre de sa maille.
      expect(pin.position).not.toEqual(SAINT_CLOUD_NEAR);
      expect(km(pin.position, SAINT_CLOUD_NEAR)).toBeLessThan(0.4);
      const hugoZone = hugoMe.identity.location.zone?.center;
      expect(pin.position).not.toEqual(hugoZone);
    }

    const responses = await Promise.all([
      raw(ana, 'GET', '/v1/map'),
      raw(ana, 'GET', '/v1/encounters'),
      raw(ana, 'GET', '/v1/encounters/history'),
      raw(ana, 'GET', '/v1/links'),
      raw(ana, 'GET', `/v1/links/${link.id}`),
      raw(ana, 'GET', `/v1/links/${link.id}/messages`),
      raw(ana, 'GET', `/v1/links/${link.id}/memories`),
      raw(ana, 'GET', '/v1/plus/paywall'),
      raw(null, 'GET', `/v1/invites/${hugoMe.inviteCode}`),
      raw(null, 'GET', `/v1/words/${hugoMe.wordsCode}`),
    ]);
    for (const r of responses) expect(r.status).toBe(200);
    const json = JSON.stringify(responses.map((r) => r.body));
    // Ce que l'on sait de Hugo et de Léa ne sort pas.
    for (const secret of [hugoEmail, 'lea.secret@example.org', '1993-02-17', '1990-07-08']) expect(json).not.toContain(secret);
    // Aucun nombre n'est une coordonnée exacte de Hugo ou de Léa, ni le centre de la maille de Hugo.
    const exact = [SAINT_CLOUD_NEAR.latitude, SAINT_CLOUD_NEAR.longitude, hugoMe.identity.location.zone?.center.latitude ?? 0, hugoMe.identity.location.zone?.center.longitude ?? 0];
    for (const n of numbersOf(responses.map((r) => r.body))) for (const e of exact) expect(Math.abs(n - e)).toBeGreaterThan(1e-7);
    expect(json).not.toContain(hugoMe.inviteCode);
    expect(json).not.toContain(hugoMe.wordsCode);
    expect(json).not.toContain(leaMe.inviteCode);
    // Ni les clés qui les porteraient.
    const keys = keysOf(responses.map((r) => r.body));
    for (const k of FORBIDDEN_KEYS) expect(keys.has(k), `clé « ${k} »`).toBe(false);
  });

  it('une invitation de quelqu’un qui t’a bloqué : introuvable (rien ne trahit le blocage)', async () => {
    const zoe = await person('Zoé', { location: SAINT_CLOUD });
    const yan = await person('Yan', { location: SAINT_CLOUD });
    await zoe.api.safety.block(yan.id);
    const code = (await zoe.api.me.get()).inviteCode;
    expect(await errorCode(yan.api.invites.accept(code))).toBe('not_found');
    const unknown = await raw(yan, 'POST', `/v1/invites/ZZZZZZZZ/accept`);
    const blocked = await raw(yan, 'POST', `/v1/invites/${code}/accept`);
    // Même réponse qu'un code qui n'existe pas.
    expect(blocked).toEqual(unknown);
  });

  it('pages publiques par code : limitées par adresse IP (essais de codes en masse)', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) statuses.push((await raw(null, 'GET', `/v1/invites/CODE${String(i).padStart(4, '0')}`)).status);
    expect(statuses.slice(0, 20).every((s) => s === 404)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
    world.clock.advanceMinutes(2);
  });
});
