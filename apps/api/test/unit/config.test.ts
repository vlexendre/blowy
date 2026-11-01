import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../../src/config/env.js';

const base = { DATABASE_URL: 'postgresql://x:y@db:5432/blowy', SESSION_SECRET: 's'.repeat(40) };

describe('configuration validée au démarrage', () => {
  it('local : défauts locaux sûrs', () => {
    expect(loadConfig({ BLOWY_ENV: 'local' } as NodeJS.ProcessEnv).AUTH_PROVIDER).toBe('local');
  });
  it('production refuse adaptateurs locaux et DEV_AUTH_BYPASS', () => {
    expect(() => loadConfig({ ...base, BLOWY_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(ConfigError);
    expect(() =>
      loadConfig({ ...base, BLOWY_ENV: 'production', AUTH_PROVIDER: 'firebase', FIREBASE_PROJECT_ID: 'p', MODERATION_PROVIDER: 'external', VERIFICATION_PROVIDER: 'veriff', DEV_AUTH_BYPASS: 'true' } as NodeJS.ProcessEnv),
    ).toThrow(/DEV_AUTH_BYPASS/);
    expect(() => loadConfig({ ...base, BLOWY_ENV: 'production', AUTH_PROVIDER: 'firebase', FIREBASE_PROJECT_ID: 'p', FIREBASE_AUTH_EMULATOR_HOST: 'x:9099', MODERATION_PROVIDER: 'external', VERIFICATION_PROVIDER: 'veriff' } as NodeJS.ProcessEnv)).toThrow(/émulateur/);
    const prodOk = { ...base, BLOWY_ENV: 'production', AUTH_PROVIDER: 'firebase', FIREBASE_PROJECT_ID: 'p', MODERATION_PROVIDER: 'external', VERIFICATION_PROVIDER: 'veriff', AI_PROVIDER: 'openai', STORAGE_DRIVER: 's3', MEDIA_TOKEN_SECRET: 'm'.repeat(40) };
    // Agent E : IA locale, stockage FS et secret média absent refusés en production.
    expect(() => loadConfig({ ...prodOk, AI_PROVIDER: 'local' } as NodeJS.ProcessEnv)).toThrow(/AI_PROVIDER=local/);
    expect(() => loadConfig({ ...prodOk, STORAGE_DRIVER: 'fs' } as NodeJS.ProcessEnv)).toThrow(/STORAGE_DRIVER=fs/);
    expect(() => loadConfig({ ...prodOk, MEDIA_TOKEN_SECRET: '' } as NodeJS.ProcessEnv)).toThrow(/MEDIA_TOKEN_SECRET/);
    const ok = loadConfig(prodOk as NodeJS.ProcessEnv);
    expect(ok.isProduction).toBe(true);
  });
  it('production n’a aucune valeur par défaut de secret', () => {
    expect(() => loadConfig({ BLOWY_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL|SESSION_SECRET/);
  });
});
