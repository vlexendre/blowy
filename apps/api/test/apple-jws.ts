/**
 * Signature de JWS « Apple » pour les tests : chaîne de test générée avec openssl (fixtures/apple : fausse racine,
 * intermédiaire et feuille portant les extensions Apple 1.2.840.113635.100.6.2.1 et 1.2.840.113635.100.6.11.1).
 * Ces clés ne servent qu'aux tests ; le serveur réel n'embarque que « Apple Root CA - G3 ».
 */
import { readFileSync } from 'node:fs';
import { sign } from 'node:crypto';
import { join } from 'node:path';

const dir = join(import.meta.dirname, 'fixtures', 'apple');
const read = (name: string): string => readFileSync(join(dir, name), 'utf8');
const der = (pem: string): string => pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');

export const TEST_ROOT = read('root.pem');
export const ROGUE_ROOT = read('rogue-root.pem');
const LEAF = read('leaf.pem');
const INTER = read('inter.pem');
const LEAF_KEY = read('leaf.pk8.pem');
const NOOID_LEAF = read('leaf-nooid.pem');
const NOOID_KEY = read('leaf-nooid.pk8.pem');
const ROGUE_KEY = read('rogue.pk8.pem');

export interface SignOptions {
  /** Chaîne x5c (par défaut : feuille, intermédiaire, racine de test). */
  chain?: string[];
  key?: string;
  alg?: string;
}

export const CHAINS = {
  valid: { chain: [der(LEAF), der(INTER), der(TEST_ROOT)], key: LEAF_KEY },
  /** Feuille sans l'extension Apple. */
  noOid: { chain: [der(NOOID_LEAF), der(INTER), der(TEST_ROOT)], key: NOOID_KEY },
  /** Racine auto-signée inconnue utilisée comme intermédiaire. */
  rogue: { chain: [der(ROGUE_ROOT), der(ROGUE_ROOT), der(ROGUE_ROOT)], key: ROGUE_KEY },
  /** Bonne chaîne, mauvaise clé de signature. */
  wrongKey: { chain: [der(LEAF), der(INTER), der(TEST_ROOT)], key: ROGUE_KEY },
} as const;

const b64url = (v: unknown): string => Buffer.from(JSON.stringify(v)).toString('base64url');

export function signJws(payload: Record<string, unknown>, opts: SignOptions = {}): string {
  const header = { alg: opts.alg ?? 'ES256', x5c: opts.chain ?? CHAINS.valid.chain };
  const input = `${b64url(header)}.${b64url(payload)}`;
  const signature = sign('sha256', Buffer.from(input), { key: opts.key ?? CHAINS.valid.key, dsaEncoding: 'ieee-p1363' });
  return `${input}.${signature.toString('base64url')}`;
}

/** Transaction d'abonnement StoreKit 2 (JWSTransactionDecodedPayload), dates en ms. */
export function transactionPayload(over: Record<string, unknown> = {}): Record<string, unknown> {
  const now = Date.parse('2026-11-11T10:00:00Z');
  return {
    transactionId: '2000000000000001',
    originalTransactionId: '2000000000000001',
    webOrderLineItemId: '2000000000000002',
    bundleId: 'app.blowy',
    productId: 'app.blowy.plus.yearly',
    subscriptionGroupIdentifier: '21000000',
    purchaseDate: now,
    originalPurchaseDate: now,
    expiresDate: now + 7 * 86_400_000,
    quantity: 1,
    type: 'Auto-Renewable Subscription',
    inAppOwnershipType: 'PURCHASED',
    signedDate: now,
    environment: 'Production',
    transactionReason: 'PURCHASE',
    storefront: 'FRA',
    storefrontId: '143442',
    price: 0,
    currency: 'EUR',
    offerType: 1,
    offerDiscountType: 'FREE_TRIAL',
    offerPeriod: 'P1W',
    ...over,
  };
}

export function renewalPayload(over: Record<string, unknown> = {}): Record<string, unknown> {
  const now = Date.parse('2026-11-11T10:00:00Z');
  return {
    originalTransactionId: '2000000000000001',
    autoRenewProductId: 'app.blowy.plus.yearly',
    productId: 'app.blowy.plus.yearly',
    autoRenewStatus: 1,
    isInBillingRetryPeriod: false,
    signedDate: now,
    environment: 'Production',
    recentSubscriptionStartDate: now,
    renewalDate: now + 7 * 86_400_000,
    ...over,
  };
}

/** Notification V2 (responseBodyV2DecodedPayload) contenant une transaction et un renouvellement signés. */
export function notificationPayload(
  type: string,
  subtype: string | null,
  signedTransactionInfo: string | null,
  signedRenewalInfo: string | null,
  over: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    notificationType: type,
    ...(subtype ? { subtype } : {}),
    notificationUUID: `uuid-${type}-${Math.random().toString(16).slice(2)}`,
    version: '2.0',
    signedDate: Date.parse('2026-11-11T10:00:00Z'),
    data: {
      appAppleId: 6700000000,
      bundleId: 'app.blowy',
      bundleVersion: '1',
      environment: 'Production',
      status: 1,
      ...(signedTransactionInfo ? { signedTransactionInfo } : {}),
      ...(signedRenewalInfo ? { signedRenewalInfo } : {}),
    },
    ...over,
  };
}
