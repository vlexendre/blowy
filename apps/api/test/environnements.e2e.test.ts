/**
 * Environnement `staging` (le dev déployé, docs/ENVIRONNEMENTS.md) : configuration acceptée avec les adresses du dev,
 * refusée dès qu'elle désigne la production ; liste d'envoi des e-mails ; achats du bac à sable seulement ; /health.
 */
import { HealthZ } from '@blowy/contract';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { loadEnv } from '../src/config/env';
import { AllowListMailer, ConsoleMailer } from '../src/integrations/mailer/mailer';
import { AppleBilling } from '../src/modules/billing/infrastructure/apple/app-store-verifier';
import { TEST_ROOT, signJws, transactionPayload } from './apple-jws';

const DEV = {
  BLOWY_ENV: 'staging',
  BLOWY_ADAPTERS: 'supabase',
  SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test',
  API_URL: 'https://api-dev.minimoa.app',
  WEB_URL: 'https://dev.minimoa.app',
  ADMIN_URL: 'https://admin-dev.minimoa.app',
  CORS_ORIGINS: 'https://dev.minimoa.app,https://admin-dev.minimoa.app',
  PUSH_PROVIDER: 'off',
};

describe('configuration staging', () => {
  it('accepte le dev : adresses du dev, son propre projet Supabase', () => {
    const env = loadEnv(DEV);
    expect(env.env).toBe('staging');
    expect(env.demo).toBe(false);
    expect(env.facturationAdmin.apple).toMatchObject({ appAppleId: null, acceptSandbox: true, acceptProduction: false });
    expect(env.facturationAdmin.revenueCat.appleNotificationsUrl).toBeNull();
    expect(env.audit.adminUrl).toBe('https://admin-dev.minimoa.app');
  });

  it('la production garde ses règles et accepte toujours les achats de production', () => {
    const prod = loadEnv({ ...DEV, BLOWY_ENV: 'production', API_URL: 'https://api.minimoa.app', WEB_URL: 'https://minimoa.app', ADMIN_URL: 'https://admin.minimoa.app', APPLE_APP_APPLE_ID: '6833895780' });
    expect(prod.facturationAdmin.apple.acceptProduction).toBe(true);
    expect(() => loadEnv({ ...DEV, BLOWY_ENV: 'production' })).toThrow(/APPLE_APP_APPLE_ID est requis en production/);
  });

  it('refuse un staging qui désigne la production (environnement Railway dupliqué)', () => {
    expect(() => loadEnv({ ...DEV, SUPABASE_URL: 'https://sqxebllmatfflopqddaw.supabase.co' })).toThrow(/SUPABASE_URL désigne le projet Supabase de production/);
    expect(() => loadEnv({ ...DEV, API_URL: 'https://api.minimoa.app' })).toThrow(/API_URL pointe vers la production/);
    expect(() => loadEnv({ ...DEV, WEB_URL: 'https://minimoa.app' })).toThrow(/WEB_URL pointe vers la production/);
    // WEB_URL a https://minimoa.app pour défaut : un staging qui l'oublie ne démarre pas.
    expect(() => loadEnv({ ...DEV, WEB_URL: undefined })).toThrow(/WEB_URL pointe vers la production \(à poser/);
    expect(() => loadEnv({ ...DEV, ADMIN_URL: 'https://admin.minimoa.app' })).toThrow(/ADMIN_URL pointe vers la production/);
    expect(() => loadEnv({ ...DEV, REVENUECAT_APPLE_NOTIFICATIONS_URL: 'https://api.revenuecat.com/v1/incoming-webhooks/apple-server-to-server-notification/x' })).toThrow(/REVENUECAT/);
    expect(() => loadEnv({ ...DEV, APPLE_ACCEPT_SANDBOX: '0' })).toThrow(/bac à sable/);
  });

  it('REVIEW_CODE : 10 caractères au moins en staging comme en production', () => {
    expect(() => loadEnv({ ...DEV, REVIEW_EMAIL: 'review@exemple.fr', REVIEW_CODE: '123456' })).toThrow(/10 caractères au moins en staging/);
    expect(loadEnv({ ...DEV, REVIEW_EMAIL: 'review@exemple.fr', REVIEW_CODE: '1234567890' }).audit.review).not.toBeNull();
    expect(loadEnv({ BLOWY_ENV: 'local', REVIEW_EMAIL: 'review@exemple.fr', REVIEW_CODE: '123456' }).audit.review).not.toBeNull();
  });

  it('un BLOWY_ENV inconnu est refusé', () => {
    expect(() => loadEnv({ ...DEV, BLOWY_ENV: 'preprod' })).toThrow(/BLOWY_ENV/);
  });
});

describe('MAIL_ALLOWLIST', () => {
  it('lue hors production (adresses et domaines), ignorée en production', () => {
    expect(loadEnv({ ...DEV, MAIL_ALLOWLIST: ' Equipe@Exemple.fr, @minimoa.app ' }).mailAllowList).toEqual({ emails: ['equipe@exemple.fr'], domains: ['minimoa.app'] });
    expect(loadEnv({ BLOWY_ENV: 'local', MAIL_ALLOWLIST: '@exemple.fr' }).mailAllowList).toEqual({ emails: [], domains: ['exemple.fr'] });
    expect(loadEnv(DEV).mailAllowList).toBeNull();
    const prod = { ...DEV, BLOWY_ENV: 'production', API_URL: 'https://api.minimoa.app', WEB_URL: 'https://minimoa.app', ADMIN_URL: 'https://admin.minimoa.app', APPLE_APP_APPLE_ID: '1' };
    expect(loadEnv({ ...prod, MAIL_ALLOWLIST: '@exemple.fr' }).mailAllowList).toBeNull();
    expect(() => loadEnv({ ...DEV, MAIL_ALLOWLIST: 'pas-une-adresse' })).toThrow(/MAIL_ALLOWLIST/);
  });

  it('seuls les destinataires de la liste reçoivent l’e-mail ; les autres sont écartés sans erreur', async () => {
    const inner = new ConsoleMailer();
    const mailer = new AllowListMailer(inner, { emails: ['equipe@exemple.fr'], domains: ['minimoa.app'] });
    const mail = (to: string) => ({ to, subject: 'Test', html: '<p>x</p>', text: 'x' });
    await mailer.send(mail('Equipe@exemple.fr'));
    await mailer.send(mail('alex@minimoa.app'));
    await mailer.send(mail('quelquun@gmail.com'));
    await mailer.send(mail('alex@minimoa.app.evil.com'));
    expect(inner.outbox.map((m) => m.to)).toEqual(['Equipe@exemple.fr', 'alex@minimoa.app']);
  });
});

describe('achats en staging : bac à sable seulement', () => {
  const verifier = (acceptProduction: boolean) => new AppleBilling({ bundleId: 'app.blowy', appAppleId: null, acceptSandbox: true, acceptProduction, rootCertificates: [TEST_ROOT] });

  it('refuse une transaction Production, accepte le bac à sable', async () => {
    await expect(verifier(false).verifyTransaction(signJws(transactionPayload({ environment: 'Production' })))).rejects.toMatchObject({ reason: expect.stringMatching(/Production/) });
    await expect(verifier(false).verifyTransaction(signJws(transactionPayload({ environment: 'Sandbox' })))).resolves.toMatchObject({ environment: 'Sandbox' });
    await expect(verifier(true).verifyTransaction(signJws(transactionPayload({ environment: 'Production' })))).resolves.toMatchObject({ environment: 'Production' });
  });
});

describe('GET /health', () => {
  let close: () => Promise<void>;
  let baseUrl: string;
  beforeAll(async () => {
    const app = await createApp(loadEnv({ BLOWY_ENV: 'staging', BLOWY_ADAPTERS: 'memory', PORT: '0', CORS_ORIGINS: '', WEB_URL: 'https://dev.minimoa.app' }), { logger: false });
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
    close = () => app.close();
  });
  afterAll(() => close());

  it('dit l’environnement et l’état des vignettes floues, rien d’autre (ni version, ni configuration)', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    const body: unknown = await res.json();
    expect(HealthZ.parse(body)).toEqual({ ok: true, env: 'staging', images: 'ok' });
    expect(Object.keys(body as object).sort()).toEqual(['env', 'images', 'ok']);
  });
});
