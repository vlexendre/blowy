/**
 * Versions de l'app (docs/VERSIONING.md) : l'app envoie version, build et plateforme ; sous le build minimum, l'API
 * répond 426 `app_update_required` (sauf sur les routes toujours ouvertes) ; `GET /v1/app/config` dit où on en est.
 */
import { randomUUID } from 'node:crypto';
import { type ClientInfo, createApiClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadAppVersionsEnv } from '../src/config/app-versions.env';
import { readClientApp } from '../src/shared/client-app';
import { type TestWorld, apiError, onboardBody, startWorld } from './helpers';

describe('versions de l’app', () => {
  let world: TestWorld;

  beforeAll(async () => {
    world = await startWorld({ APP_IOS_MIN_SUPPORTED_BUILD: '10', APP_IOS_LATEST_BUILD: '14' });
  });
  afterAll(() => world.close());

  const as = (info: ClientInfo | null, locale?: string) => {
    const token = `test:${randomUUID()}`;
    return createApiClient({ baseUrl: world.baseUrl, getToken: () => token, getClientInfo: () => info, ...(locale ? { getLocale: () => locale } : {}) });
  };

  it('donne les réglages de la plateforme de l’appelant', async () => {
    expect(await as({ platform: 'ios', build: 12, version: '1.1.0' }).app.config()).toEqual({
      platform: 'ios',
      minSupportedBuild: 10,
      latestBuild: 14,
      storeUrl: 'https://apps.apple.com/fr/app/minimoa/id6833895780',
    });
    // Le site (pas de plateforme) : rien à proposer.
    expect(await world.anonymous.app.config()).toEqual({ platform: null, minSupportedBuild: 0, latestBuild: 0, storeUrl: null });
  });

  it('un build à jour ou entre le minimum et le dernier est servi normalement', async () => {
    await expect(as({ platform: 'ios', build: 10 }).me.onboard(onboardBody())).resolves.toMatchObject({ displayName: 'Camille' });
    await expect(as({ platform: 'ios', build: 20 }).me.onboard(onboardBody())).resolves.toMatchObject({ displayName: 'Camille' });
  });

  it('un build sous le minimum reçoit 426 app_update_required, dans sa langue', async () => {
    const old = as({ platform: 'ios', build: 9, version: '1.0.0' }, 'en');
    expect(await apiError(old.me.get())).toEqual({ code: 'app_update_required', message: 'This version of Minimoa is no longer supported. Update the app to keep going.' });
    const res = await fetch(`${world.baseUrl}/v1/me`, { headers: { 'x-app-platform': 'ios', 'x-app-build': '9' } });
    expect(res.status).toBe(426);
  });

  it('les réglages des versions et la santé restent ouverts à un build trop ancien', async () => {
    const old = as({ platform: 'ios', build: 3 });
    await expect(old.app.config()).resolves.toMatchObject({ minSupportedBuild: 10 });
    const health = await fetch(`${world.baseUrl}/health`, { headers: { 'x-app-platform': 'ios', 'x-app-build': '3' } });
    expect(health.status).toBe(200);
  });

  it('supprimer son compte reste possible depuis un build trop ancien', async () => {
    const id = randomUUID();
    const token = `test:${id}`;
    await createApiClient({ baseUrl: world.baseUrl, getToken: () => token }).me.onboard(onboardBody());
    const old = createApiClient({ baseUrl: world.baseUrl, getToken: () => token, getClientInfo: () => ({ platform: 'ios', build: 2 }) });
    await expect(old.me.remove()).resolves.toEqual({ ok: true });
  });

  it('sans plateforme d’app (site, administration) ou sans build connu : jamais bloqué', async () => {
    await expect(as(null).me.onboard(onboardBody())).resolves.toBeTruthy();
    await expect(as({ platform: 'web', version: '1.0.0' }).me.onboard(onboardBody())).resolves.toBeTruthy();
    await expect(as({ platform: 'ios' }).me.onboard(onboardBody())).resolves.toBeTruthy();
  });

  it('un ancien build sans en-têtes est reconnu à l’agent utilisateur d’iOS', async () => {
    const res = await fetch(`${world.baseUrl}/v1/me`, { headers: { 'user-agent': 'Minimoa/7 CFNetwork/1568.100.1 Darwin/24.0.0' } });
    expect(res.status).toBe(426);
    expect(readClientApp({ headers: { 'user-agent': 'Minimoa/7 CFNetwork/1568.100.1 Darwin/24.0.0' } })).toEqual({ platform: 'ios', version: null, build: 7, source: 'user-agent' });
    // Les en-têtes l'emportent (Expo Go, simulateur : l'agent utilisateur est celui d'une autre app).
    expect(readClientApp({ headers: { 'user-agent': 'Expo/2 CFNetwork/1 Darwin/1', 'x-app-platform': 'ios' } })).toMatchObject({ build: null, source: 'headers' });
  });

  it('refuse un minimum au-dessus du dernier build publié', () => {
    expect(() => loadAppVersionsEnv({ APP_IOS_MIN_SUPPORTED_BUILD: '15', APP_IOS_LATEST_BUILD: '14' })).toThrow(/dépasse/);
    expect(loadAppVersionsEnv({}).ios).toEqual({ minSupportedBuild: 0, latestBuild: 0, storeUrl: 'https://apps.apple.com/fr/app/minimoa/id6833895780', cheminBuild: 999_999_999 });
  });
});
