import { describe, expect, it } from 'vitest';

import { appPathFromUrl, needsAccount, pathFromPushUrl, routeIncomingUrl } from './url';

const ID = '0b0c3d7e-1111-4111-8111-111111111111';

describe('pathFromPushUrl', () => {
  it('lien profond de l’app', () => {
    expect(pathFromPushUrl(`blowy://link/${ID}`)).toBe(`/link/${ID}`);
    expect(pathFromPushUrl('blowy://pet/garde-robe')).toBe('/pet/garde-robe');
    expect(pathFromPushUrl('blowy:///rencontres')).toBe('/rencontres');
  });
  it('groupes (spéc. §26) : un groupe, ou les habitudes pour une proposition « ensemble »', () => {
    expect(pathFromPushUrl(`blowy://groupe/${ID}`)).toBe(`/groupe/${ID}`);
    expect(pathFromPushUrl('blowy://pet/habitudes')).toBe('/pet/habitudes');
  });
  it('lien universel du site', () => {
    expect(pathFromPushUrl('https://minimoa.app/link/abc?tab=today')).toBe('/link/abc?tab=today');
    expect(pathFromPushUrl('https://blowy.app/link/abc')).toBe('/link/abc');
  });
  it('refuse le reste', () => {
    expect(pathFromPushUrl('javascript:alert(1)')).toBeNull();
    expect(pathFromPushUrl('blowy://link/<script>')).toBeNull();
    expect(pathFromPushUrl('https://evil.example/link/abc')).toBeNull();
    expect(pathFromPushUrl('otherapp://link/abc')).toBeNull();
  });
});

describe('appPathFromUrl : adresses courtes, deux schémas, deux domaines', () => {
  const cases: [string, string][] = [
    ['i/abcd1234', '/i/ABCD1234'],
    ['m/k3Xy_9', '/m/k3Xy_9'],
    [`g/${ID}`, `/groupe/${ID}`],
    [`r/${ID}`, `/rencontre/${ID}`],
    [`l/${ID}`, `/link/${ID}`],
    ['plus', '/moi/blowy-plus'],
    ['defi', '/pet/defi'],
    ['habitudes', '/pet/habitudes'],
    ['carte', '/carte'],
  ];
  const prefixes = ['https://minimoa.app/', 'https://www.minimoa.app/', 'minimoa://', 'blowy://', 'minimoa:///'];
  for (const [short, path] of cases) {
    it(short, () => {
      for (const p of prefixes) expect(appPathFromUrl(`${p}${short}`)).toBe(path);
      expect(appPathFromUrl(`https://minimoa.app/${short}/`)).toBe(path);
    });
  }
  it('garde la requête, ignore l’ancre', () => {
    expect(appPathFromUrl('https://minimoa.app/plus?from=share#x')).toBe('/moi/blowy-plus?from=share');
    expect(appPathFromUrl('HTTPS://MINIMOA.APP/defi')).toBe('/pet/defi');
  });
  it('les chemins internes passent tels quels', () => {
    expect(appPathFromUrl('minimoa://pet')).toBe('/pet');
    expect(appPathFromUrl('minimoa://auth-callback')).toBe('/auth-callback');
  });
});

describe('needsAccount', () => {
  it('écrans qui demandent un compte prêt', () => {
    for (const p of [`/groupe/${ID}`, `/rencontre/${ID}`, `/link/${ID}`, '/moi/blowy-plus', '/pet/defi', '/pet/habitudes', '/carte', '/pet']) {
      expect(needsAccount(p)).toBe(true);
    }
  });
  it('invitation, 3 mots, retour de connexion : non', () => {
    for (const p of ['/i/ABCD', '/m/abc', '/auth-callback?code=x', '/', '/welcome', '/personnes']) expect(needsAccount(p)).toBe(false);
  });
});

describe('routeIncomingUrl', () => {
  it('compte prêt, app ouverte : tout de suite', () => {
    expect(routeIncomingUrl(`https://minimoa.app/g/${ID}`, { initial: false, ready: true })).toEqual({ open: `/groupe/${ID}`, park: null });
  });
  it('démarrage à froid : par l’aiguillage, chemin gardé', () => {
    expect(routeIncomingUrl('https://minimoa.app/defi', { initial: true, ready: false })).toEqual({ open: '/', park: '/pet/defi' });
  });
  it('inscription en cours : on reste sur place, chemin gardé', () => {
    expect(routeIncomingUrl('minimoa://carte', { initial: false, ready: false })).toEqual({ open: '', park: '/carte' });
  });
  it('invitation et 3 mots : l’écran gère la session lui-même', () => {
    expect(routeIncomingUrl('https://minimoa.app/i/abcd', { initial: true, ready: false })).toEqual({ open: '/i/ABCD', park: null });
    expect(routeIncomingUrl('blowy://m/xyz', { initial: false, ready: false })).toEqual({ open: '/m/xyz', park: null });
  });
  it('autres liens (retour de connexion) : intacts', () => {
    const url = 'minimoa://auth-callback?code=a.b~c';
    expect(routeIncomingUrl(url, { initial: false, ready: false })).toEqual({ open: url, park: null });
  });
});
