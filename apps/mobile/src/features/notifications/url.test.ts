import { describe, expect, it } from 'vitest';

import { pathFromPushUrl } from './url';

describe('pathFromPushUrl', () => {
  it('lien profond de l’app', () => {
    expect(pathFromPushUrl('blowy://link/0b0c3d7e-1111-4111-8111-111111111111')).toBe('/link/0b0c3d7e-1111-4111-8111-111111111111');
    expect(pathFromPushUrl('blowy://pet/garde-robe')).toBe('/pet/garde-robe');
    expect(pathFromPushUrl('blowy:///rencontres')).toBe('/rencontres');
  });
  it('lien universel du site', () => {
    expect(pathFromPushUrl('https://blowy.app/link/abc?tab=today')).toBe('/link/abc?tab=today');
  });
  it('refuse le reste', () => {
    expect(pathFromPushUrl('javascript:alert(1)')).toBeNull();
    expect(pathFromPushUrl('blowy://link/<script>')).toBeNull();
  });
});
