/**
 * Une app installée a des semaines de retard sur l'API : quand l'API ajoute une valeur (nouvel objet, nouveau type
 * d'événement…), l'app doit continuer de marcher (docs/VERSIONING.md).
 */
import { MeZ, PetViewZ, WardrobeZ } from '@blowy/contract';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, createApiClient } from './index';
import { parseTolerant } from './tolerant';

const pet = {
  pet: {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Nino',
    species: 'nino',
    gauges: { social: 0, play: 0, tender: 0, talk: 0 },
    form: 'equilibre',
    traits: [],
    needs: { sociability: 50, hunger: 50, energy: 50, mood: 50 },
    wellbeing: 50,
    shape: 'en_forme',
    outfit: { head: 'bob' },
    bornAt: '2026-11-01T10:00:00.000Z',
  },
  events: [],
  wordsCount: 0,
  careDays: 1,
  newItems: [],
  rename: { allowed: true, availableOn: null, unlimited: false },
};

describe('réponses d’une API plus récente que l’app', () => {
  it('sans tolérance, un nouvel objet fait échouer toute la réponse (ce que font les builds publiés avant)', () => {
    const shape = PetViewZ.shape.pet.shape.shape.safeParse(pet.pet.shape);
    expect(shape.success).toBe(true);
    const future = { ...pet, newItems: ['bob', 'objet_de_demain'] };
    expect(PetViewZ.safeParse(future).success).toBe(false);
  });

  it('un élément de liste inconnu est retiré, le reste est lu', () => {
    const future = { ...pet, newItems: ['bob', 'objet_de_demain'] };
    const { data, tolerated } = parseTolerant(PetViewZ, future);
    expect(data.newItems).toEqual(['bob']);
    expect(tolerated?.removed).toEqual(['newItems.1']);
  });

  it('un objet porté inconnu (champ facultatif) est retiré de la tenue', () => {
    const future = { ...pet, pet: { ...pet.pet, outfit: { head: 'bob', toy: 'objet_de_demain' } } };
    const { data } = parseTolerant(PetViewZ, future);
    expect(data.pet.outfit).toEqual({ head: 'bob' });
  });

  it('dans la garde-robe, l’objet inconnu disparaît ; une étape inconnue (champ qui peut être null) devient null', () => {
    const wardrobe = {
      items: [
        { id: 'bob', slot: 'head', state: 'owned', goal: null },
        { id: 'objet_de_demain', slot: 'head', state: 'owned', goal: null },
        { id: 'noeud', slot: 'head', state: 'locked', goal: { stat: 'nouvelle_etape', have: 1, need: 3 } },
      ],
      outfit: {},
      collection: null,
    };
    const { data } = parseTolerant(WardrobeZ, wardrobe);
    expect(data.items.map((i) => i.id)).toEqual(['bob', 'noeud']);
    expect(data.items[1]?.goal).toBeNull();
  });

  it('une valeur inconnue dans un champ obligatoire reste une erreur (changement cassant)', () => {
    const future = { ...pet, pet: { ...pet.pet, species: 'espece_de_demain' } };
    expect(() => parseTolerant(PetViewZ, future)).toThrow();
  });

  it('un champ manquant reste une erreur (jamais « réparé »)', () => {
    const { wordsCount: _gone, ...broken } = pet;
    expect(() => parseTolerant(PetViewZ, broken)).toThrow();
  });

  it('tableau indexé par un enum : une clé nouvelle est retirée', () => {
    const S = z.object({ counts: z.record(z.enum(['a', 'b']), z.number()) });
    const { data } = parseTolerant(S, { counts: { a: 1, b: 2, c: 3 } });
    expect(data.counts).toEqual({ a: 1, b: 2 });
  });

  it('union discriminée : une variante inconnue dans une liste est retirée', () => {
    const S = z.object({ list: z.array(z.discriminatedUnion('kind', [z.object({ kind: z.literal('a') }), z.object({ kind: z.literal('b') })])) });
    const { data } = parseTolerant(S, { list: [{ kind: 'a' }, { kind: 'z' }, { kind: 'b' }] });
    expect(data.list).toEqual([{ kind: 'a' }, { kind: 'b' }]);
  });

  it('un champ ajouté par l’API est ignoré (objets non stricts)', () => {
    expect(MeZ.shape.id.safeParse('00000000-0000-4000-8000-000000000001').success).toBe(true);
    const { data } = parseTolerant(PetViewZ, { ...pet, champDeDemain: 1 });
    expect(data).not.toHaveProperty('champDeDemain');
  });
});

describe('client', () => {
  const respond = (status: number, body: unknown) =>
    vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

  it('envoie version, build et plateforme sur chaque requête', async () => {
    const fetch = respond(200, { platform: 'ios', minSupportedBuild: 0, latestBuild: 0, storeUrl: null });
    const api = createApiClient({ baseUrl: 'http://api', fetch, getClientInfo: () => ({ version: '1.2.0', build: 42, platform: 'ios' }) });
    await api.app.config();
    const headers = fetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers).toMatchObject({ 'x-app-version': '1.2.0', 'x-app-build': '42', 'x-app-platform': 'ios' });
  });

  it('426 : prévient l’app et lève `app_update_required`', async () => {
    const onUpdateRequired = vi.fn();
    const api = createApiClient({ baseUrl: 'http://api', fetch: respond(426, { error: { code: 'app_update_required', message: 'Mets à jour.' } }), onUpdateRequired });
    await expect(api.pet.get()).rejects.toMatchObject({ code: 'app_update_required', status: 426 });
    expect(onUpdateRequired).toHaveBeenCalledOnce();
  });

  it('un code d’erreur inconnu de cette version garde le message de l’API', async () => {
    const api = createApiClient({ baseUrl: 'http://api', fetch: respond(409, { error: { code: 'code_de_demain', message: 'Explication.' } }) });
    const err = await api.pet.get().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ code: 'internal', message: 'Explication.', status: 409 });
  });

  it('une réponse illisible devient une erreur `internal` de l’API (avant : une exception de Zod, écran de lancement bloqué)', async () => {
    const api = createApiClient({ baseUrl: 'http://api', fetch: respond(200, { ...pet, pet: { ...pet.pet, species: 'espece_de_demain' } }) });
    const err = await api.pet.get().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ code: 'internal', status: 200 });
  });

  it('signale ce qui a été retiré', async () => {
    const onTolerated = vi.fn();
    const api = createApiClient({ baseUrl: 'http://api', fetch: respond(200, { ...pet, newItems: ['objet_de_demain'] }), onTolerated });
    const view = await api.pet.get();
    expect(view.newItems).toEqual([]);
    expect(onTolerated).toHaveBeenCalledWith('GET /v1/pet', { removed: ['newItems.0'] });
  });
});
