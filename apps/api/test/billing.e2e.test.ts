/**
 * Minimoa+ de bout en bout avec l'adaptateur mémoire du port `Billing` (mêmes champs qu'Apple, sans signature) :
 * paywall, achat, restauration, suite de notifications, idempotence, rappel du jour 5.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { notificationText } from '@blowy/content';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { BillingJobs } from '../src/modules/billing/application/billing.jobs';
import { memoryJws } from '../src/modules/billing/infrastructure/memory-billing';
import { type TestWorld, apiError, onboardBody, startWorld } from './helpers';

const DAY = 86_400_000;

describe('Minimoa+', () => {
  let w: TestWorld;
  const sent: { userId: string; kind: string; vars?: Record<string, string> }[] = [];

  beforeAll(async () => {
    w = await startWorld();
    const notifier = w.app.get<Notifier>(NOTIFIER, { strict: false });
    notifier.notify = async (userId, kind, vars) => {
      sent.push({ userId, kind, vars });
    };
  });
  afterAll(() => w.close());
  beforeEach(() => {
    sent.length = 0;
  });

  const now = (): number => w.clock.now().getTime();
  const tx = (over: Record<string, unknown> = {}) =>
    memoryJws({
      transactionId: 'T1',
      originalTransactionId: 'O1',
      bundleId: 'app.blowy',
      productId: 'app.blowy.plus.yearly',
      purchaseDate: now(),
      expiresDate: now() + 7 * DAY,
      signedDate: now(),
      environment: 'Sandbox',
      offerType: 1,
      offerDiscountType: 'FREE_TRIAL',
      type: 'Auto-Renewable Subscription',
      ...over,
    });
  const renewal = (over: Record<string, unknown> = {}) =>
    memoryJws({ originalTransactionId: 'O1', autoRenewStatus: 1, isInBillingRetryPeriod: false, signedDate: now(), environment: 'Sandbox', ...over });
  const notify = async (type: string, subtype: string | null, t: string, r: string | null, uuid = randomUUID(), status = 1) => {
    const res = await fetch(`${w.baseUrl}/v1/plus/apple/notifications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        signedPayload: memoryJws({
          notificationType: type,
          subtype,
          notificationUUID: uuid,
          signedDate: now(),
          data: { bundleId: 'app.blowy', environment: 'Sandbox', status, signedTransactionInfo: t, ...(r ? { signedRenewalInfo: r } : {}) },
        }),
      }),
    });
    return { status: res.status, body: (await res.json()) as { outcome?: string } };
  };

  it('paywall : montants facturés en données, essai de 7 jours, avantages, preuve concrète à 0 sans position', async () => {
    const { api } = w.client();
    await api.me.onboard(onboardBody());
    const p = await api.plus.paywall();
    expect(p.defaultPlan).toBe('yearly');
    expect(p.offers.map((o) => [o.plan, o.productId, o.billed.amountMinor, o.period, o.trialDays])).toEqual([
      ['yearly', 'app.blowy.plus.yearly', 5999, 'year', 7],
      ['monthly', 'app.blowy.plus.monthly', 1499, 'month', 0],
      ['weekly', 'app.blowy.plus.weekly', 299, 'week', 0],
    ]);
    // L'hebdomadaire : montant facturé et période en clair, ni équivalent mensuel ni remise (aucune comparaison avec elle).
    expect(p.offers[2]?.labels.price.replace(/[\u00a0\u202f]/g, ' ')).toBe('2,99 € par semaine');
    expect(p.offers[2]).toMatchObject({ perMonth: null, discountPercent: null, labels: { perMonth: null, trial: null, name: 'Abonnement hebdomadaire Minimoa+' } });
    const yearly = p.offers[0];
    // Espaces insécables (fines ou non) normalisées : seule la formulation compte ici.
    const plain = (o: Record<string, string | null> | undefined) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k, v?.replace(/[\u00a0\u202f]/g, ' ') ?? v]));
    expect(plain(yearly?.labels)).toEqual({ price: '59,99 € par an', perMonth: 'soit 4,99 € par mois', trial: '7 jours gratuits, puis 59,99 € par an', name: 'Abonnement annuel Minimoa+' });
    expect(yearly?.discountPercent).toBe(67);
    expect(p.trial).toMatchObject({ days: 7, reminderDay: 5, eligible: true });
    expect(p.trial.timeline.map((s) => s.day)).toEqual([0, 5, 7]);
    expect(p.perks.map((x) => x.key)).toContain('more_habits');
    expect(p.teaser).toEqual({ compatibleNearby: 0, label: null });
    expect(p.legal.plusTermsUrl).toMatch(/\/legal\/abonnement\/$/);
    expect(p.legal.termsUrl).not.toMatch(/\/(en|es|pt|nl)\/legal\//);
    // Apple 3.1.2 : renouvellement automatique, paiement par Apple, où annuler.
    expect(p.renewalNotice).toMatch(/automatiquement/);
    expect(p.renewalNotice).toMatch(/Réglages › ton nom › Abonnements/);
    expect(p.continueFreeLabel).toBe('Continuer gratuitement');
    expect(p.subscription).toMatchObject({ phase: 'none', plus: false });
  });

  it('achat avec essai, renouvellement, annulation, remboursement : plus_until suit', async () => {
    const { api, id } = w.client();
    await api.me.onboard(onboardBody());
    const o = `O-${id}`;
    const sub = await api.plus.submitPurchase({ store: 'apple', signedTransaction: tx({ originalTransactionId: o, transactionId: `${o}-1`, appAccountToken: id }), signedRenewalInfo: renewal({ originalTransactionId: o }) });
    expect(sub).toMatchObject({ plus: true, phase: 'trial', plan: 'yearly', willRenew: true, manageUrl: 'https://apps.apple.com/account/subscriptions' });
    expect(sub.summary).toMatch(/^Essai gratuit jusqu’au \d+ novembre\. Premier paiement ce jour-là\.$/);
    expect((await api.me.get()).plus).toBe(true);
    expect((await api.plus.paywall()).trial.eligible).toBe(false);

    // Jour 7 : premier paiement.
    w.clock.advanceDays(7);
    const paid = tx({ originalTransactionId: o, transactionId: `${o}-2`, purchaseDate: now(), expiresDate: now() + 365 * DAY, offerType: null, offerDiscountType: null });
    expect((await notify('DID_RENEW', null, paid, renewal({ originalTransactionId: o }))).body.outcome).toBe('applied');
    expect(await api.plus.subscription()).toMatchObject({ phase: 'active', willRenew: true, trialEndsAt: null });

    // Annulation depuis les réglages Apple : reste ouvert jusqu'à l'échéance, sans renouvellement.
    w.clock.advanceDays(10);
    await notify('DID_CHANGE_RENEWAL_STATUS', 'AUTO_RENEW_DISABLED', paid, renewal({ originalTransactionId: o, autoRenewStatus: 0 }));
    expect(await api.plus.subscription()).toMatchObject({ plus: true, phase: 'active', willRenew: false, renewsAt: null });

    // Remboursement : fermé tout de suite.
    w.clock.advanceDays(1);
    const refunded = tx({ originalTransactionId: o, transactionId: `${o}-2`, purchaseDate: now() - 11 * DAY, expiresDate: now() + 354 * DAY, offerType: null, offerDiscountType: null, revocationDate: now() });
    await notify('REFUND', null, refunded, null, randomUUID(), 5);
    expect(await api.plus.subscription()).toMatchObject({ plus: false, phase: 'refunded' });
    expect((await api.me.get()).plus).toBe(false);
  });

  it('délai de grâce puis nouvelle tentative de paiement, puis récupération', async () => {
    const { api, id } = w.client();
    await api.me.onboard(onboardBody());
    const o = `G-${id}`;
    const monthly = (over: Record<string, unknown> = {}) =>
      tx({ originalTransactionId: o, transactionId: `${o}-1`, productId: 'app.blowy.plus.monthly', offerType: null, offerDiscountType: null, expiresDate: now() + 30 * DAY, ...over });
    await api.plus.submitPurchase({ store: 'apple', signedTransaction: monthly() });
    w.clock.advanceDays(30);
    const lapsed = monthly({ expiresDate: now() });
    await notify('DID_FAIL_TO_RENEW', 'GRACE_PERIOD', lapsed, renewal({ originalTransactionId: o, isInBillingRetryPeriod: true, gracePeriodExpiresDate: now() + 16 * DAY }), randomUUID(), 4);
    expect(await api.plus.subscription()).toMatchObject({ plus: true, phase: 'grace' });
    w.clock.advanceDays(16);
    await notify('GRACE_PERIOD_EXPIRED', null, lapsed, renewal({ originalTransactionId: o, isInBillingRetryPeriod: true }), randomUUID(), 3);
    expect(await api.plus.subscription()).toMatchObject({ plus: false, phase: 'billing_retry' });
    w.clock.advanceDays(2);
    await notify('DID_RENEW', 'BILLING_RECOVERY', monthly({ transactionId: `${o}-2`, purchaseDate: now(), expiresDate: now() + 30 * DAY }), renewal({ originalTransactionId: o }));
    expect(await api.plus.subscription()).toMatchObject({ plus: true, phase: 'active' });
  });

  it('webhook idempotent, sans personne rattachée tant que l’app n’a rien envoyé, puis restauration', async () => {
    const { api, id } = w.client();
    await api.me.onboard(onboardBody());
    const o = `N-${id}`;
    const t = tx({ originalTransactionId: o, transactionId: `${o}-1` });
    const uuid = randomUUID();
    expect((await notify('SUBSCRIBED', 'INITIAL_BUY', t, null, uuid)).body.outcome).toBe('unlinked');
    expect((await notify('SUBSCRIBED', 'INITIAL_BUY', t, null, uuid)).body.outcome).toBe('duplicate');
    expect((await api.me.get()).plus).toBe(false);
    await api.plus.submitPurchase({ store: 'apple', signedTransaction: t });
    expect((await api.me.get()).plus).toBe(true);
  });

  it('restauré sur un autre compte Minimoa : l’abonnement change de compte', async () => {
    const a = w.client();
    const b = w.client();
    await a.api.me.onboard(onboardBody());
    await b.api.me.onboard(onboardBody({ displayName: 'Nina' }));
    const t = tx({ originalTransactionId: `R-${a.id}`, transactionId: `R-${a.id}`, appAccountToken: a.id, offerType: null, offerDiscountType: null, expiresDate: now() + 30 * DAY, productId: 'app.blowy.plus.monthly' });
    await a.api.plus.submitPurchase({ store: 'apple', signedTransaction: t });
    expect((await a.api.me.get()).plus).toBe(true);
    await b.api.plus.submitPurchase({ store: 'apple', signedTransaction: t });
    expect((await b.api.me.get()).plus).toBe(true);
    expect((await a.api.me.get()).plus).toBe(false);
  });

  it('refuse un achat illisible, d’une autre app ou d’un produit inconnu', async () => {
    const { api } = w.client();
    await api.me.onboard(onboardBody());
    expect(await apiError(api.plus.submitPurchase({ store: 'apple', signedTransaction: 'x'.repeat(40) }))).toMatchObject({ code: 'invalid' });
    expect(await apiError(api.plus.submitPurchase({ store: 'apple', signedTransaction: tx({ bundleId: 'com.autre' }) }))).toMatchObject({ code: 'invalid' });
    expect(await apiError(api.plus.submitPurchase({ store: 'apple', signedTransaction: tx({ productId: 'app.blowy.coins' }) }))).toMatchObject({
      code: 'invalid',
      message: 'Ce produit n’est pas un abonnement Minimoa+.',
    });
    const bad = await fetch(`${w.baseUrl}/v1/plus/apple/notifications`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ signedPayload: 'pas.un.jws.valide' }) });
    expect(bad.status).toBe(400);
  });

  it('rappel de fin d’essai : à partir du jour 5, en journée, une seule fois ; pas après une annulation', async () => {
    const jobs = w.app.get(BillingJobs, { strict: false });
    // Achat le 11 novembre à 11 h (Paris) + décalages des tests précédents : on part d'un instant connu.
    const a = w.client();
    const b = w.client();
    await a.api.me.onboard(onboardBody());
    await b.api.me.onboard(onboardBody({ displayName: 'Léon' }));
    await a.api.plus.submitPurchase({ store: 'apple', signedTransaction: tx({ originalTransactionId: `T-${a.id}`, transactionId: `T-${a.id}`, purchaseDate: now(), expiresDate: now() + 7 * DAY }) });
    await b.api.plus.submitPurchase({
      store: 'apple',
      signedTransaction: tx({ originalTransactionId: `T-${b.id}`, transactionId: `T-${b.id}`, purchaseDate: now(), expiresDate: now() + 7 * DAY }),
      signedRenewalInfo: renewal({ originalTransactionId: `T-${b.id}`, autoRenewStatus: 0 }),
    });
    const start = now();
    const at = (days: number) => new Date(start + days * DAY);
    const mine = () => sent.filter((s) => s.kind === 'trial_reminder' && (s.userId === a.id || s.userId === b.id));

    await jobs.runDue(at(4.9));
    expect(mine()).toEqual([]);
    await jobs.runDue(at(5));
    const reminders = mine();
    expect(reminders.map((r) => r.userId)).toEqual([a.id]);
    // Variables en données (date ISO, centimes) : la notification les met en forme dans la langue de la personne.
    expect(reminders[0]?.vars).toMatchObject({ price: '5999', currency: 'EUR' });
    const reminderText = notificationText('fr', 'trial_reminder', reminders[0]?.vars ?? {});
    expect(reminderText.title).toMatch(/^Ton essai Minimoa\+ se termine le \d+ \p{L}+$/u);
    expect(reminderText.body.replace(/[\u00a0\u202f]/g, ' ')).toMatch(/^Ensuite, premier paiement de 59,99 €\./u);
    await jobs.runDue(at(5.5));
    await jobs.runDue(at(6));
    expect(mine()).toHaveLength(1);
  });

  it('le rappel attend la journée (pas en pleine nuit), sauf dans les 12 dernières heures', async () => {
    const jobs = w.app.get(BillingJobs, { strict: false });
    const { api, id } = w.client();
    await api.me.onboard(onboardBody());
    // Essai qui finit à 3 h du matin (Paris) : le jour 5 tombe aussi à 3 h.
    const end = Date.parse('2027-03-10T02:00:00Z');
    await api.plus.submitPurchase({ store: 'apple', signedTransaction: tx({ originalTransactionId: `N-${id}`, transactionId: `N-${id}`, purchaseDate: end - 7 * DAY, expiresDate: end, signedDate: end - 7 * DAY }) });
    await jobs.runDue(new Date(end - 2 * DAY));
    expect(sent.filter((s) => s.userId === id)).toEqual([]);
    await jobs.runDue(new Date(end - 2 * DAY + 8 * 3_600_000)); // 11 h à Paris
    expect(sent.filter((s) => s.userId === id)).toHaveLength(1);
  });
});
