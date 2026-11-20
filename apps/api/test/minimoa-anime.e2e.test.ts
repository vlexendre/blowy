/**
 * Minimoa animé (docs/MOTION.md, « Minimoa animé ») : la séance dit à l'app quel personnage Masko jouer selon
 * l'espèce du minimoa (Nino par défaut, sans réglage) ; les autres espèces reçoivent null ; tout se coupe ou se règle
 * par l'environnement, sans nouvelle version de l'app.
 */
import { randomUUID } from 'node:crypto';
import { createApiClient } from '@blowy/api-client';
import { CheminSessionResponseZ } from '@blowy/contract';
import type { Species } from '@blowy/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_MASKO_APP_KEY, DEFAULT_MASKO_URLS, loadMascotsEnv } from '../src/config/mascots.env';
import { type TestWorld, onboardBody, startWorld } from './helpers';

const NINO = {
  provider: 'masko',
  url: 'https://api.masko.ai/v1/canvases/b273f425-5fd3-49cf-9ac0-36c4944af31a/delivery',
  appKey: DEFAULT_MASKO_APP_KEY,
  events: { happy: 'action::happy', think: 'action::think', cheer: 'action::cheer' },
};

describe('Minimoa animé', () => {
  const worlds: TestWorld[] = [];
  const start = async (env: Record<string, string> = {}) => {
    const w = await startWorld(env);
    worlds.push(w);
    return w;
  };
  const person = async (w: TestWorld, species: Species) => {
    const id = randomUUID();
    const api = createApiClient({ baseUrl: w.baseUrl, getToken: () => `test:${id}`, getClientInfo: () => ({ platform: 'ios', build: 60 }) });
    await api.me.onboard(onboardBody({ pet: { name: 'Momo', species } }));
    return api;
  };
  let w: TestWorld;
  beforeAll(async () => {
    w = await start();
  });
  afterAll(async () => {
    for (const x of worlds) await x.close();
  });

  it('Nino : le personnage Masko par défaut, sans réglage', async () => {
    const res = await (await person(w, 'nino')).chemin.session();
    expect(res.mascot).toEqual(NINO);
    expect(DEFAULT_MASKO_URLS.nino).toBe(NINO.url);
  });

  it('les autres espèces : null (image habituelle)', async () => {
    for (const species of ['suzie', 'gaston', 'pia'] as const) expect((await (await person(w, species)).chemin.session()).mascot).toBeNull();
  });

  it('même quand il n’y a plus de séance aujourd’hui', async () => {
    const api = await person(w, 'nino');
    const s = (await api.chemin.session()).session!;
    await api.chemin.answer({ sessionId: s.id, answers: s.questions.map((q) => (q.format === 'slider' ? { questionId: q.id, value: 50 } : { questionId: q.id, optionId: q.options[0]!.id })) });
    const after = await api.chemin.session();
    expect(after.session).toBeNull();
    expect(after.mascot).toEqual(NINO);
  });

  it('réglable par espèce et coupable d’un coup', async () => {
    const tuned = await start({ MASKO_PIA_URL: 'https://api.masko.ai/v1/canvases/pia/delivery', MASKO_NINO_URL: 'off' });
    expect((await (await person(tuned, 'pia')).chemin.session()).mascot).toMatchObject({ provider: 'masko', url: 'https://api.masko.ai/v1/canvases/pia/delivery' });
    expect((await (await person(tuned, 'nino')).chemin.session()).mascot).toBeNull();
    const off = await start({ MASKO_ENABLED: '0' });
    expect((await (await person(off, 'nino')).chemin.session()).mascot).toBeNull();
  });

  it('réglages refusés : pas d’adresse en clair, pas de clé de compte', () => {
    expect(() => loadMascotsEnv({ MASKO_NINO_URL: 'http://api.masko.ai/x' })).toThrow(/MASKO_NINO_URL/);
    expect(() => loadMascotsEnv({ MASKO_APP_KEY: 'masko_sk_secret' })).toThrow(/MASKO_APP_KEY/);
  });

  it('contrat : champ facultatif, une ancienne réponse sans lui reste lisible', () => {
    const old = { session: null, quota: { free: 1, bonus: 0, used: 1, left: 0, nextSlot: null, bonusReason: null, bonusHint: null }, reason: 'quota_used', message: 'À demain' };
    expect(CheminSessionResponseZ.safeParse(old).success).toBe(true);
    expect(CheminSessionResponseZ.safeParse({ ...old, mascot: null }).success).toBe(true);
    expect(CheminSessionResponseZ.safeParse({ ...old, mascot: NINO }).success).toBe(true);
  });
});
