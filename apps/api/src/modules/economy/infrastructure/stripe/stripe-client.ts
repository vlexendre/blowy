/**
 * Client HTTP Stripe minimal (aucune dépendance) : `application/x-www-form-urlencoded` (format de
 * l'API Stripe, clés imbriquées `a[b]`, tableaux `a[0][b]`), `Authorization: Bearer <clé secrète>`,
 * en-tête `Idempotency-Key` sur chaque POST (rejeu sûr), `Stripe-Version` épinglable, délai borné.
 * Erreurs : 5xx / réseau / 429 → PROVIDER_UNAVAILABLE (retryable) ; 4xx → 502 `reason: PROVIDER_REJECTED` avec
 * seulement `type`/`code` Stripe et l'identifiant de requête — jamais la clé, le corps ni le secret client.
 */
import { AppError } from '../../../../shared/domain/errors.js';

export type FormValue = string | number | boolean | null | undefined | FormValue[] | { [k: string]: FormValue };

export function encodeForm(params: Record<string, FormValue>): string {
  const out: string[] = [];
  const walk = (prefix: string, v: FormValue) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((x, i) => walk(`${prefix}[${i}]`, x));
    else if (typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(`${prefix}[${k}]`, x);
    else out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(v))}`);
  };
  for (const [k, v] of Object.entries(params)) walk(k, v);
  return out.join('&');
}

export interface StripeClientConfig {
  secretKey: string;
  baseUrl: string;
  apiVersion: string | null;
  timeoutMs: number;
}

export class StripeClient {
  constructor(
    private readonly cfg: StripeClientConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async post<T>(path: string, params: Record<string, FormValue>, idempotencyKey: string): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.cfg.baseUrl.replace(/\/$/, '')}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cfg.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': idempotencyKey,
          ...(this.cfg.apiVersion ? { 'Stripe-Version': this.cfg.apiVersion } : {}),
        },
        body: encodeForm(params),
        signal: ctrl.signal,
      });
    } catch {
      throw new AppError('PROVIDER_UNAVAILABLE', 'Fournisseur de paiement injoignable', { detailsSafe: { provider: 'stripe' }, retryable: true });
    } finally {
      clearTimeout(timer);
    }
    const requestId = res.headers.get('request-id');
    const body = (await res.json().catch(() => null)) as (T & { error?: { type?: string; code?: string } }) | null;
    if (res.ok && body) return body;
    const err = body?.error;
    const details = { provider: 'stripe', status: res.status, ...(err?.type ? { type: err.type } : {}), ...(err?.code ? { stripeCode: err.code } : {}), ...(requestId ? { requestId } : {}) };
    if (res.status >= 500 || res.status === 429) throw new AppError('PROVIDER_UNAVAILABLE', 'Fournisseur de paiement indisponible', { detailsSafe: details, retryable: true });
    throw new AppError('PROVIDER_UNAVAILABLE', 'Requête refusée par le fournisseur de paiement', { status: 502, detailsSafe: { ...details, reason: 'PROVIDER_REJECTED' }, retryable: false });
  }
}
