import { describe, expect, it } from 'vitest';
import { paths, resolveIncomingUrl } from './paths';

const U = '0f8fad5b-d9cb-469f-a165-70867728950e';
describe('liens entrants V5', () => {
  it('invitation personnelle (universel et schéma)', () => {
    expect(resolveIncomingUrl('https://blowy.app/i/r8Tz4w')).toBe('/invite/r8Tz4w');
    expect(resolveIncomingUrl('https://blowy.app/team/ALEX42')).toBe('/invite/ALEX42');
    expect(resolveIncomingUrl('blowy://invite/ALEX42')).toBe('/invite/ALEX42');
  });
  it('conversation et sortie', () => {
    expect(resolveIncomingUrl(`blowy://c/${U}`)).toBe(`/chat/${U}`);
    expect(resolveIncomingUrl(`https://blowy.app/o/${U}`)).toBe(`/outing/${U}`);
  });
  it('inconnu / malformé → accueil ; code invalide → racine', () => {
    expect(resolveIncomingUrl('https://blowy.app/<script>')).toBe(paths.home);
    expect(resolveIncomingUrl('pas une url')).toBe(paths.home);
    expect(resolveIncomingUrl('https://blowy.app/invite/%%%')).toBe(paths.root);
    expect(resolveIncomingUrl('blowy://c/not-a-uuid')).toBe(paths.chats);
    expect(resolveIncomingUrl('blowy://o/not-a-uuid')).toBe(paths.home);
  });
  it('chemins encodés', () => {
    expect(paths.outingStep('a/b', 'pay')).toBe('/outing/a%2Fb/pay');
    expect(paths.share('soiree')).toBe('/share/soiree');
  });
});
