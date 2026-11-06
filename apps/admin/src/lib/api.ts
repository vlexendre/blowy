/**
 * Client serveur de l'API admin (BFF). Les jetons staff vivent dans des cookies HttpOnly posés
 * par l'admin ; ils sont transmis à l'API en en-têtes depuis le serveur Next uniquement.
 * Aucune écriture en base ni règle métier ici : l'API autorise, valide et audite.
 */
import { cookies, headers } from 'next/headers';
import { API_URL, COOKIE, VENUE_COOKIE } from './config';

export type ApiFailureKind = 'unauthenticated' | 'refused' | 'unwired' | 'notFound' | 'error' | 'stepup' | 'invalid';
export type ApiResult<T> = { ok: true; data: T } | { ok: false; kind: ApiFailureKind; status: number; message: string; requestId?: string; reason?: string };

interface ApiErrorBody {
  code?: string;
  message?: string;
  requestId?: string;
  detailsSafe?: { reason?: string };
}

function failure(status: number, body: ApiErrorBody | null): Exclude<ApiResult<never>, { ok: true }> {
  const reason = body?.detailsSafe?.reason;
  const kind: ApiFailureKind =
    reason === 'STEP_UP_REQUIRED' ? 'stepup'
      : status === 401 ? 'unauthenticated'
        : status === 403 ? 'refused'
          : status === 501 ? 'unwired'
            : status === 404 ? 'notFound'
              : status === 400 || status === 409 || status === 412 ? 'invalid'
                : 'error';
  return { ok: false, kind, status, message: body?.message ?? `Erreur ${status}`, ...(body?.requestId ? { requestId: body.requestId } : {}), ...(reason ? { reason } : {}) };
}

/** Espace authentifié : `staff` (back-office) ou `venue` (lieu partenaire) — cookies et en-têtes distincts. */
export type ApiRealm = 'staff' | 'venue';
const REALM = {
  staff: { cookies: COOKIE, session: 'x-blowy-staff-session', csrf: 'x-blowy-csrf' },
  venue: { cookies: VENUE_COOKIE, session: 'x-blowy-venue-session', csrf: 'x-blowy-venue-csrf' },
} as const;

export async function api<T>(method: string, path: string, opts: { body?: unknown; commandId?: string; extraHeaders?: Record<string, string>; realm?: ApiRealm } = {}): Promise<ApiResult<T>> {
  const jar = await cookies();
  const realm = REALM[opts.realm ?? 'staff'];
  const h: Record<string, string> = { accept: 'application/json', ...opts.extraHeaders };
  const session = jar.get(realm.cookies.session)?.value;
  const csrf = jar.get(realm.cookies.csrf)?.value;
  if (session) h[realm.session] = session;
  if (method !== 'GET') {
    if (csrf) h[realm.csrf] = csrf;
    if (opts.commandId) h['idempotency-key'] = opts.commandId;
    h['content-type'] = 'application/json';
  }
  const rid = (await headers()).get('x-request-id');
  if (rid) h['x-request-id'] = rid;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers: h, body: opts.body === undefined ? undefined : JSON.stringify(opts.body), cache: 'no-store' });
  } catch {
    return { ok: false, kind: 'error', status: 0, message: 'API injoignable' };
  }
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) return failure(res.status, body as ApiErrorBody | null);
  return { ok: true, data: body as T };
}

export const apiGet = <T>(path: string) => api<T>('GET', path);
export const venueGet = <T>(path: string) => api<T>('GET', path, { realm: 'venue' });
