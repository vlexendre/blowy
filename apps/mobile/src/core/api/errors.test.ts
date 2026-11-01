import { describe, expect, it } from 'vitest';
import { BlowyApiError, isNetworkError, isRetryable, isUnavailable } from './errors';
import { createApi } from './client';

const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const err = (status: number, code: string, message = 'x') => new BlowyApiError(status, { code, message, requestId: 'r', retryable: status >= 500 });

describe('erreurs API', () => {
  it('route absente → indisponible ; NOT_FOUND métier non', () => {
    expect(isUnavailable(err(404, 'NOT_FOUND', 'Cannot GET /v1/league'))).toBe(true);
    expect(isUnavailable(err(404, 'NOT_FOUND', 'Relation introuvable'))).toBe(false);
  });
  it('réseau réessayable', () => {
    const e = err(0, 'PROVIDER_UNAVAILABLE');
    expect(isNetworkError(e)).toBe(true);
    expect(isRetryable(e)).toBe(true);
    expect(isRetryable(err(403, 'FORBIDDEN'))).toBe(false);
  });
  it('raw : Bearer, Idempotency-Key fourni conservé, 401 notifié', async () => {
    let seen: Headers | null = null;
    let unauth = 0;
    const api = createApi({
      baseUrl: 'http://api',
      getToken: () => 'tok',
      onUnauthenticated: () => unauth++,
      fetch: (async (_u: string, init: RequestInit) => {
        seen = new Headers(init.headers);
        return res(401, { code: 'UNAUTHENTICATED', message: 'x', requestId: 'r', retryable: false });
      }) as unknown as typeof fetch,
    });
    await expect(api.raw({ method: 'POST', path: '/v1/blocks', commandId: '0f8fad5b-d9cb-469f-a165-70867728950e' })).rejects.toBeInstanceOf(BlowyApiError);
    expect(seen!.get('authorization')).toBe('Bearer tok');
    expect(seen!.get('idempotency-key')).toBe('0f8fad5b-d9cb-469f-a165-70867728950e');
    expect(unauth).toBe(1);
    await expect(api.client.me.get()).rejects.toBeInstanceOf(BlowyApiError);
    expect(unauth).toBe(2);
  });
});
