/**
 * Web Push « tickle » (RFC 8030 + VAPID RFC 8292) SANS contenu : aucune donnée (ni prénom, ni lieu,
 * ni position) ne transite par le service de push du navigateur ; le service worker de la page
 * affiche une notification neutre et ouvre la page à jour. Pas de chiffrement de charge (RFC 8291)
 * puisqu'il n'y a pas de charge → aucune clé d'abonnement stockée.
 * JWT VAPID ES256 signé avec `node:crypto` (aucune dépendance ajoutée).
 */
import { createPrivateKey, sign, type KeyObject } from 'node:crypto';
import type { GuardianPushSender } from '../application/ports/safety.ports.js';
import type { Clock } from '../../../shared/application/clock.js';

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');

/** Clé privée VAPID (scalaire 32 o base64url + clé publique brute 65 o) → KeyObject P-256 (JWK). */
export function vapidKey(publicKeyB64u: string, privateKeyB64u: string): KeyObject {
  const pub = Buffer.from(publicKeyB64u, 'base64url');
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error('Clé publique VAPID invalide (65 octets non compressés attendus)');
  return createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: privateKeyB64u, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: 'jwk' });
}

/** En-tête `Authorization: vapid t=<JWT>, k=<clé publique>` pour l'origine de l'endpoint. */
export function vapidAuthorization(endpoint: string, key: KeyObject, publicKeyB64u: string, subject: string, nowSec: number): string {
  const aud = new URL(endpoint).origin;
  const header = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = b64u(JSON.stringify({ aud, exp: nowSec + 12 * 3600, sub: subject }));
  const sig = sign('sha256', Buffer.from(`${header}.${claims}`), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${header}.${claims}.${b64u(sig)}, k=${publicKeyB64u}`;
}

export class VapidPushSender implements GuardianPushSender {
  readonly configured = true;
  private readonly key: KeyObject;
  constructor(
    private readonly publicKey: string,
    privateKey: string,
    private readonly subject: string,
    private readonly clock: Clock,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.key = vapidKey(publicKey, privateKey);
  }
  async send(endpoint: string): Promise<'SENT' | 'GONE' | 'FAILED'> {
    try {
      const res = await this.fetchImpl(endpoint, {
        method: 'POST',
        headers: { TTL: '600', Urgency: 'high', 'Content-Length': '0', Authorization: vapidAuthorization(endpoint, this.key, this.publicKey, this.subject, Math.floor(this.clock.now().getTime() / 1000)) },
        signal: AbortSignal.timeout(5_000),
      });
      if (res.status === 404 || res.status === 410) return 'GONE';
      return res.ok ? 'SENT' : 'FAILED';
    } catch {
      return 'FAILED';
    }
  }
}

/** Pas de paire VAPID : abonnement refusé (501), aucune notification (la page reste consultable). */
export class DisabledPushSender implements GuardianPushSender {
  readonly configured = false;
  async send(): Promise<'FAILED'> {
    return 'FAILED';
  }
}

/** Tests / local : enregistre les endpoints notifiés (aucun appel réseau). */
export class RecordingPushSender implements GuardianPushSender {
  readonly configured = true;
  readonly sent: string[] = [];
  async send(endpoint: string): Promise<'SENT' | 'GONE'> {
    this.sent.push(endpoint);
    return endpoint.includes('gone') ? 'GONE' : 'SENT';
  }
}
