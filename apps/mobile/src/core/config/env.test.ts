import { describe, expect, it } from 'vitest';
import { localAuthEnabled, readEnv } from './env';

describe('env', () => {
  it('défauts locaux, clés vides = absentes', () => {
    const e = readEnv({ EXPO_PUBLIC_REVENUECAT_IOS_KEY: '' });
    expect(e.blowyEnv).toBe('local');
    expect(e.revenueCatIosKey).toBeUndefined();
  });
  it('URL invalide refusée au démarrage', () => {
    expect(() => readEnv({ EXPO_PUBLIC_API_URL: 'pas-une-url' })).toThrow();
  });
  it('connexion locale jamais en production', () => {
    expect(localAuthEnabled({ blowyEnv: 'local', authMode: 'local' })).toBe(true);
    expect(localAuthEnabled({ blowyEnv: 'production', authMode: 'local' })).toBe(false);
    expect(localAuthEnabled({ blowyEnv: 'local', authMode: 'firebase' })).toBe(false);
  });
});
