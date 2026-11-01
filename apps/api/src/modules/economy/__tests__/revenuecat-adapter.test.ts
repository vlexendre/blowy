import { describe, expect, it } from 'vitest';
import { AuthorizationHeaderAuthenticator, RejectAllAuthenticator, parseRevenueCatWebhook } from '../infrastructure/revenuecat/revenuecat-webhook.js';
import { mapSubscriber } from '../infrastructure/revenuecat/revenuecat-billing.provider.js';
import { loadEconomyConfig } from '../infrastructure/config/economy-config.js';
import { selectBillingProvider } from '../economy.composition.js';

const SECRET = 'Bearer whsec-0123456789abcdefghijkl';

describe('authentification webhook (header Authorization documenté par RevenueCat)', () => {
  const auth = new AuthorizationHeaderAuthenticator(SECRET);
  it('accepte uniquement la valeur exacte', () => {
    expect(auth.isAuthentic(SECRET)).toBe(true);
    expect(auth.isAuthentic(`${SECRET} `)).toBe(false);
    expect(auth.isAuthentic('Bearer whsec-0123456789abcdefghijkL')).toBe(false);
    expect(auth.isAuthentic(undefined)).toBe(false);
    expect(auth.isAuthentic('')).toBe(false);
    expect(auth.isAuthentic('x'.repeat(5000))).toBe(false);
  });
  it('sans secret configuré : tout est refusé', () => {
    expect(new RejectAllAuthenticator().isAuthentic(SECRET)).toBe(false);
    expect(() => new AuthorizationHeaderAuthenticator('court')).toThrow();
  });
});

describe('parsing webhook', () => {
  it('normalise les champs documentés et l’environnement', () => {
    const e = parseRevenueCatWebhook({
      api_version: '1.0',
      event: { id: 'evt_1', type: 'INITIAL_PURCHASE', event_timestamp_ms: 1_700_000_000_000, app_user_id: 'u', aliases: ['$RCAnonymousID:abc', 'u'], environment: 'SANDBOX', product_id: 'p', expiration_at_ms: 1_800_000_000_000, unknown_future_field: 1 },
    });
    expect(e).toMatchObject({ providerEventId: 'evt_1', environment: 'SANDBOX', productId: 'p', appUserIds: ['u', '$RCAnonymousID:abc'] });
    expect(e.expiresAt?.getTime()).toBe(1_800_000_000_000);
  });
  it('rejette un corps invalide', () => {
    expect(() => parseRevenueCatWebhook({ event: { type: 'X' } })).toThrow();
  });
});

describe('mapping GET /v1/subscribers', () => {
  it('sépare sandbox/production et lit les consommables', () => {
    const s = mapSubscriber(
      'u',
      {
        subscriber: {
          entitlements: { blowy_plus: { expires_date: '2026-12-01T00:00:00Z', product_identifier: 'm', purchase_date: '2026-11-01T00:00:00Z' } },
          subscriptions: { m: { expires_date: '2026-12-01T00:00:00Z', is_sandbox: true, period_type: 'TRIAL', store: 'APP_STORE' } },
          non_subscriptions: { coins_500: [{ id: 'x', purchase_date: '2026-11-01T00:00:00Z', is_sandbox: false, store: 'PLAY_STORE' }] },
        },
      },
      new Date('2026-11-02T00:00:00Z'),
    );
    expect(s.subscriptions[0]).toMatchObject({ environment: 'SANDBOX', periodType: 'TRIAL' });
    // Sans store_transaction_id, un consommable n'est pas créditable par réconciliation (webhook seul).
    expect(s.consumables[0]).toMatchObject({ productId: 'coins_500', environment: 'PRODUCTION', storeTransactionId: null });
  });
});

describe('configuration (Strategy par environnement)', () => {
  it('LOCAL_DEMO interdit en production', () => {
    expect(() => loadEconomyConfig({ BLOWY_ENV: 'production', BILLING_PROVIDER: 'local_demo' })).toThrow(/interdit en production/);
    expect(() => loadEconomyConfig({ BLOWY_ENV: 'production' })).toThrow(/REVENUECAT_SECRET_API_KEY/);
    expect(() => selectBillingProvider({ env: 'production', provider: 'local_demo', revenueCat: null, localWebhookAuth: null }, { now: () => new Date() })).toThrow();
  });
  it('local sans clé → démo étiquetée LOCAL_DEMO', () => {
    const cfg = loadEconomyConfig({ BLOWY_ENV: 'local' });
    expect(cfg.provider).toBe('local_demo');
    expect(selectBillingProvider(cfg, { now: () => new Date() }).mode).toBe('LOCAL_DEMO');
  });
  it('production : sandbox refusé par défaut, LIVE', () => {
    const cfg = loadEconomyConfig({ BLOWY_ENV: 'production', REVENUECAT_SECRET_API_KEY: 'sk_live_xxxxxxxxxx', REVENUECAT_WEBHOOK_AUTH: SECRET });
    const p = selectBillingProvider(cfg, { now: () => new Date() });
    expect(p.mode).toBe('LIVE');
    expect([...p.acceptedEnvironments]).toEqual(['PRODUCTION']);
  });
});
