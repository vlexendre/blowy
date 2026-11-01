import { describe, expect, it } from 'vitest';
import { resolveIncomingUrl } from './paths';

const U = '0f8fad5b-d9cb-469f-a165-70867728950e';
describe('liens entrants', () => {
  it('invitation universelle et schéma', () => {
    expect(resolveIncomingUrl('https://blowy.app/invite/ALEX42')).toBe('/invite/ALEX42');
    expect(resolveIncomingUrl('https://blowy.app/r/ALEX42')).toBe('/invite/ALEX42');
    expect(resolveIncomingUrl('blowy://invite/ALEX42')).toBe('/invite/ALEX42');
  });
  it('widget et notification', () => {
    expect(resolveIncomingUrl(`blowy://widget/date/${U}`)).toBe(`/nest?relationship=${U}`);
    expect(resolveIncomingUrl('blowy://widget/pet')).toBe('/nest');
    expect(resolveIncomingUrl(`blowy://c/${U}`)).toBe(`/chats/${U}`);
  });
  it('inconnu / malformé → Nid ; code invalide → accueil', () => {
    expect(resolveIncomingUrl('https://blowy.app/<script>')).toBe('/nest');
    expect(resolveIncomingUrl('pas une url')).toBe('/nest');
    expect(resolveIncomingUrl('https://blowy.app/invite/%%%')).toBe('/');
    expect(resolveIncomingUrl('blowy://c/not-a-uuid')).toBe('/chats');
  });
});
