import { describe, expect, it } from 'vitest';
import {
  OFFERS,
  type StoreEvent,
  type SubscriptionState,
  applyStoreEvent,
  monthlyEquivalentMinor,
  plusUntilOf,
  subscriptionView,
  trialReminderAt,
  trialReminderDue,
  yearlyDiscountPercent,
} from './billing';

const DAY = 86_400_000;
const T0 = Date.parse('2026-11-15T10:00:00Z');
const at = (days: number): string => new Date(T0 + days * DAY).toISOString();

/** Événement de base : achat annuel avec essai gratuit le jour 0. */
const ev = (over: Partial<StoreEvent>): StoreEvent => ({
  store: 'apple',
  kind: null,
  subtype: null,
  signedAt: at(0),
  originalTransactionId: '1000',
  transactionId: '1000',
  productId: 'app.blowy.plus.yearly',
  plan: 'yearly',
  purchasedAt: at(0),
  expiresAt: at(7),
  freeTrial: true,
  revokedAt: null,
  storeStatus: 1,
  renewal: { autoRenew: true, inBillingRetry: false, graceUntil: null },
  ...over,
});

const run = (events: StoreEvent[]): SubscriptionState => {
  let s: SubscriptionState | null = null;
  for (const e of events) s = applyStoreEvent(s, e);
  if (!s) throw new Error('aucun événement');
  return s;
};

describe('offres', () => {
  it('59,88 € par an soit 4,99 € par mois, 14,99 € par mois, remise exacte de 67 %', () => {
    expect(OFFERS.yearly.amountMinor).toBe(5988);
    expect(OFFERS.yearly.trialDays).toBe(7);
    expect(OFFERS.monthly.amountMinor).toBe(1499);
    expect(OFFERS.monthly.trialDays).toBe(0);
    expect(monthlyEquivalentMinor(OFFERS.yearly)).toBe(499);
    expect(yearlyDiscountPercent()).toBe(67);
  });
});

describe('cycle de vie de l’abonnement', () => {
  it('essai puis premier paiement (SUBSCRIBED → DID_RENEW)', () => {
    const trial = run([ev({ kind: 'SUBSCRIBED', subtype: 'INITIAL_BUY' })]);
    expect(trial.status).toBe('trial');
    expect(trial.trialEndsAt).toBe(at(7));
    expect(plusUntilOf(trial)).toBe(at(7));
    const paid = run([
      ev({ kind: 'SUBSCRIBED', subtype: 'INITIAL_BUY' }),
      ev({ kind: 'DID_RENEW', signedAt: at(7), transactionId: '1001', purchasedAt: at(7), expiresAt: at(372), freeTrial: false }),
    ]);
    expect(paid.status).toBe('active');
    expect(paid.trialUsed).toBe(true);
    expect(paid.trialEndsAt).toBeNull();
    expect(plusUntilOf(paid)).toBe(at(372));
    expect(paid.startedAt).toBe(at(0));
  });

  it('annulation pendant l’essai : accès jusqu’au bout de l’essai, pas de renouvellement, puis expiré', () => {
    const cancelled = run([
      ev({ kind: 'SUBSCRIBED', subtype: 'INITIAL_BUY' }),
      ev({ kind: 'DID_CHANGE_RENEWAL_STATUS', subtype: 'AUTO_RENEW_DISABLED', signedAt: at(2), renewal: { autoRenew: false, inBillingRetry: false, graceUntil: null } }),
    ]);
    expect(cancelled.status).toBe('trial');
    expect(cancelled.autoRenew).toBe(false);
    const view = subscriptionView(cancelled, new Date(T0 + 3 * DAY));
    expect(view).toMatchObject({ phase: 'trial', plus: true, willRenew: false, renewsAt: null, trialEndsAt: at(7) });
    const expired = applyStoreEvent(cancelled, ev({ kind: 'EXPIRED', subtype: 'VOLUNTARY', signedAt: at(7), storeStatus: 2, renewal: { autoRenew: false, inBillingRetry: false, graceUntil: null } }));
    expect(expired.status).toBe('expired');
    expect(subscriptionView(expired, new Date(T0 + 8 * DAY))).toMatchObject({ phase: 'expired', plus: false, willRenew: false });
  });

  it('sans nouvelles du magasin, un essai dépassé se lit comme expiré', () => {
    const trial = run([ev({ kind: 'SUBSCRIBED' })]);
    expect(subscriptionView(trial, new Date(T0 + 8 * DAY))).toMatchObject({ phase: 'expired', plus: false });
  });

  it('remboursement : l’accès s’arrête à la date du remboursement, et reprend si Apple l’annule', () => {
    const base = [ev({ kind: 'SUBSCRIBED' }), ev({ kind: 'DID_RENEW', signedAt: at(7), transactionId: '1001', expiresAt: at(372), freeTrial: false })];
    const refunded = run([...base, ev({ kind: 'REFUND', signedAt: at(20), transactionId: '1001', expiresAt: at(372), freeTrial: false, revokedAt: at(20), storeStatus: 5 })]);
    expect(refunded.status).toBe('refunded');
    expect(plusUntilOf(refunded)).toBe(at(20));
    expect(refunded.autoRenew).toBe(false);
    expect(subscriptionView(refunded, new Date(T0 + 21 * DAY)).plus).toBe(false);
    const reversed = applyStoreEvent(refunded, ev({ kind: 'REFUND_REVERSED', signedAt: at(25), transactionId: '1001', expiresAt: at(372), freeTrial: false }));
    expect(reversed.status).toBe('active');
    expect(plusUntilOf(reversed)).toBe(at(372));
  });

  it('partage familial retiré (REVOKE)', () => {
    const s = run([ev({ kind: 'SUBSCRIBED', freeTrial: false }), ev({ kind: 'REVOKE', signedAt: at(3), revokedAt: at(3), freeTrial: false })]);
    expect(s.status).toBe('revoked');
    expect(plusUntilOf(s)).toBe(at(3));
  });

  it('échec de paiement avec délai de grâce : accès maintenu jusqu’à la fin du délai, puis nouvelle tentative, puis récupération', () => {
    const base = [ev({ kind: 'SUBSCRIBED', freeTrial: false, plan: 'monthly', productId: 'app.blowy.plus.monthly', expiresAt: at(30) })];
    const grace = run([
      ...base,
      ev({ kind: 'DID_FAIL_TO_RENEW', subtype: 'GRACE_PERIOD', signedAt: at(30), freeTrial: false, plan: 'monthly', expiresAt: at(30), storeStatus: 4, renewal: { autoRenew: true, inBillingRetry: true, graceUntil: at(46) } }),
    ]);
    expect(grace.status).toBe('grace');
    expect(plusUntilOf(grace)).toBe(at(46));
    expect(subscriptionView(grace, new Date(T0 + 40 * DAY))).toMatchObject({ phase: 'grace', plus: true });

    const retry = applyStoreEvent(grace, ev({ kind: 'GRACE_PERIOD_EXPIRED', signedAt: at(46), freeTrial: false, plan: 'monthly', expiresAt: at(30), storeStatus: 3, renewal: { autoRenew: true, inBillingRetry: true, graceUntil: null } }));
    expect(retry.status).toBe('billing_retry');
    expect(subscriptionView(retry, new Date(T0 + 47 * DAY))).toMatchObject({ phase: 'billing_retry', plus: false, willRenew: true, renewsAt: null });

    const recovered = applyStoreEvent(retry, ev({ kind: 'DID_RENEW', subtype: 'BILLING_RECOVERY', signedAt: at(50), transactionId: '1002', freeTrial: false, plan: 'monthly', expiresAt: at(80) }));
    expect(recovered.status).toBe('active');
    expect(plusUntilOf(recovered)).toBe(at(80));
  });

  it('échec de paiement sans délai de grâce, puis expiration en fin de tentatives', () => {
    const s = run([
      ev({ kind: 'SUBSCRIBED', freeTrial: false, expiresAt: at(30) }),
      ev({ kind: 'DID_FAIL_TO_RENEW', signedAt: at(30), freeTrial: false, expiresAt: at(30), storeStatus: 3, renewal: { autoRenew: true, inBillingRetry: true, graceUntil: null } }),
    ]);
    expect(s.status).toBe('billing_retry');
    expect(plusUntilOf(s)).toBe(at(30));
    const expired = applyStoreEvent(s, ev({ kind: 'EXPIRED', subtype: 'BILLING_RETRY', signedAt: at(90), freeTrial: false, expiresAt: at(30), storeStatus: 2, renewal: { autoRenew: false, inBillingRetry: false, graceUntil: null } }));
    expect(expired.status).toBe('expired');
  });

  it('un événement arrivé en retard ne fait pas reculer l’état', () => {
    const renewed = run([ev({ kind: 'SUBSCRIBED' }), ev({ kind: 'DID_RENEW', signedAt: at(7), transactionId: '1001', expiresAt: at(372), freeTrial: false })]);
    const late = applyStoreEvent(renewed, ev({ kind: 'SUBSCRIBED', signedAt: at(0) }));
    expect(late).toBe(renewed);
    // Restauration d'une vieille transaction de la même série : l'échéance ne recule pas.
    const restored = applyStoreEvent(renewed, ev({ kind: null, signedAt: at(100), transactionId: '1000', expiresAt: at(7) }));
    expect(restored).toBe(renewed);
  });

  it('réabonnement après expiration', () => {
    const s = run([
      ev({ kind: 'SUBSCRIBED', freeTrial: false, expiresAt: at(30) }),
      ev({ kind: 'EXPIRED', subtype: 'VOLUNTARY', signedAt: at(30), storeStatus: 2, freeTrial: false, expiresAt: at(30) }),
      ev({ kind: 'SUBSCRIBED', subtype: 'RESUBSCRIBE', signedAt: at(60), transactionId: '1003', purchasedAt: at(60), freeTrial: false, expiresAt: at(90) }),
    ]);
    expect(s.status).toBe('active');
    expect(plusUntilOf(s)).toBe(at(90));
  });
});

describe('rappel avant la fin de l’essai', () => {
  const trial = run([ev({ kind: 'SUBSCRIBED' })]);
  it('dû à partir du jour 5 (2 jours avant le premier paiement), pas avant', () => {
    expect(trialReminderAt(at(7))).toBe(at(5));
    expect(trialReminderDue(trial, null, new Date(T0 + 4.9 * DAY))).toBe(false);
    expect(trialReminderDue(trial, null, new Date(T0 + 5 * DAY))).toBe(true);
    expect(trialReminderDue(trial, null, new Date(T0 + 6.9 * DAY))).toBe(true);
  });
  it('une seule fois par essai', () => {
    expect(trialReminderDue(trial, at(7), new Date(T0 + 5.5 * DAY))).toBe(false);
  });
  it('pas de rappel si l’essai est annulé ou terminé', () => {
    const cancelled = { ...trial, autoRenew: false };
    expect(trialReminderDue(cancelled, null, new Date(T0 + 5.5 * DAY))).toBe(false);
    expect(trialReminderDue(trial, null, new Date(T0 + 7 * DAY))).toBe(false);
  });
});
