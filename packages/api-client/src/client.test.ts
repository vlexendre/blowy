import { describe, expect, it } from 'vitest';
import { BlowyApiError, BlowyClient } from './index.js';

function fakeFetch(handler: (url: string, init: RequestInit) => { status: number; body: unknown }) {
  return (async (url: string, init: RequestInit) => {
    const r = handler(url, init);
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
}

describe('BlowyClient', () => {
  it('envoie jeton et Idempotency-Key, valide la réponse', async () => {
    const seen: RequestInit[] = [];
    const c = new BlowyClient({
      baseUrl: 'http://api',
      getToken: () => 'tok',
      newCommandId: () => '00000000-0000-7000-8000-000000000001',
      fetch: fakeFetch((_u, init) => {
        seen.push(init);
        return { status: 200, body: { status: 'WAITING_OTHER', relationshipId: null } };
      }),
    });
    const r = await c.matching.accept('p1');
    expect(r.status).toBe('WAITING_OTHER');
    const h = seen[0]!.headers as Record<string, string>;
    expect(h.authorization).toBe('Bearer tok');
    expect(h['idempotency-key']).toBe('00000000-0000-7000-8000-000000000001');
  });
  it('transforme une erreur structurée en BlowyApiError', async () => {
    const c = new BlowyClient({ baseUrl: 'http://api', fetch: fakeFetch(() => ({ status: 409, body: { code: 'CAPACITY_EXCEEDED', message: 'x', requestId: 'r', retryable: false } })) });
    await expect(c.matching.accept('p')).rejects.toBeInstanceOf(BlowyApiError);
    await c.matching.accept('p').catch((e: BlowyApiError) => expect(e.code).toBe('CAPACITY_EXCEEDED'));
  });
  it('rejette une réponse hors contrat', async () => {
    const c = new BlowyClient({ baseUrl: 'http://api', fetch: fakeFetch(() => ({ status: 200, body: { status: 'NOPE' } })) });
    await expect(c.matching.accept('p')).rejects.toThrow();
  });
});
