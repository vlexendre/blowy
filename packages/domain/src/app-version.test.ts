import { describe, expect, it } from 'vitest';
import { appUpdateStatus, parseBuildNumber } from './app-version';

describe('versions de l’app', () => {
  const policy = { minSupportedBuild: 10, latestBuild: 14 };

  it('sous le minimum : mise à jour obligatoire ; entre les deux : proposée ; à jour : rien', () => {
    expect(appUpdateStatus(9, policy)).toBe('required');
    expect(appUpdateStatus(10, policy)).toBe('available');
    expect(appUpdateStatus(13, policy)).toBe('available');
    expect(appUpdateStatus(14, policy)).toBe('none');
    expect(appUpdateStatus(15, policy)).toBe('none');
  });

  it('build inconnu (web, développement, ancienne version sans en-tête) : jamais bloqué', () => {
    expect(appUpdateStatus(null, policy)).toBe('none');
    expect(appUpdateStatus(0, policy)).toBe('none');
  });

  it('réglages à 0 : ni minimum ni bandeau', () => {
    expect(appUpdateStatus(1, { minSupportedBuild: 0, latestBuild: 0 })).toBe('none');
  });

  it('lit un numéro de build et refuse le reste', () => {
    expect(parseBuildNumber('42')).toBe(42);
    expect(parseBuildNumber(' 7 ')).toBe(7);
    expect(parseBuildNumber('1.0.3')).toBeNull();
    expect(parseBuildNumber('0')).toBeNull();
    expect(parseBuildNumber('')).toBeNull();
    expect(parseBuildNumber(undefined)).toBeNull();
  });
});
