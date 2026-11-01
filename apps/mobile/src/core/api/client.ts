/**
 * Accès API unique du mobile : `@blowy/api-client` (BlowyClient, contrats Zod de C).
 * `raw` réutilise le même HttpTransport pour les routes que BlowyClient ne couvre pas encore
 * (économie de G, sécurité E, social V3) — même jeton, même Idempotency-Key, mêmes erreurs.
 */
import { BlowyApiError, BlowyClient, HttpTransport, type ClientOptions } from '@blowy/api-client';

export type RawRequest = { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; body?: unknown; commandId?: string; headers?: Record<string, string> };

export interface Api {
  client: BlowyClient;
  /** Requête brute (réponse non validée : le repository appelant valide avec son schéma). */
  raw(req: RawRequest): Promise<unknown>;
}

export function createApi(opts: ClientOptions & { onUnauthenticated?: () => void }): Api {
  const client = new BlowyClient(opts);
  const transport = new HttpTransport(opts);
  const guard = async <T>(p: Promise<T>): Promise<T> => {
    try {
      return await p;
    } catch (e) {
      if (e instanceof BlowyApiError && e.status === 401) opts.onUnauthenticated?.();
      throw e;
    }
  };
  // Les méthodes de BlowyClient sont enveloppées pour détecter un 401 (session révoquée/expirée).
  const wrap = <O extends Record<string, unknown>>(o: O): O =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'function' ? (...a: unknown[]) => guard((v as (...x: unknown[]) => Promise<unknown>)(...a)) : v])) as O;
  const wrapped = Object.assign(Object.create(Object.getPrototypeOf(client) as object) as BlowyClient, client, {
    auth: wrap(client.auth),
    me: wrap(client.me),
    pets: wrap(client.pets),
    matching: wrap(client.matching),
    relationships: wrap(client.relationships),
    conversations: wrap(client.conversations),
  });
  return {
    client: wrapped,
    raw: (r) => {
      const idem = r.commandId ?? r.headers?.['idempotency-key'];
      return guard(transport.request(r.method, r.path, null, r.body, idem ? { commandId: idem } : undefined));
    },
  };
}
