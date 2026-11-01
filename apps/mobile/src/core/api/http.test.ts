import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { createHttp, isUnavailable, type ApiCallError } from './http';

const res = (status: number, body: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });

describe('transport HTTP', () => {
  it('Bearer + Idempotency-Key, réponse validée', async () => {
    let seen: Headers | null = null;
    const http = createHttp({ baseUrl: 'http://api', getToken: async () => 'tok', fetchImpl: (async (_u: string, init: RequestInit) => ((seen = new Headers(init.headers)), res(200, { ok: true }))) as unknown as typeof fetch });
    await expect(http.request({ method: 'POST', path: '/v1/x', commandId: '0f8fad5b-d9cb-469f-a165-70867728950e' }, z.object({ ok: z.boolean() }))).resolves.toEqual({ ok: true });
    expect(seen!.get('authorization')).toBe('Bearer tok');
    expect(seen!.get('idempotency-key')).toBe('0f8fad5b-d9cb-469f-a165-70867728950e');
  });
  it('route absente (Nest « Cannot GET ») → NOT_IMPLEMENTED (état indisponible)', async () => {
    const http = createHttp({ baseUrl: 'http://api', getToken: async () => null, fetchImpl: (async () => res(404, { code: 'NOT_FOUND', message: 'Cannot GET /v1/pets/me', requestId: 'r', retryable: false })) as unknown as typeof fetch });
    const e = await http.raw({ method: 'GET', path: '/v1/pets/me' }).catch((x: unknown) => x);
    expect(isUnavailable(e)).toBe(true);
  });
  it('NOT_FOUND métier conservé ; réseau = NETWORK réessayable ; 401 notifie', async () => {
    let unauth = 0;
    const nf = createHttp({ baseUrl: 'http://api', getToken: async () => null, onUnauthenticated: () => unauth++, fetchImpl: (async () => res(401, { code: 'UNAUTHENTICATED', message: 'x', requestId: 'r', retryable: false })) as unknown as typeof fetch });
    const e1 = (await nf.raw({ method: 'GET', path: '/v1/me' }).catch((x: unknown) => x)) as ApiCallError;
    expect(e1.code).toBe('UNAUTHENTICATED');
    expect(unauth).toBe(1);
    const net = createHttp({ baseUrl: 'http://api', getToken: async () => null, fetchImpl: (async () => { throw new TypeError('Network request failed'); }) as unknown as typeof fetch });
    const e2 = (await net.raw({ method: 'GET', path: '/v1/me' }).catch((x: unknown) => x)) as ApiCallError;
    expect(e2.code).toBe('NETWORK');
    expect(e2.retryable).toBe(true);
  });
  it('réponse hors contrat → BAD_RESPONSE (jamais affichée comme donnée)', async () => {
    const http = createHttp({ baseUrl: 'http://api', getToken: async () => null, fetchImpl: (async () => res(200, { nope: 1 })) as unknown as typeof fetch });
    const e = (await http.request({ method: 'GET', path: '/v1/me' }, z.object({ ok: z.boolean() })).catch((x: unknown) => x)) as ApiCallError;
    expect(e.code).toBe('BAD_RESPONSE');
  });
});
