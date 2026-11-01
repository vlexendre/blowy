/** Appels serveur à l'API publique (aucune donnée privée, aucun jeton utilisateur). */
import { API_URL } from './config';

export type PublicResult<T> = { ok: true; data: T } | { ok: false; status: number; reason?: string; message?: string };

export async function publicApi<T>(method: 'GET' | 'POST', path: string, opts: { body?: unknown; visitor?: string; forwardedFor?: string | null } = {}): Promise<PublicResult<T>> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.visitor) headers['x-blowy-visitor'] = opts.visitor;
  if (opts.forwardedFor) headers['x-forwarded-for'] = opts.forwardedFor;
  try {
    const res = await fetch(`${API_URL}${path}`, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body), cache: 'no-store' });
    const text = await res.text();
    const json = text ? (JSON.parse(text) as unknown) : null;
    if (!res.ok) {
      const b = json as { message?: string; detailsSafe?: { reason?: string } } | null;
      return { ok: false, status: res.status, ...(b?.detailsSafe?.reason ? { reason: b.detailsSafe.reason } : {}), ...(b?.message ? { message: b.message } : {}) };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0 };
  }
}
