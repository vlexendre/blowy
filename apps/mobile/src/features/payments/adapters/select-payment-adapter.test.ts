import { describe, expect, it } from 'vitest';
import type { StripeSheet } from './stripe-sheet';
import { LocalDemoPaymentAdapter } from './local-demo-payment.adapter';
import { selectPaymentAdapter } from './select-payment-adapter';

const sheet = (presentCode?: string): StripeSheet => ({
  init: async () => undefined,
  setup: async () => ({}),
  present: async () => (presentCode ? { error: { code: presentCode } } : {}),
  applePaySupported: async () => true,
});
const req = { provider: 'STRIPE' as const, clientSecret: 'pi_x_secret_y', amountCents: 499, currency: 'EUR', label: 'Place' };

describe('selectPaymentAdapter', () => {
  it('Stripe quand la clé publiable et le SDK sont là', () => {
    expect(selectPaymentAdapter({ blowyEnv: 'production', stripePublishableKey: 'pk_live_x' }, sheet())?.kind).toBe('STRIPE');
  });
  it('jamais de LOCAL_DEMO en production', () => {
    expect(selectPaymentAdapter({ blowyEnv: 'production' }, null)).toBeNull();
    expect(selectPaymentAdapter({ blowyEnv: 'production', stripePublishableKey: 'pk_live_x' }, null)).toBeNull();
    expect(() => new LocalDemoPaymentAdapter('production')).toThrow();
  });
  it('LOCAL_DEMO en local sans clé', () => {
    expect(selectPaymentAdapter({ blowyEnv: 'local' }, null)?.kind).toBe('LOCAL_DEMO');
  });
});

describe('StripePaymentAdapter', () => {
  it('payé, annulé, refusé', async () => {
    expect(await selectPaymentAdapter({ blowyEnv: 'local', stripePublishableKey: 'pk_test_x' }, sheet())!.pay(req)).toEqual({ status: 'PAID' });
    expect(await selectPaymentAdapter({ blowyEnv: 'local', stripePublishableKey: 'pk_test_x' }, sheet('Canceled'))!.pay(req)).toEqual({ status: 'CANCELED' });
    expect(await selectPaymentAdapter({ blowyEnv: 'local', stripePublishableKey: 'pk_test_x' }, sheet('Failed'))!.pay(req)).toEqual({ status: 'FAILED', reason: 'DECLINED' });
  });
  it('refuse une intention LOCAL_DEMO', async () => {
    expect(await selectPaymentAdapter({ blowyEnv: 'local', stripePublishableKey: 'pk_test_x' }, sheet())!.pay({ ...req, provider: 'LOCAL_DEMO' })).toMatchObject({ status: 'FAILED' });
  });
});
