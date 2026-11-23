import { describe, expect, it } from 'vitest';

import { appPathFromUrl, attributionFromUrl, needsAccount, pathFromPushUrl, routeIncomingUrl } from './url';

const ID = '0b0c3d7e-1111-4111-8111-111111111111';

describe('pathFromPushUrl', () => {
  it('lien profond de l’app', () => {
    expect(pathFromPushUrl(`blowy://link/${ID}`)).toBe(`/link/${ID}`);
    expect(pathFromPushUrl('blowy://pet/garde-robe')).toBe('/pet/garde-robe');
    // Ancien onglet Rencontres (notification « on t'a dit bonjour ») : l'onglet Quartier.
    expect(pathFromPushUrl('blowy:///rencontres')).toBe('/quartier');
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

describe('écrans supprimés de l’app (ligue, trophées, rituels, groupes, étapes de séance) : l’accueil ou Moi, sans erreur', () => {
  it('ligue et trophées (notification de ligue de l’API) ouvrent l’accueil', () => {
    expect(pathFromPushUrl('blowy://moi/ligue')).toBe('/pet');
    expect(pathFromPushUrl('minimoa://moi/trophees')).toBe('/pet');
    expect(pathFromPushUrl('https://minimoa.app/moi/ligue/')).toBe('/pet');
  });
  it('défi, évolution, habitudes, preuve, bilans, souvenirs ouvrent l’accueil ; le caractère ouvre Moi', () => {
    for (const p of ['defi', 'evolution', 'habitudes', 'preuve', 'souvenirs', 'bilans', 'bilan/abc', `bilan/${ID}`]) {
      expect(pathFromPushUrl(`blowy://pet/${p}`)).toBe('/pet');
    }
    expect(pathFromPushUrl('blowy://pet/preuve?daily=1')).toBe('/pet?daily=1');
    expect(pathFromPushUrl('blowy://pet/caractere')).toBe('/moi');
  });
  it('groupes : un groupe, sa création, son lien d’invitation ouvrent l’accueil', () => {
    expect(pathFromPushUrl(`blowy://groupe/${ID}`)).toBe('/pet');
    expect(pathFromPushUrl('blowy://groupe/nouveau')).toBe('/pet');
    expect(pathFromPushUrl('blowy://g/K7P2XQ9M')).toBe('/pet');
    expect(pathFromPushUrl(`https://minimoa.app/g/${ID}`)).toBe('/pet');
  });
  it('anciennes étapes de séance : la fin de séance, ou l’accueil pour le parcours', () => {
    expect(pathFromPushUrl('blowy://chemin/bravo?id=abc')).toBe('/chemin/fin?id=abc');
    expect(pathFromPushUrl('blowy://chemin/palier')).toBe('/chemin/fin');
    expect(pathFromPushUrl('blowy://chemin/parcours')).toBe('/pet');
  });
  it('les niveaux d’un lien : l’onglet « Le lien »', () => {
    expect(pathFromPushUrl(`blowy://link/${ID}/niveaux`)).toBe(`/link/${ID}?tab=lien`);
    expect(pathFromPushUrl(`blowy://link/${ID}/niveaux?from=push`)).toBe(`/link/${ID}?tab=lien&from=push`);
  });
  it('anciens onglets Carte et Rencontres : l’onglet Quartier', () => {
    expect(pathFromPushUrl('blowy://carte')).toBe('/quartier');
    expect(pathFromPushUrl('blowy://rencontres')).toBe('/quartier');
  });
  it('les écrans gardés restent tels quels', () => {
    expect(pathFromPushUrl('blowy://pet/serie')).toBe('/pet/serie');
    expect(pathFromPushUrl('blowy://pet/garde-robe')).toBe('/pet/garde-robe');
  });
});

describe('appPathFromUrl : adresses courtes, deux schémas, deux domaines', () => {
  const cases: [string, string][] = [
    ['i/abcd1234', '/i/ABCD1234'],
    ['m/k3Xy_9', '/m/k3Xy_9'],
    [`g/${ID}`, '/pet'],
    ['g/k7p2xq9m', '/pet'],
    ['c/lea', '/'],
    ['mots', '/mots'],
    [`r/${ID}`, `/rencontre/${ID}`],
    [`l/${ID}`, `/link/${ID}`],
    ['plus', '/moi/blowy-plus'],
    ['defi', '/pet'],
    ['habitudes', '/pet'],
    ['carte', '/quartier'],
    ['rencontres', '/quartier'],
    ['quartier', '/quartier'],
    ['chemin', '/pet?chemin=1'],
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
    expect(appPathFromUrl('HTTPS://MINIMOA.APP/defi')).toBe('/pet');
  });
  it('les chemins internes passent tels quels', () => {
    expect(appPathFromUrl('minimoa://pet')).toBe('/pet');
    expect(appPathFromUrl('minimoa://auth-callback')).toBe('/auth-callback');
  });
});

describe('needsAccount', () => {
  it('écrans qui demandent un compte prêt', () => {
    for (const p of [`/rencontre/${ID}`, `/link/${ID}`, '/moi/blowy-plus', '/quartier', '/pet', '/chemin/fin']) {
      expect(needsAccount(p)).toBe(true);
    }
  });
  it('invitation, 3 mots, retour de connexion : non', () => {
    for (const p of ['/i/ABCD', '/m/abc', '/auth-callback?code=x', '/', '/welcome', '/personnes']) expect(needsAccount(p)).toBe(false);
  });
});

describe('routeIncomingUrl', () => {
  it('compte prêt, app ouverte : tout de suite', () => {
    expect(routeIncomingUrl(`https://minimoa.app/r/${ID}`, { initial: false, ready: true })).toEqual({ open: `/rencontre/${ID}`, park: null });
    // Ancien lien d'un groupe (supprimé de l'app) : l'accueil.
    expect(routeIncomingUrl(`https://minimoa.app/g/${ID}`, { initial: false, ready: true })).toEqual({ open: '/pet', park: null });
  });
  it('démarrage à froid : par l’aiguillage, chemin gardé', () => {
    expect(routeIncomingUrl('https://minimoa.app/defi', { initial: true, ready: false })).toEqual({ open: '/', park: '/pet' });
  });
  it('inscription en cours : on reste sur place, chemin gardé', () => {
    expect(routeIncomingUrl('minimoa://carte', { initial: false, ready: false })).toEqual({ open: '', park: '/quartier' });
    // Rappel du matin de Ton chemin : attend la fin du démarrage, puis l'accueil sur la séance.
    expect(routeIncomingUrl('blowy://chemin', { initial: true, ready: false })).toEqual({ open: '/', park: '/pet?chemin=1' });
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

describe('liens de croissance (docs/VIRALITE.md)', () => {
  it('lien d’un groupe (supprimé de l’app) : l’accueil, gardé jusqu’à la fin de l’inscription ; la source reste lue', () => {
    expect(needsAccount('/mots')).toBe(true);
    expect(routeIncomingUrl('https://minimoa.app/g/k7p2xq9m', { initial: false, ready: true })).toEqual({ open: '/pet', park: null });
    expect(routeIncomingUrl('https://minimoa.app/g/k7p2xq9m', { initial: true, ready: false })).toEqual({ open: '/', park: '/pet' });
  });
  it('code d’un créateur : l’accueil', () => {
    expect(routeIncomingUrl('https://minimoa.app/c/lea', { initial: true, ready: false })).toEqual({ open: '/', park: null });
  });
  it('source d’arrivée lue dans le lien, jamais ailleurs', () => {
    expect(attributionFromUrl('https://minimoa.app/c/lea')).toEqual({ source: 'creator', ref: 'LEA' });
    expect(attributionFromUrl('https://minimoa.app/m/k3Xy_9?ref=nino10')).toEqual({ source: 'creator', ref: 'NINO10' });
    expect(attributionFromUrl('minimoa://m/k3Xy_9')).toEqual({ source: 'words', ref: 'k3Xy_9' });
    expect(attributionFromUrl('https://minimoa.app/g/k7p2xq9m')).toEqual({ source: 'group', ref: 'K7P2XQ9M' });
    expect(attributionFromUrl(`https://minimoa.app/g/${ID}`)).toBeNull();
    expect(attributionFromUrl('https://minimoa.app/i/abcd1234')).toEqual({ source: 'invite', ref: 'ABCD1234' });
    expect(attributionFromUrl('https://minimoa.app/defi')).toBeNull();
    expect(attributionFromUrl('https://evil.example/c/lea')).toBeNull();
  });
  it('quiz du site et quartier : repris par l’inscription, sans compte', () => {
    expect(attributionFromUrl('minimoa://quiz/qab23cd?ref=QXY45ZZ')).toEqual({ source: 'quiz', ref: 'QAB23CD' });
    expect(attributionFromUrl('minimoa://quartier/NAB23CDE')).toEqual({ source: 'quartier', ref: 'NAB23CDE' });
    expect(appPathFromUrl('minimoa://quiz/qab23cd')).toBe('/quiz/QAB23CD');
    expect(routeIncomingUrl('minimoa://quiz/QAB23CD', { initial: true, ready: false })).toEqual({ open: '/quiz/QAB23CD', park: null });
    expect(needsAccount('/quartier/NAB23CDE')).toBe(false);
    expect(needsAccount('/quartier')).toBe(true);
  });
});
