/**
 * Adaptateur mémoire du port `Billing` (développement local et tests) : les « JWS » sont des objets JSON
 * encodés (`memory.<base64url>`), sans signature. Jamais utilisé hors de `BLOWY_ADAPTERS=memory`.
 * Les champs et contrôles sont ceux de l'adaptateur réel (mêmes lecteurs de champs, même bundle).
 */
import { type Billing, BillingVerificationError, type VerifiedNotification, type VerifiedRenewal, type VerifiedTransaction } from '../ports';
import { readRenewal, readTransaction } from './apple/app-store-verifier';

const PREFIX = 'memory.';

/** Fabrique un « JWS » mémoire (tests, monde de démo). */
export const memoryJws = (payload: Record<string, unknown>): string => PREFIX + Buffer.from(JSON.stringify(payload)).toString('base64url');

function decode(token: string): Record<string, unknown> {
  if (!token.startsWith(PREFIX)) throw new BillingVerificationError('jeton mémoire attendu');
  try {
    const value: unknown = JSON.parse(Buffer.from(token.slice(PREFIX.length), 'base64url').toString('utf8'));
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  } catch {
    /* plus bas */
  }
  throw new BillingVerificationError('jeton mémoire illisible');
}

export class MemoryBilling implements Billing {
  readonly store = 'apple' as const;

  constructor(private readonly bundleId: string) {}

  async verifyTransaction(jws: string): Promise<VerifiedTransaction> {
    const t = readTransaction(decode(jws));
    if (t.bundleId !== this.bundleId) throw new BillingVerificationError('bundle inattendu');
    return t;
  }

  async verifyRenewal(jws: string): Promise<VerifiedRenewal> {
    return readRenewal(decode(jws));
  }

  async verifyNotification(signedPayload: string): Promise<VerifiedNotification> {
    const p = decode(signedPayload);
    const data = (p.data ?? null) as Record<string, unknown> | null;
    if (data && data.bundleId !== this.bundleId) throw new BillingVerificationError('bundle inattendu');
    const tx = data && typeof data.signedTransactionInfo === 'string' ? await this.verifyTransaction(data.signedTransactionInfo) : null;
    const rn = data && typeof data.signedRenewalInfo === 'string' ? await this.verifyRenewal(data.signedRenewalInfo) : null;
    const status = data && typeof data.status === 'number' && data.status >= 1 && data.status <= 5 ? (data.status as 1 | 2 | 3 | 4 | 5) : null;
    if (typeof p.notificationUUID !== 'string' || typeof p.notificationType !== 'string' || typeof p.signedDate !== 'number') {
      throw new BillingVerificationError('notification incomplète');
    }
    return {
      notificationUUID: p.notificationUUID,
      notificationType: p.notificationType,
      subtype: typeof p.subtype === 'string' ? p.subtype : null,
      signedDate: p.signedDate,
      environment: data && typeof data.environment === 'string' ? (data.environment as VerifiedNotification['environment']) : null,
      status,
      transaction: tx,
      renewal: rn,
    };
  }
}
