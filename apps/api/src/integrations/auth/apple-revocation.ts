/**
 * Sign in with Apple : révocation des jetons quand un compte est supprimé (App Store Review Guideline 5.1.1(v),
 * TN3194 « Handling account deletions and revoking tokens for Sign in with Apple »).
 *
 * Supabase ne garde pas les jetons du fournisseur (« Provider tokens are intentionally not stored in your project's
 * database ») et, en connexion native (`signInWithIdToken`), il ne reçoit que le jeton d'identité d'Apple : il n'a
 * donc aucun jeton à révoquer. D'où ce flux, celui que décrit Apple :
 * 1. à la connexion sur iPhone, l'app envoie le code d'autorisation d'Apple (`credential.authorizationCode`,
 *    valable 5 minutes, une seule fois) à `POST /v1/me/apple-authorization` ;
 * 2. l'API l'échange (`POST https://appleid.apple.com/auth/token`, `grant_type=authorization_code`, sans
 *    `redirect_uri` en natif) contre un jeton de rafraîchissement, gardé dans `apple_tokens` ;
 * 3. à la suppression du compte (« Supprimer mon compte », modération, conservation des données), l'API appelle
 *    `POST https://appleid.apple.com/auth/revoke` (`token=<refresh_token>`, `token_type_hint=refresh_token`) AVANT de
 *    supprimer le compte. Un échec est journalisé et n'empêche jamais la suppression.
 *
 * `client_secret` : un JWT ES256 signé avec la clé « Sign in with Apple » (.p8) — en-tête `{ alg: 'ES256', kid }`,
 * revendications `{ iss: <Team ID>, iat, exp (≤ 6 mois), aud: 'https://appleid.apple.com', sub: <client_id> }`.
 * Il est refait à chaque appel, valable 5 minutes. Appels sous `application/x-www-form-urlencoded`.
 *
 * Ports : `AppleTokenClient` (Apple ; réel ou mémoire) et `AppleTokenStore` (base ; Supabase ou mémoire).
 */
import { createPrivateKey, sign, type KeyObject } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Db } from '../../persistence/database.types';
import type { MemoryDb } from '../../persistence/memory-db';
import { check } from '../../persistence/supabase';
import type { Clock } from '../../shared/clock';
import { CLOCK } from '../../shared/tokens';

export const APPLE_TOKEN_CLIENT = Symbol('APPLE_TOKEN_CLIENT');
export const APPLE_TOKEN_STORE = Symbol('APPLE_TOKEN_STORE');

export const APPLE_ID_ORIGIN = 'https://appleid.apple.com';
const SECRET_TTL_S = 300;
const REQUEST_TIMEOUT_MS = 10_000;

export interface AppleGrant {
  refreshToken: string;
  /** `client_id` qui a servi à l'échange (à réutiliser pour la révocation). */
  clientId: string;
}

/** Appels à Apple. `enabled` faux : rien n'est configuré, l'app n'a rien à envoyer et rien n'est révoqué. */
export interface AppleTokenClient {
  readonly enabled: boolean;
  /** Échange un code d'autorisation contre un jeton de rafraîchissement ; lève une erreur si Apple refuse. */
  exchange(authorizationCode: string): Promise<AppleGrant>;
  /** Révoque un jeton de rafraîchissement ; lève une erreur si Apple refuse (un jeton déjà révoqué rend 200). */
  revoke(grant: AppleGrant): Promise<void>;
}

export interface AppleTokenStore {
  save(userId: string, grant: AppleGrant, at: string): Promise<void>;
  find(userId: string): Promise<AppleGrant | null>;
  remove(userId: string): Promise<void>;
}

// ── Adaptateur réel ──────────────────────────────────────────────────────────

export interface AppleSignInConfig {
  /** Contenu PEM (PKCS#8) de la clé « Sign in with Apple ». */
  keyP8: string;
  keyId: string;
  teamId: string;
  clientId: string;
}

/** Envoi d'un formulaire (remplaçable dans les tests). */
export type AppleTransport = (url: string, form: Record<string, string>) => Promise<{ status: number; body: string }>;

const b64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url');

/** `client_secret` d'Apple : JWT ES256 (signature brute r‖s de 64 octets, comme l'exige JWS). */
export function appleClientSecret(key: KeyObject, cfg: Pick<AppleSignInConfig, 'keyId' | 'teamId' | 'clientId'>, now: Date): string {
  const iat = Math.floor(now.getTime() / 1000);
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: cfg.keyId }));
  const claims = b64url(JSON.stringify({ iss: cfg.teamId, iat, exp: iat + SECRET_TTL_S, aud: APPLE_ID_ORIGIN, sub: cfg.clientId }));
  const signature = sign('sha256', Buffer.from(`${head}.${claims}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${claims}.${b64url(signature)}`;
}

export const fetchTransport: AppleTransport = async (url, form) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form).toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: res.status, body: await res.text() };
};

/** Erreur d'Apple sans rien de secret (seulement le statut et le code `error` de la réponse). */
const appleError = (what: string, status: number, body: string): Error => {
  let code = '';
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'error' in parsed) code = String((parsed as { error: unknown }).error);
  } catch {
    /* corps illisible : le statut suffit */
  }
  return new Error(`${what} refusé par Apple (${status}${code ? `, ${code}` : ''})`);
};

export class AppleIdTokenClient implements AppleTokenClient {
  readonly enabled = true;
  private readonly key: KeyObject;

  constructor(
    private readonly cfg: AppleSignInConfig,
    private readonly clock: Clock,
    private readonly transport: AppleTransport = fetchTransport,
  ) {
    this.key = createPrivateKey(cfg.keyP8.replace(/\\n/g, '\n'));
  }

  private secret(clientId: string): string {
    return appleClientSecret(this.key, { ...this.cfg, clientId }, this.clock.now());
  }

  async exchange(authorizationCode: string): Promise<AppleGrant> {
    const clientId = this.cfg.clientId;
    const res = await this.transport(`${APPLE_ID_ORIGIN}/auth/token`, {
      client_id: clientId,
      client_secret: this.secret(clientId),
      code: authorizationCode,
      grant_type: 'authorization_code',
    });
    if (res.status !== 200) throw appleError('échange du code', res.status, res.body);
    const parsed = JSON.parse(res.body) as { refresh_token?: unknown };
    if (typeof parsed.refresh_token !== 'string' || parsed.refresh_token.length === 0) throw new Error('échange du code : pas de refresh_token dans la réponse d’Apple');
    return { refreshToken: parsed.refresh_token, clientId };
  }

  async revoke(grant: AppleGrant): Promise<void> {
    const res = await this.transport(`${APPLE_ID_ORIGIN}/auth/revoke`, {
      client_id: grant.clientId,
      client_secret: this.secret(grant.clientId),
      token: grant.refreshToken,
      token_type_hint: 'refresh_token',
    });
    if (res.status !== 200) throw appleError('révocation', res.status, res.body);
  }
}

/** Rien de configuré : l'app peut envoyer son code, il est ignoré ; la suppression ne révoque rien. */
export class DisabledAppleTokenClient implements AppleTokenClient {
  readonly enabled = false;
  async exchange(): Promise<AppleGrant> {
    throw new Error('révocation Apple non configurée');
  }
  async revoke(): Promise<void> {}
}

// ── Adaptateur mémoire ───────────────────────────────────────────────────────

/** Apple imité : un code « refuse… » est refusé ; les révocations sont notées (`revoked`) ; `failRevoke` simule une panne. */
export class MemoryAppleTokenClient implements AppleTokenClient {
  readonly enabled = true;
  readonly revoked: AppleGrant[] = [];
  failRevoke = false;

  constructor(private readonly clientId = 'app.blowy') {}

  async exchange(authorizationCode: string): Promise<AppleGrant> {
    if (authorizationCode.startsWith('refuse')) throw new Error('échange du code refusé par Apple (400, invalid_grant)');
    return { refreshToken: `memory-refresh:${authorizationCode}`, clientId: this.clientId };
  }

  async revoke(grant: AppleGrant): Promise<void> {
    if (this.failRevoke) throw new Error('révocation refusée par Apple (503)');
    this.revoked.push({ ...grant });
  }
}

// ── Dépôts ───────────────────────────────────────────────────────────────────

export class MemoryAppleTokenStore implements AppleTokenStore {
  constructor(private readonly db: MemoryDb) {}
  async save(userId: string, grant: AppleGrant, at: string): Promise<void> {
    if (this.db.deletedUsers.has(userId)) return;
    this.db.appleTokens.set(userId, { refreshToken: grant.refreshToken, clientId: grant.clientId, createdAt: at });
  }
  async find(userId: string): Promise<AppleGrant | null> {
    const row = this.db.appleTokens.get(userId);
    return row ? { refreshToken: row.refreshToken, clientId: row.clientId } : null;
  }
  async remove(userId: string): Promise<void> {
    this.db.appleTokens.delete(userId);
  }
}

export class SupabaseAppleTokenStore implements AppleTokenStore {
  constructor(private readonly client: Db) {}
  async save(userId: string, grant: AppleGrant, at: string): Promise<void> {
    const { error } = await this.client
      .from('apple_tokens')
      .upsert({ user_id: userId, refresh_token: grant.refreshToken, client_id: grant.clientId, updated_at: at }, { onConflict: 'user_id' });
    check(error, 'enregistrement du jeton Apple');
  }
  async find(userId: string): Promise<AppleGrant | null> {
    const { data, error } = await this.client.from('apple_tokens').select('refresh_token, client_id').eq('user_id', userId).maybeSingle();
    check(error, 'lecture du jeton Apple');
    return data ? { refreshToken: data.refresh_token, clientId: data.client_id } : null;
  }
  async remove(userId: string): Promise<void> {
    const { error } = await this.client.from('apple_tokens').delete().eq('user_id', userId);
    check(error, 'suppression du jeton Apple');
  }
}

// ── Cas d'usage ──────────────────────────────────────────────────────────────

/** Ce que l'API fait des jetons d'Apple : les garder à la connexion, les révoquer à la suppression. */
@Injectable()
export class AppleRevocation {
  private readonly logger = new Logger('AppleRevocation');

  constructor(
    @Inject(APPLE_TOKEN_CLIENT) private readonly apple: AppleTokenClient,
    @Inject(APPLE_TOKEN_STORE) private readonly store: AppleTokenStore,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * Code d'autorisation reçu de l'app : échangé et gardé (le dernier remplace le précédent). `skipped` si la
   * révocation n'est pas configurée. Une erreur d'Apple remonte (l'app réessaiera à la prochaine connexion).
   */
  async remember(userId: string, authorizationCode: string): Promise<'stored' | 'skipped'> {
    if (!this.apple.enabled) return 'skipped';
    const grant = await this.apple.exchange(authorizationCode);
    await this.store.save(userId, grant, this.clock.now().toISOString());
    return 'stored';
  }

  /**
   * Avant la suppression d'un compte : révoque le jeton d'Apple s'il y en a un, puis l'oublie. Ne lève jamais :
   * un échec (Apple injoignable, jeton refusé, base) est journalisé, sans le jeton, et la suppression continue.
   */
  async revokeFor(userId: string): Promise<void> {
    try {
      const grant = await this.store.find(userId);
      if (!grant) return;
      if (this.apple.enabled) await this.apple.revoke(grant);
      await this.store.remove(userId);
    } catch (err) {
      this.logger.warn(`révocation Apple impossible, suppression poursuivie : ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
