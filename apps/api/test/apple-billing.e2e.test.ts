/**
 * Adaptateur Apple réel (`AppleBilling`) : vérification des JWS (chaîne x5c, extensions Apple, signature ES256,
 * bundle, environnement) contre des charges conformes à la documentation d'Apple, signées par une chaîne de test.
 * Puis la route des notifications de bout en bout avec cet adaptateur (signature vérifiée, idempotence).
 */
import { randomUUID, X509Certificate } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { createApiClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { loadEnv } from '../src/config/env';
import { AppleBilling } from '../src/modules/billing/infrastructure/apple/app-store-verifier';
import { APPLE_ROOT_CA_G3_PEM, APPLE_ROOT_CA_G3_SHA256 } from '../src/modules/billing/infrastructure/apple/apple-root-ca';
import { APPLE_BILLING } from '../src/modules/billing/tokens';
import { CHAINS, TEST_ROOT, notificationPayload, renewalPayload, signJws, transactionPayload } from './apple-jws';
import { FakeClock, START, onboardBody } from './helpers';

const verifier = (over: Partial<ConstructorParameters<typeof AppleBilling>[0]> = {}) =>
  new AppleBilling({ bundleId: 'app.blowy', appAppleId: 6700000000, acceptSandbox: true, rootCertificates: [TEST_ROOT], ...over });

const rejects = async (p: Promise<unknown>, reason: RegExp): Promise<void> => {
  await expect(p).rejects.toMatchObject({ name: 'BillingVerificationError', reason: expect.stringMatching(reason) });
};

describe('AppleBilling : vérification des données signées', () => {
  it('embarque la vraie racine Apple Root CA - G3 (empreinte publiée par Apple)', () => {
    const cert = new X509Certificate(APPLE_ROOT_CA_G3_PEM);
    expect(cert.fingerprint256).toBe(APPLE_ROOT_CA_G3_SHA256);
    expect(cert.subject).toContain('Apple Root CA - G3');
    // Par défaut, seule la racine Apple est de confiance : la chaîne de test est refusée.
    return rejects(new AppleBilling({ bundleId: 'app.blowy', appAppleId: null, acceptSandbox: true }).verifyTransaction(signJws(transactionPayload())), /racine/);
  });

  it('accepte une transaction correctement signée et en lit les champs', async () => {
    const t = await verifier().verifyTransaction(signJws(transactionPayload({ appAccountToken: '7b0e4bde-58b5-4f27-9a83-0e3d6b9c2f11' })));
    expect(t).toMatchObject({
      environment: 'Production',
      originalTransactionId: '2000000000000001',
      productId: 'app.blowy.plus.yearly',
      offerType: 1,
      offerDiscountType: 'FREE_TRIAL',
      appAccountToken: '7b0e4bde-58b5-4f27-9a83-0e3d6b9c2f11',
    });
  });

  it('refuse une charge modifiée après signature', async () => {
    const jws = signJws(transactionPayload());
    const [h, , s] = jws.split('.');
    const forged = Buffer.from(JSON.stringify(transactionPayload({ expiresDate: Date.parse('2099-01-01T00:00:00Z') }))).toString('base64url');
    await rejects(verifier().verifyTransaction(`${h}.${forged}.${s}`), /signature/);
  });

  it('refuse une signature faite avec une autre clé que celle du certificat', async () => {
    await rejects(verifier().verifyTransaction(signJws(transactionPayload(), CHAINS.wrongKey)), /signature/);
  });

  it('refuse une chaîne qui ne remonte pas à la racine de confiance', async () => {
    await rejects(verifier().verifyTransaction(signJws(transactionPayload(), CHAINS.rogue)), /racine/);
  });

  it('refuse une feuille sans l’extension Apple', async () => {
    await rejects(verifier().verifyTransaction(signJws(transactionPayload(), CHAINS.noOid)), /extension Apple/);
  });

  it('refuse un JWS signé hors de la période de validité des certificats', async () => {
    await rejects(verifier().verifyTransaction(signJws(transactionPayload({ signedDate: Date.parse('2019-06-01T00:00:00Z') }))), /période de validité/);
  });

  it('refuse un autre algorithme, une chaîne incomplète, un JWS mal formé', async () => {
    await rejects(verifier().verifyTransaction(signJws(transactionPayload(), { alg: 'none' })), /algorithme/);
    await rejects(verifier().verifyTransaction(signJws(transactionPayload(), { chain: CHAINS.valid.chain.slice(0, 2) })), /chaîne/);
    await rejects(verifier().verifyTransaction('abc.def'), /mal formé/);
  });

  it('refuse une autre app, Xcode, et le bac à sable si on le refuse', async () => {
    await rejects(verifier().verifyTransaction(signJws(transactionPayload({ bundleId: 'com.autre.app' }))), /bundle/);
    await rejects(verifier().verifyTransaction(signJws(transactionPayload({ environment: 'Xcode' }))), /environnement refusé/);
    await expect(verifier().verifyTransaction(signJws(transactionPayload({ environment: 'Sandbox' })))).resolves.toMatchObject({ environment: 'Sandbox' });
    await rejects(verifier({ acceptSandbox: false }).verifyTransaction(signJws(transactionPayload({ environment: 'Sandbox' }))), /environnement refusé/);
  });

  it('notification V2 : vérifie l’enveloppe et les JWS imbriqués, et l’Apple ID de l’app en production', async () => {
    const tx = signJws(transactionPayload());
    const rn = signJws(renewalPayload({ autoRenewStatus: 0 }));
    const n = await verifier().verifyNotification(signJws(notificationPayload('DID_CHANGE_RENEWAL_STATUS', 'AUTO_RENEW_DISABLED', tx, rn)));
    expect(n).toMatchObject({ notificationType: 'DID_CHANGE_RENEWAL_STATUS', subtype: 'AUTO_RENEW_DISABLED', status: 1, environment: 'Production' });
    expect(n.renewal?.autoRenewStatus).toBe(false);
    expect(n.transaction?.transactionId).toBe('2000000000000001');
    await rejects(verifier({ appAppleId: 1 }).verifyNotification(signJws(notificationPayload('DID_RENEW', null, tx, rn))), /app inattendue/);
    // Une transaction imbriquée mal signée fait refuser toute la notification.
    await rejects(verifier().verifyNotification(signJws(notificationPayload('DID_RENEW', null, signJws(transactionPayload(), CHAINS.rogue), rn))), /racine/);
  });
});

describe('route des notifications Apple avec l’adaptateur réel', () => {
  let app: INestApplication;
  let baseUrl: string;
  const clock = new FakeClock(START);

  beforeAll(async () => {
    const env = loadEnv({ BLOWY_ENV: 'local', BLOWY_ADAPTERS: 'memory', PORT: '0', CORS_ORIGINS: '' });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule.forRoot(env, { clock })] })
      .overrideProvider(APPLE_BILLING)
      .useValue(verifier())
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  });
  afterAll(() => app.close());

  const post = (body: unknown) => fetch(`${baseUrl}/v1/plus/apple/notifications`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  it('rattache à la personne par appAccountToken, ignore les renvois, refuse une fausse signature', async () => {
    const userId = randomUUID();
    const api = createApiClient({ baseUrl, getToken: () => `test:${userId}` });
    await api.me.onboard(onboardBody());
    const tx = signJws(transactionPayload({ appAccountToken: userId, originalTransactionId: '777', transactionId: '777' }));
    const rn = signJws(renewalPayload({ originalTransactionId: '777' }));
    const payload = notificationPayload('SUBSCRIBED', 'INITIAL_BUY', tx, rn);

    const first = await post({ signedPayload: signJws(payload) });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true, outcome: 'applied' });
    expect((await api.me.get()).plus).toBe(true);
    expect(await api.plus.subscription()).toMatchObject({ phase: 'trial', willRenew: true, plan: 'yearly', store: 'apple' });

    // Apple renvoie la même notification (même notificationUUID) : rien ne change.
    const again = await post({ signedPayload: signJws(payload) });
    expect(await again.json()).toEqual({ ok: true, outcome: 'duplicate' });

    // Une notification forgée (signée par une autre chaîne) est refusée et n'a aucun effet.
    const refund = notificationPayload('REFUND', null, signJws(transactionPayload({ originalTransactionId: '777', transactionId: '777', revocationDate: START.getTime() })), rn);
    const forged = await post({ signedPayload: signJws(refund, CHAINS.rogue) });
    expect(forged.status).toBe(400);
    expect((await api.me.get()).plus).toBe(true);

    // La vraie, signée correctement : Blowy+ se ferme.
    const real = await post({ signedPayload: signJws({ ...refund, signedDate: START.getTime() + 60_000 }) });
    expect(await real.json()).toEqual({ ok: true, outcome: 'applied' });
    expect((await api.me.get()).plus).toBe(false);
  });

  it('TEST d’App Store Connect : accusé de réception', async () => {
    const res = await post({ signedPayload: signJws({ notificationType: 'TEST', notificationUUID: randomUUID(), version: '2.0', signedDate: START.getTime(), data: { bundleId: 'app.blowy', environment: 'Production', appAppleId: 6700000000 } }) });
    expect(await res.json()).toEqual({ ok: true, outcome: 'test' });
  });
});
