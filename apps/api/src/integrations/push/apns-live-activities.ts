/**
 * Adaptateur réel du port `LiveActivityPusher` : APNs en HTTP/2, authentification par jeton (« Establishing a
 * token-based connection to APNs », Apple) :
 * - JWT ES256, en-tête `{ alg: 'ES256', kid }`, revendications `{ iss: <Team ID>, iat }`, signé avec la clé `.p8` ;
 *   refait toutes les 40 min (Apple : pas plus d'une fois par 20 min, au moins une fois par heure) ;
 * - `POST /3/device/<jeton>` sur api.push.apple.com (ou api.sandbox.push.apple.com pour les builds de développement) ;
 * - `apns-push-type: liveactivity`, `apns-topic: <bundle id>.push-type.liveactivity`, `apns-priority: 5 | 10`.
 * Réponses (« Handling notification responses from APNs ») : 200 = envoyé ; 410 ou BadDeviceToken /
 * DeviceTokenNotForTopic = jeton mort (désactivé par l'appelant) ; 403 ExpiredProviderToken = JWT refait au prochain
 * envoi. Une seule session HTTP/2 réutilisée, rouverte si elle se ferme.
 * La clé, son identifiant et l'identifiant d'équipe viennent seulement de `apps/api/.env` (jamais journalisés).
 */
import { createPrivateKey, sign, type KeyObject } from 'node:crypto';
import { type ClientHttp2Session, connect } from 'node:http2';
import { Logger } from '@nestjs/common';
import { DEAD_TOKEN_REASONS, type LiveActivityPusher, type LiveActivityResult, type LiveActivitySend } from './live-activity';

export const APNS_HOSTS = { production: 'https://api.push.apple.com', sandbox: 'https://api.sandbox.push.apple.com' } as const;
const JWT_TTL_MS = 40 * 60_000;
const REQUEST_TIMEOUT_MS = 10_000;

export interface ApnsConfig {
  /** Contenu de la clé `.p8` (PEM PKCS#8). */
  keyP8: string;
  keyId: string;
  teamId: string;
  bundleId: string;
  environment: 'production' | 'sandbox';
}

/** Envoi HTTP brut (remplaçable dans les tests). */
export type ApnsTransport = (req: { origin: string; path: string; headers: Record<string, string>; body: string }) => Promise<{ status: number; body: string }>;

const b64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url');

/** JWT du fournisseur, signé ES256 (signature brute r‖s de 64 octets, comme l'exige JWS). */
export function apnsProviderToken(key: KeyObject, keyId: string, teamId: string, now: Date): string {
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const claims = b64url(JSON.stringify({ iss: teamId, iat: Math.floor(now.getTime() / 1000) }));
  const signature = sign('sha256', Buffer.from(`${head}.${claims}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${claims}.${b64url(signature)}`;
}

/** Transport HTTP/2 par défaut : une session par origine, réutilisée. */
export function http2Transport(): ApnsTransport & { close(): void } {
  const sessions = new Map<string, ClientHttp2Session>();
  const sessionFor = (origin: string): ClientHttp2Session => {
    const existing = sessions.get(origin);
    if (existing && !existing.closed && !existing.destroyed) return existing;
    const s = connect(origin);
    s.on('error', () => sessions.delete(origin));
    s.on('close', () => sessions.delete(origin));
    s.unref();
    sessions.set(origin, s);
    return s;
  };
  const send: ApnsTransport = ({ origin, path, headers, body }) =>
    new Promise((resolve, reject) => {
      const req = sessionFor(origin).request({ ':method': 'POST', ':path': path, ...headers, 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)) });
      let status = 0;
      let data = '';
      req.setEncoding('utf8');
      req.setTimeout(REQUEST_TIMEOUT_MS, () => req.close());
      req.on('response', (h) => (status = Number(h[':status'] ?? 0)));
      req.on('data', (chunk: string) => (data += chunk));
      req.on('end', () => resolve({ status, body: data }));
      req.on('error', reject);
      req.end(body);
    });
  return Object.assign(send, {
    close: () => {
      for (const s of sessions.values()) s.close();
      sessions.clear();
    },
  });
}

export class ApnsLiveActivities implements LiveActivityPusher {
  readonly enabled = true;
  private readonly logger = new Logger('ActivitésEnDirect');
  private readonly key: KeyObject;
  private jwt: { token: string; at: number } | null = null;

  constructor(
    private readonly config: ApnsConfig,
    private readonly now: () => Date = () => new Date(),
    private readonly transport: ApnsTransport = http2Transport(),
    private readonly origin: string = APNS_HOSTS[config.environment],
  ) {
    // Les hébergeurs n'acceptent pas toujours les retours à la ligne : « \n » littéraux acceptés.
    this.key = createPrivateKey(config.keyP8.replace(/\\n/g, '\n'));
  }

  private providerToken(): string {
    const at = this.now().getTime();
    if (!this.jwt || at - this.jwt.at >= JWT_TTL_MS) this.jwt = { token: apnsProviderToken(this.key, this.config.keyId, this.config.teamId, this.now()), at };
    return this.jwt.token;
  }

  async send(push: LiveActivitySend): Promise<LiveActivityResult> {
    if (!/^[0-9a-fA-F]{16,200}$/.test(push.token)) return { ok: false, status: 400, reason: 'BadDeviceToken', invalidToken: true };
    try {
      const res = await this.transport({
        origin: this.origin,
        path: `/3/device/${push.token}`,
        headers: {
          authorization: `bearer ${this.providerToken()}`,
          'apns-push-type': 'liveactivity',
          'apns-topic': `${this.config.bundleId}.push-type.liveactivity`,
          'apns-priority': String(push.priority),
        },
        body: JSON.stringify(push.payload),
      });
      if (res.status === 200) return { ok: true };
      let reason = '';
      try {
        reason = String((JSON.parse(res.body) as { reason?: unknown }).reason ?? '');
      } catch {
        reason = '';
      }
      if (reason === 'ExpiredProviderToken' || reason === 'InvalidProviderToken') this.jwt = null;
      const invalidToken = res.status === 410 || DEAD_TOKEN_REASONS.has(reason);
      if (!invalidToken) this.logger.warn(`APNs a refusé une activité en direct : ${res.status} ${reason}`);
      return { ok: false, status: res.status, reason, invalidToken };
    } catch (err) {
      this.logger.warn(`APNs injoignable : ${err instanceof Error ? err.message : 'erreur'}`);
      return { ok: false, status: 0, reason: 'network', invalidToken: false };
    }
  }
}
