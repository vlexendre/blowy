/**
 * Adaptateur réel du port `Billing` pour Apple : vérifie localement les données signées de l'App Store
 * (StoreKit 2 et App Store Server Notifications V2), sans intermédiaire ni appel réseau.
 *
 * Chaque JWS porte dans son en-tête `x5c` la chaîne feuille → intermédiaire → racine (doc Apple « JWSDecodedHeader »).
 * On vérifie, comme la bibliothèque officielle d'Apple (app-store-server-library, `SignedDataVerifier`) :
 * - `alg` = ES256 et exactement 3 certificats ;
 * - l'intermédiaire est signé par une racine de confiance (Apple Root CA - G3, embarquée) et porte l'extension
 *   1.2.840.113635.100.6.2.1 (Apple Worldwide Developer Relations) ;
 * - la feuille est signée par l'intermédiaire et porte l'extension 1.2.840.113635.100.6.11.1 ;
 * - les certificats sont valides à la date de signature (`signedDate`) ;
 * - la signature ES256 du JWS avec la clé de la feuille ;
 * - puis le bundle, l'Apple ID de l'app (notifications de production) et l'environnement.
 * Différence assumée : pas de vérification OCSP en ligne (la bibliothèque d'Apple la rend optionnelle).
 */
import { X509Certificate, verify as verifySignature } from 'node:crypto';
import { type AppleEnvironment, type Billing, BillingVerificationError, type VerifiedNotification, type VerifiedRenewal, type VerifiedTransaction } from '../../ports';
import { APPLE_ROOT_CA_G3_PEM } from './apple-root-ca';

/** Extensions qu'Apple met dans ses certificats (encodage DER de l'OID, précédé de son en-tête 06 0A). */
const OID_LEAF = Buffer.from([0x06, 0x0a, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x63, 0x64, 0x06, 0x0b, 0x01]); // 1.2.840.113635.100.6.11.1
const OID_INTERMEDIATE = Buffer.from([0x06, 0x0a, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x63, 0x64, 0x06, 0x02, 0x01]); // 1.2.840.113635.100.6.2.1

export interface AppleBillingOptions {
  bundleId: string;
  /** Vérifié sur les notifications de production (obligatoire en production). */
  appAppleId: number | null;
  acceptSandbox: boolean;
  /** Racines de confiance (PEM). Par défaut : Apple Root CA - G3. Les tests passent leur propre racine. */
  rootCertificates?: readonly string[];
}

type Json = Record<string, unknown>;

const fail = (reason: string): never => {
  throw new BillingVerificationError(reason);
};

const b64urlJson = (part: string): Json => {
  try {
    const value: unknown = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Json;
  } catch {
    /* plus bas */
  }
  return fail('JWS illisible');
};

const str = (o: Json, k: string): string | null => (typeof o[k] === 'string' ? (o[k] as string) : null);
const num = (o: Json, k: string): number | null => (typeof o[k] === 'number' && Number.isFinite(o[k]) ? (o[k] as number) : null);
const reqStr = (o: Json, k: string): string => str(o, k) ?? fail(`champ manquant : ${k}`);
const reqNum = (o: Json, k: string): number => num(o, k) ?? fail(`champ manquant : ${k}`);
const ENVIRONMENTS: readonly AppleEnvironment[] = ['Production', 'Sandbox', 'Xcode', 'LocalTesting'];
const envOf = (v: string | null): AppleEnvironment | null => (v && (ENVIRONMENTS as readonly string[]).includes(v) ? (v as AppleEnvironment) : null);

/** Lecture des champs d'une transaction décodée (aussi utilisée par l'adaptateur mémoire). */
export function readTransaction(p: Json): VerifiedTransaction {
  const transactionId = str(p, 'transactionId') ?? String(num(p, 'transactionId') ?? fail('champ manquant : transactionId'));
  return {
    environment: envOf(str(p, 'environment')) ?? fail('environnement inconnu'),
    bundleId: reqStr(p, 'bundleId'),
    originalTransactionId: str(p, 'originalTransactionId') ?? transactionId,
    transactionId,
    productId: reqStr(p, 'productId'),
    type: str(p, 'type') ?? 'Auto-Renewable Subscription',
    purchaseDate: reqNum(p, 'purchaseDate'),
    expiresDate: num(p, 'expiresDate'),
    offerType: num(p, 'offerType'),
    offerDiscountType: str(p, 'offerDiscountType'),
    revocationDate: num(p, 'revocationDate'),
    appAccountToken: str(p, 'appAccountToken'),
    signedDate: reqNum(p, 'signedDate'),
  };
}

export function readRenewal(p: Json): VerifiedRenewal {
  return {
    environment: envOf(str(p, 'environment')) ?? fail('environnement inconnu'),
    originalTransactionId: reqStr(p, 'originalTransactionId'),
    autoRenewStatus: num(p, 'autoRenewStatus') === 1,
    autoRenewProductId: str(p, 'autoRenewProductId'),
    isInBillingRetryPeriod: p.isInBillingRetryPeriod === true,
    gracePeriodExpiresDate: num(p, 'gracePeriodExpiresDate'),
    signedDate: reqNum(p, 'signedDate'),
  };
}

export class AppleBilling implements Billing {
  readonly store = 'apple' as const;
  private readonly roots: X509Certificate[];

  constructor(private readonly options: AppleBillingOptions) {
    this.roots = (options.rootCertificates ?? [APPLE_ROOT_CA_G3_PEM]).map((pem) => new X509Certificate(pem));
    if (this.roots.length === 0) throw new Error('aucune autorité racine Apple configurée');
  }

  async verifyTransaction(jws: string): Promise<VerifiedTransaction> {
    const t = readTransaction(this.decodeVerified(jws));
    this.checkEnvironment(t.environment);
    if (t.bundleId !== this.options.bundleId) fail('bundle inattendu');
    return t;
  }

  async verifyRenewal(jws: string): Promise<VerifiedRenewal> {
    const r = readRenewal(this.decodeVerified(jws));
    this.checkEnvironment(r.environment);
    return r;
  }

  async verifyNotification(signedPayload: string): Promise<VerifiedNotification> {
    const p = this.decodeVerified(signedPayload);
    const data = (p.data && typeof p.data === 'object' ? p.data : null) as Json | null;
    const environment = data ? envOf(str(data, 'environment')) : null;
    if (data) {
      if (str(data, 'bundleId') !== this.options.bundleId) fail('bundle inattendu');
      if (environment === 'Production' && this.options.appAppleId !== null && num(data, 'appAppleId') !== this.options.appAppleId) fail('app inattendue');
      this.checkEnvironment(environment ?? fail('environnement inconnu'));
    }
    const signedTransaction = data ? str(data, 'signedTransactionInfo') : null;
    const signedRenewal = data ? str(data, 'signedRenewalInfo') : null;
    const status = data ? num(data, 'status') : null;
    return {
      notificationUUID: reqStr(p, 'notificationUUID'),
      notificationType: reqStr(p, 'notificationType'),
      subtype: str(p, 'subtype'),
      signedDate: reqNum(p, 'signedDate'),
      environment,
      status: status !== null && status >= 1 && status <= 5 ? (status as 1 | 2 | 3 | 4 | 5) : null,
      transaction: signedTransaction ? await this.verifyTransaction(signedTransaction) : null,
      renewal: signedRenewal ? await this.verifyRenewal(signedRenewal) : null,
    };
  }

  private checkEnvironment(env: AppleEnvironment): void {
    if (env === 'Production') return;
    // Xcode et LocalTesting sont signés par un certificat local : jamais acceptés par le serveur.
    if (env === 'Sandbox' && this.options.acceptSandbox) return;
    fail(`environnement refusé : ${env}`);
  }

  /** Vérifie la chaîne et la signature d'un JWS compact, puis rend sa charge utile. */
  private decodeVerified(jws: string): Json {
    const parts = jws.split('.');
    if (parts.length !== 3 || parts.some((x) => x.length === 0)) fail('JWS mal formé');
    const [h, p, s] = parts as [string, string, string];
    const header = b64urlJson(h);
    const payload = b64urlJson(p);
    if (header.alg !== 'ES256') fail('algorithme refusé');
    const x5c = header.x5c;
    if (!Array.isArray(x5c) || x5c.length !== 3 || !x5c.every((c) => typeof c === 'string')) fail('chaîne de certificats absente ou incomplète');
    const [leaf, intermediate] = (x5c as string[]).slice(0, 2).map((der) => {
      try {
        return new X509Certificate(Buffer.from(der, 'base64'));
      } catch {
        return fail('certificat illisible');
      }
    }) as [X509Certificate, X509Certificate];

    const signedMs = num(payload, 'signedDate') ?? num(payload, 'receiptCreationDate') ?? fail('date de signature absente');
    this.verifyChain(leaf, intermediate, new Date(signedMs));

    const signature = Buffer.from(s, 'base64url');
    const ok = verifySignature('sha256', Buffer.from(`${h}.${p}`), { key: leaf.publicKey, dsaEncoding: 'ieee-p1363' }, signature);
    if (!ok) fail('signature invalide');
    return payload;
  }

  private verifyChain(leaf: X509Certificate, intermediate: X509Certificate, at: Date): void {
    const root = this.roots.find((r) => intermediate.checkIssued(r) && intermediate.verify(r.publicKey));
    if (!root) fail('chaîne non reliée à une autorité racine Apple');
    if (!intermediate.ca) fail('intermédiaire non autorité');
    if (!leaf.checkIssued(intermediate) || !leaf.verify(intermediate.publicKey)) fail('feuille non signée par l’intermédiaire');
    if (!hasExtension(intermediate, OID_INTERMEDIATE)) fail('intermédiaire sans extension Apple WWDR');
    if (!hasExtension(leaf, OID_LEAF)) fail('feuille sans extension Apple');
    for (const c of [leaf, intermediate, root as X509Certificate]) {
      if (at < new Date(c.validFrom) || at > new Date(c.validTo)) fail('certificat hors de sa période de validité');
    }
  }
}

/** Présence d'une extension, par son OID encodé (comme `check_oid` de la bibliothèque d'Apple). */
const hasExtension = (cert: X509Certificate, encodedOid: Buffer): boolean => cert.raw.includes(encodedOid);

