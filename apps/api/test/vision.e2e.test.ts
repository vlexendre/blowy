/** Vision : inscription avec les nouveaux champs, test, profil, rencontres filtrées et expliquées, carte, mode discret. */
import type { ApiClient } from '@blowy/api-client';
import { MATCH_THRESHOLD, ZONE_RADIUS_KM, distanceKm } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MemoryDb } from '../src/persistence/memory-db';
import { MEMORY_DB } from '../src/shared/tokens';
import { PARIS, type TestWorld, apiError, errorCode, onboardBody, startWorld, visionAnswers } from './helpers';

type Client = { id: string; api: ApiClient };

/** ~300 m de la place de la République. */
const NEAR = { latitude: 48.87, longitude: 2.366 };
/** ~5 km : dans la zone de recherche, hors de la zone visible. */
const FARTHER = { latitude: 48.83, longitude: 2.4 };
const LYON = { latitude: 45.764, longitude: 4.8357 };

describe('vision', () => {
  let world: TestWorld;
  let db: MemoryDb;
  let ana: Client;

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
  const setPlus = (id: string, on: boolean): void => {
    const p = db.profiles.get(id);
    if (!p) throw new Error('profil absent');
    db.profiles.set(id, { ...p, plusUntil: on ? new Date(world.clock.now().getTime() + 30 * 86_400_000).toISOString() : null });
  };

  /** Minimoa en forme (sinon, après quelques jours sans soins, il boude et ne présente personne). */
  const cheerUp = (id: string): void => {
    for (const [key, pet] of db.pets) {
      if (pet.ownerId !== id) continue;
      const full = Object.fromEntries(Object.keys(pet.needs).map((k) => [k, 100])) as typeof pet.needs;
      db.pets.set(key, { ...pet, needs: full, needsAt: world.clock.now().toISOString() });
    }
  };

  it('le test est public : 12 situations à deux choix', async () => {
    const test = await world.anonymous.vision.test();
    expect(test.questions).toHaveLength(12);
    for (const q of test.questions) {
      expect(q.situation.length).toBeGreaterThan(5);
      expect(q.choices).toHaveLength(2);
    }
  });

  it('inscription : sexe, ce que tu cherches, qui, accords, position et test ; rien de créé si c’est incohérent', async () => {
    const c = world.client();
    const base = { displayName: 'Ana', gender: 'femme' as const, seeking: 'plus' as const };
    // « plus » sans dire qui, « qui » sans accord, « qui » pour des potes, position sans accord, situation inconnue.
    expect((await apiError(c.api.me.onboard(onboardBody(base)))).code).toBe('invalid');
    expect((await apiError(c.api.me.onboard(onboardBody({ ...base, whom: 'hommes' })))).message).toContain('accord');
    expect(await errorCode(c.api.me.onboard(onboardBody({ displayName: 'Ana', whom: 'hommes', consents: { sensitive: true, location: true } })))).toBe('invalid');
    expect(await errorCode(c.api.me.onboard(onboardBody({ displayName: 'Ana', consents: { sensitive: false, location: false } })))).toBe('invalid');
    expect(await errorCode(c.api.me.onboard(onboardBody({ displayName: 'Ana', visionAnswers: [{ questionId: 'astrologie', choice: 0 }] })))).toBe('invalid');
    expect(await errorCode(c.api.me.onboard(onboardBody({ ...base, whom: 'hommes', birthdate: '2010-01-01', consents: { sensitive: true, location: true } })))).toBe('too_young');
    expect(await errorCode(c.api.me.get())).toBe('not_onboarded');

    const me = await c.api.me.onboard(onboardBody({ ...base, whom: 'hommes', locale: 'fr', consents: { sensitive: true, location: true } }));
    expect(me.identity).toMatchObject({ gender: 'femme', seeking: 'plus', whom: 'hommes', locale: 'fr', discreet: false });
    expect(me.identity.sensitiveConsentAt).toBe(world.clock.now().toISOString());
    expect(me.identity.location.consentAt).not.toBeNull();
    // Zone du domicile : arrondie, jamais la position exacte.
    const zone = me.identity.location.zone;
    expect(zone?.radiusKm).toBe(ZONE_RADIUS_KM);
    expect(zone?.center).not.toEqual(PARIS);
    expect(distanceKm({ lat: zone?.center.latitude ?? 0, lng: zone?.center.longitude ?? 0 }, { lat: PARIS.latitude, lng: PARIS.longitude })).toBeLessThan(0.25);
    expect(me).not.toHaveProperty('city');
    ana = c;
  });

  it('ta vision, pour l’instant : 5 axes, confiance, formulation ; le test repassé la change', async () => {
    const v = await ana.api.vision.mine();
    expect(v.testDone).toBe(true);
    expect(v.note).toBe('Indicatif. Il s’affine avec toi.');
    expect(v.axes.map((a) => a.axis)).toEqual(['foyer', 'ancrage', 'elan', 'rythme', 'cap']);
    const foyer = v.axes.find((a) => a.axis === 'foyer');
    expect(foyer?.value).toBeGreaterThan(20);
    expect(foyer?.confidence).toBeGreaterThan(0);
    expect(foyer?.line).toMatch(/^Plutôt|^Entre/);

    const other = await ana.api.vision.retakeTest(visionAnswers(1));
    expect(other.axes.find((a) => a.axis === 'foyer')?.value).toBeLessThan(-20);
    expect(await errorCode(ana.api.vision.retakeTest([{ questionId: 'nope', choice: 0 }]))).toBe('invalid');
    await ana.api.vision.retakeTest(visionAnswers(0));
  });

  it('rencontres : seulement les compatibles (filtres durs et seuil), expliquées, sans révéler « qui »', async () => {
    const ben = await person('Ben', { gender: 'homme', seeking: 'les_deux', whom: 'femmes', consents: { sensitive: true, location: true }, location: NEAR });
    // Cherche la même chose, juste à côté, mais vision opposée : sous le seuil.
    const cleo = await person('Cléo', { gender: 'homme', seeking: 'plus', whom: 'femmes', consents: { sensitive: true, location: true }, visionAnswers: visionAnswers(1), location: NEAR });
    // Même vision, mais à Lyon : hors zone.
    const dan = await person('Dan', { gender: 'homme', seeking: 'plus', whom: 'femmes', consents: { sensitive: true, location: true }, location: LYON });
    // Même vision, ne cherche que « plus » avec des hommes : Ana (femme) n'entre pas dans ses critères.
    const eli = await person('Éli', { gender: 'homme', seeking: 'plus', whom: 'hommes', consents: { sensitive: true, location: true }, location: NEAR });
    // Pas de position : pas de rencontres proches.
    const fay = await person('Fay', { location: undefined, consents: { sensitive: false, location: false } });

    const { suggestions } = await ana.api.encounters.list();
    const ids = suggestions.map((s) => s.user.id);
    expect(ids).toContain(ben.id);
    for (const absent of [cleo.id, dan.id, eli.id, fay.id]) expect(ids).not.toContain(absent);
    const benSuggestion = suggestions.find((s) => s.user.id === ben.id);
    expect(benSuggestion?.via).toBe('nearby');
    expect(benSuggestion?.compatibility).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    expect(benSuggestion?.explanation.common).toHaveLength(3);
    expect(benSuggestion?.explanation.explore.text).toContain('À explorer');
    expect(benSuggestion?.intro).toContain('Ben'.slice(0, 0) + (benSuggestion?.explanation.common[0]?.text ?? '-'));
    for (const s of suggestions) expect(s.compatibility).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    // Rien de « qui tu veux rencontrer » ni de ce que l'autre cherche dans ce que l'on voit des autres.
    const json = JSON.stringify(suggestions);
    expect(json).not.toContain('whom');
    expect(json).not.toContain('seeking');
    expect(json).not.toContain('identity');

    // Sans position : personne de proche, et la carte le dit.
    expect((await fay.api.encounters.list()).suggestions.filter((s) => s.via === 'nearby')).toHaveLength(0);
    const fayMap = await fay.api.vision.map();
    expect(fayMap).toMatchObject({ status: 'no_location', pins: [] });
    expect(fayMap.message).toContain('Sans ta position');

    // Saluer quelqu'un qui ne cherche pas ce que tu cherches : introuvable.
    expect(await errorCode(ana.api.encounters.wave(eli.id))).toBe('not_found');

    // Bloquer retire tout de suite (le cache du jour n'y change rien).
    await ana.api.safety.block(ben.id);
    expect((await ana.api.encounters.list()).suggestions.map((s) => s.user.id)).not.toContain(ben.id);
    await ana.api.safety.unblock(ben.id);
  });

  it('les suggestions sont gardées un jour ; un changement de ta part les recalcule', async () => {
    const before = (await ana.api.encounters.list()).suggestions.map((s) => s.user.id);
    const gus = await person('Gus', { gender: 'homme', seeking: 'plus', whom: 'femmes', consents: { sensitive: true, location: true }, location: NEAR });
    expect((await ana.api.encounters.list()).suggestions.map((s) => s.user.id)).toEqual(before);
    world.clock.advanceDays(1);
    cheerUp(ana.id);
    expect((await ana.api.encounters.list()).suggestions.map((s) => s.user.id)).toContain(gus.id);
    // Retirer l'accord : « qui » est effacé et on repasse à « potes » ; « plus » sans accord est refusé.
    const me = await ana.api.me.update({ sensitiveConsent: false });
    expect(me.identity).toMatchObject({ seeking: 'potes', whom: null, sensitiveConsentAt: null });
    expect(await errorCode(ana.api.me.update({ seeking: 'plus' }))).toBe('invalid');
    // Ana cherche désormais des potes ou plus (avec des hommes) : les « potes » de la suite la rencontrent en potes.
    await ana.api.me.update({ seeking: 'les_deux', whom: 'hommes', sensitiveConsent: true });
  });

  it('carte gratuite : sa zone seulement, positions arrondies, silhouettes floues au-delà, mode discret respecté', async () => {
    const near = await person('Hugo', { gender: 'homme', location: NEAR });
    const far = await person('Ivan', { gender: 'homme', location: FARTHER });
    const hidden = await person('Jo', { gender: 'homme', location: NEAR });
    await hidden.api.me.update({ discreet: true });
    world.clock.advanceDays(1);

    const map = await ana.api.vision.map();
    expect(map).toMatchObject({ status: 'ok', scope: 'zone', radiusKm: ZONE_RADIUS_KM, canChangeCity: false, discreet: false });
    const pinIds = map.pins.map((p) => p.user.id);
    expect(pinIds).toContain(near.id);
    expect(pinIds).not.toContain(far.id);
    expect(pinIds).not.toContain(hidden.id);
    const pin = map.pins.find((p) => p.user.id === near.id);
    expect(pin?.position).not.toEqual(NEAR);
    expect(distanceKm({ lat: pin?.position.latitude ?? 0, lng: pin?.position.longitude ?? 0 }, { lat: NEAR.latitude, lng: NEAR.longitude })).toBeLessThan(0.4);
    expect(pin?.explanation.common).toHaveLength(3);
    expect(pin?.user.avatarUrl).toBeNull();
    expect(map.beyond.count).toBeGreaterThanOrEqual(1);
    expect(map.beyond.label).toMatch(/minimoas? plus loin/);
    expect(map.beyond.blurred.length).toBeGreaterThanOrEqual(1);
    // Personne en mode discret : ni épinglée, ni comptée, ni floutée.
    expect(JSON.stringify(map)).not.toContain(hidden.id);
    // Positions jamais en temps réel : un nouveau relevé dans sa zone ne déplace pas Hugo.
    await near.api.vision.locate({ latitude: NEAR.latitude + 0.002, longitude: NEAR.longitude });
    const again = (await ana.api.vision.map()).pins.find((p) => p.user.id === near.id);
    expect(again?.position).toEqual(pin?.position);

    // Regarder ailleurs ou changer de ville : Blowy+.
    expect(await errorCode(ana.api.vision.map({ lat: LYON.latitude, lng: LYON.longitude }))).toBe('forbidden');
    expect(await errorCode(ana.api.vision.chooseCity({ label: 'Lyon', ...LYON }))).toBe('forbidden');
    // Jo, en mode discret, voit la carte et le sait.
    expect((await hidden.api.vision.map()).discreet).toBe(true);
  });

  it('carte Blowy+ : toute la carte, ailleurs, et changer de ville déplace les rencontres', async () => {
    setPlus(ana.id, true);
    const map = await ana.api.vision.map();
    expect(map.scope).toBe('everywhere');
    expect(map.canChangeCity).toBe(true);
    expect(map.radiusKm).toBeGreaterThan(ZONE_RADIUS_KM);
    expect(map.beyond.count).toBe(0);
    const names = map.pins.map((p) => p.user.displayName);
    expect(names).toEqual(expect.arrayContaining(['Hugo', 'Ivan']));
    expect(names).not.toContain('Jo');

    const lyonMap = await ana.api.vision.map({ lat: LYON.latitude, lng: LYON.longitude, radiusKm: 5 });
    expect(lyonMap.pins.map((p) => p.user.displayName)).toContain('Dan');

    cheerUp(ana.id);
    const status = await ana.api.vision.chooseCity({ label: 'Lyon', ...LYON });
    expect(status).toMatchObject({ chosenCity: { label: 'Lyon' }, chosenCityActive: true });
    const inLyon = (await ana.api.encounters.list()).suggestions.map((s) => s.user.displayName);
    expect(inLyon).toContain('Dan');
    expect(inLyon).not.toContain('Hugo');
    // Sa zone, elle, n'a pas bougé (ce que voient les autres).
    expect((await ana.api.me.get()).identity.location.zone?.center.latitude).toBeGreaterThan(48);

    // Fin de l'abonnement : la ville choisie ne sert plus de centre.
    setPlus(ana.id, false);
    expect((await ana.api.me.get()).identity.location.chosenCityActive).toBe(false);
    expect((await ana.api.encounters.list()).suggestions.map((s) => s.user.displayName)).toContain('Hugo');
    setPlus(ana.id, true);
    await ana.api.vision.clearCity();
    setPlus(ana.id, false);
  });

  it('position : accord exigé, oubli possible, zone stable lors d’une sortie', async () => {
    const kim = await person('Kim', { location: undefined, consents: { sensitive: false, location: false } });
    expect(await errorCode(kim.api.vision.locate(PARIS))).toBe('forbidden');
    const first = await kim.api.vision.locate(PARIS, true);
    expect(first.consentAt).not.toBeNull();
    const zone = first.zone;
    // Une sortie à Lyon ne déplace pas la zone.
    expect((await kim.api.vision.locate(LYON)).zone).toEqual(zone);
    const forgotten = await kim.api.vision.forgetLocation();
    expect(forgotten).toMatchObject({ consentAt: null, zone: null });
    expect((await kim.api.vision.map()).status).toBe('no_location');
  });
});
