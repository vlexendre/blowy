/**
 * Transport HTTP minimal typé sur @blowy/api-contract (en attendant @blowy/api-client de l'agent C,
 * absent à la date du 2026-11-01). Bascule : remplacer `createHttp` par le client de C dans
 * src/core/providers/services.tsx — les repositories n'importent que `Http` / `ApiCallError`.
 *
 *  - Authorization: Bearer <jeton SecureStore> ;
 *  - Idempotency-Key pour toute commande (commandId UUID conservé au retry) ;
 *  - erreurs structurées {code,message,detailsSafe,requestId,retryable} → ApiCallError ;
 *  - 404 sur une route inconnue → code `NOT_IMPLEMENTED` côté client (endpoint pas encore livré),
 *    pour afficher un état « indisponible » honnête au lieu d'une erreur générique.
 */
import { ApiErrorSchema, IDEMPOTENCY_HEADER, type ErrorCode } from '@blowy/api-contract';
import type { z } from 'zod';

export type ClientErrorCode = ErrorCode | 'NETWORK' | 'NOT_IMPLEMENTED' | 'BAD_RESPONSE';

export class ApiCallError extends Error {
  constructor(
    readonly code: ClientErrorCode,
    message: string,
    readonly status: number,
    readonly retryable: boolean,
    readonly requestId: string | null = null,
    readonly detailsSafe: Record<string, unknown> | undefined = undefined,
  ) {
    super(message);
  }
}

export const isUnavailable = (e: unknown): boolean => e instanceof ApiCallError && (e.code === 'NOT_IMPLEMENTED' || e.code === 'NOT_CONFIGURED');
export const isNetworkError = (e: unknown): boolean => e instanceof ApiCallError && e.code === 'NETWORK';

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  commandId?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface Http {
  request<T>(opts: RequestOptions, schema: z.ZodType<T>): Promise<T>;
  /** Variante sans schéma (204, ou transport pour la feature achats). */
  raw(opts: RequestOptions): Promise<unknown>;
}

export interface HttpDeps {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onUnauthenticated?: () => void;
  fetchImpl?: typeof fetch;
}

export function createHttp({ baseUrl, getToken, onUnauthenticated, fetchImpl = fetch }: HttpDeps): Http {
  const raw = async (opts: RequestOptions): Promise<unknown> => {
    const token = await getToken();
    const headers: Record<string, string> = { accept: 'application/json', ...opts.headers };
    if (opts.body !== undefined) headers['content-type'] = 'application/json';
    if (token) headers.authorization = `Bearer ${token}`;
    if (opts.commandId) headers[IDEMPOTENCY_HEADER] = opts.commandId;
    let res: Response;
    try {
      res = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${opts.path}`, {
        method: opts.method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: opts.signal,
      });
    } catch (e) {
      throw new ApiCallError('NETWORK', e instanceof Error ? e.message : 'network', 0, true);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    const json: unknown = text ? safeJson(text) : null;
    if (res.ok) return json;
    const parsed = ApiErrorSchema.safeParse(json);
    if (res.status === 401) onUnauthenticated?.();
    if (parsed.success) {
      const code = isRouteMissing(parsed.data.code, parsed.data.message, parsed.data.detailsSafe) ? 'NOT_IMPLEMENTED' : (parsed.data.code as ErrorCode);
      throw new ApiCallError(code, parsed.data.message, res.status, parsed.data.retryable, parsed.data.requestId, parsed.data.detailsSafe);
    }
    if (res.status === 404 || res.status === 501) throw new ApiCallError('NOT_IMPLEMENTED', `Route ${opts.method} ${opts.path} indisponible`, res.status, false);
    throw new ApiCallError(res.status >= 500 ? 'INTERNAL' : 'BAD_RESPONSE', `HTTP ${res.status}`, res.status, res.status >= 500);
  };

  return {
    raw,
    async request<T>(opts: RequestOptions, schema: z.ZodType<T>): Promise<T> {
      const json = await raw(opts);
      const r = schema.safeParse(json);
      if (!r.success) throw new ApiCallError('BAD_RESPONSE', `Réponse hors contrat ${opts.method} ${opts.path}`, 200, false);
      return r.data;
    },
  };
}

/**
 * Route absente côté API : Nest lève NotFoundException « Cannot GET /v1/... » (sans detailsSafe).
 * Demande à C : renvoyer detailsSafe.reason = 'ROUTE_NOT_FOUND' pour ne plus dépendre du message.
 */
export const isRouteMissing = (code: string, message: string, details?: Record<string, unknown>): boolean =>
  code === 'NOT_FOUND' && (details?.reason === 'ROUTE_NOT_FOUND' || /^Cannot (GET|POST|PUT|PATCH|DELETE) /.test(message));

const safeJson = (s: string): unknown => {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
};
