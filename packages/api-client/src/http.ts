/**
 * Transport HTTP typé (fetch + Zod). Aucune dépendance serveur : utilisable par mobile, web, admin.
 * Chaque réponse est validée par son schéma de contrat ; une erreur API devient `BlowyApiError`.
 */
import { ApiErrorSchema, IDEMPOTENCY_HEADER, type ApiError } from '@blowy/api-contract';
import type { z } from 'zod';

export class BlowyApiError extends Error {
  constructor(
    readonly status: number,
    readonly error: ApiError,
  ) {
    super(error.message);
    this.name = 'BlowyApiError';
  }
  get code() {
    return this.error.code;
  }
  get retryable() {
    return this.error.retryable;
  }
}

export interface ClientOptions {
  baseUrl: string;
  /** Jeton de session (SecureStore côté mobile). */
  getToken?: () => string | null | Promise<string | null>;
  fetch?: typeof fetch;
  /** Génère les commandId (UUID). Par défaut crypto.randomUUID. */
  newCommandId?: () => string;
  timeoutMs?: number;
}

export interface CommandOptions {
  /** commandId stable à réutiliser pour un renvoi (file hors ligne). */
  commandId?: string;
}

export class HttpTransport {
  private readonly f: typeof fetch;
  constructor(private readonly o: ClientOptions) {
    this.f = o.fetch ?? globalThis.fetch.bind(globalThis);
  }

  newCommandId(): string {
    return this.o.newCommandId?.() ?? globalThis.crypto.randomUUID();
  }

  async request<S extends z.ZodType>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, schema: S | null, body?: unknown, cmd?: CommandOptions): Promise<z.infer<S>> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    const token = await this.o.getToken?.();
    if (token) headers.authorization = `Bearer ${token}`;
    if (method !== 'GET') headers[IDEMPOTENCY_HEADER] = cmd?.commandId ?? this.newCommandId();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.o.timeoutMs ?? 15_000);
    let res: Response;
    try {
      res = await this.f(`${this.o.baseUrl.replace(/\/$/, '')}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal });
    } catch {
      throw new BlowyApiError(0, { code: 'PROVIDER_UNAVAILABLE', message: 'Réseau indisponible', requestId: 'client', retryable: true });
    } finally {
      clearTimeout(timer);
    }
    const text = await res.text();
    const json: unknown = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const parsed = ApiErrorSchema.safeParse(json);
      throw new BlowyApiError(res.status, parsed.success ? parsed.data : { code: 'INTERNAL', message: `HTTP ${res.status}`, requestId: res.headers.get('x-request-id') ?? 'unknown', retryable: res.status >= 500 });
    }
    return (schema ? schema.parse(json) : json) as z.infer<S>;
  }
}
