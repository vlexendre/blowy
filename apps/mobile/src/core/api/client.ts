/**
 * Accès API unique du mobile : `@blowy/api-client` (BlowyClient + HttpTransport, contrats Zod).
 *  - `client` : routes couvertes par BlowyClient (auth, me, conversations…) ;
 *  - `request` : toute route V5 avec validation par le schéma de contrat (`@blowy/api-contract`) ;
 *  - `raw` : requête non validée (le repository appelant valide), conservé pour G (achats).
 * Même jeton, même Idempotency-Key, mêmes erreurs. Un 401 n'efface la session que s'il répond au
 * jeton courant (voir session-store : correctif de l'ouverture à froid sur une route profonde).
 */
import { BlowyApiError, BlowyClient, HttpTransport, type ClientOptions } from '@blowy/api-client';
import type { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type RawRequest = {
  method: HttpMethod;
  path: string;
  body?: unknown;
  commandId?: string;
  headers?: Record<string, string>;
};

export interface Api {
  client: BlowyClient;
  request<S extends z.ZodType>(
    method: HttpMethod,
    path: string,
    schema: S,
    body?: unknown,
    opts?: { commandId?: string },
  ): Promise<z.infer<S>>;
  /** Commande sans corps de réponse exploité (204 ou corps ignoré). */
  send(
    method: HttpMethod,
    path: string,
    body?: unknown,
    opts?: { commandId?: string },
  ): Promise<void>;
  /** Requête brute (réponse non validée : le repository appelant valide avec son schéma). */
  raw(req: RawRequest): Promise<unknown>;
}

export interface ApiOptions extends ClientOptions {
  /** Appelé sur un 401 avec le jeton effectivement envoyé (null si aucun). */
  onUnauthenticated?: (sentToken: string | null) => void;
}

export function createApi(opts: ApiOptions): Api {
  const client = new BlowyClient(opts);
  const transport = new HttpTransport(opts);
  const guard = async <T>(run: () => Promise<T>): Promise<T> => {
    const sent = (await opts.getToken?.()) ?? null;
    try {
      return await run();
    } catch (e) {
      if (e instanceof BlowyApiError && e.status === 401) opts.onUnauthenticated?.(sent);
      throw e;
    }
  };
  const wrap = <O extends Record<string, unknown>>(o: O): O =>
    Object.fromEntries(
      Object.entries(o).map(([k, v]) => [
        k,
        typeof v === 'function'
          ? (...a: unknown[]) => guard(() => (v as (...x: unknown[]) => Promise<unknown>)(...a))
          : v,
      ]),
    ) as O;
  const wrapped = Object.assign(
    Object.create(Object.getPrototypeOf(client) as object) as BlowyClient,
    client,
    {
      auth: wrap(client.auth),
      me: wrap(client.me),
      pets: wrap(client.pets),
      conversations: wrap(client.conversations),
    },
  );
  return {
    client: wrapped,
    request: (method, path, schema, body, o) =>
      guard(() =>
        transport.request(
          method,
          path,
          schema,
          body,
          o?.commandId ? { commandId: o.commandId } : undefined,
        ),
      ),
    send: async (method, path, body, o) => {
      await guard(() =>
        transport.request(
          method,
          path,
          null,
          body,
          o?.commandId ? { commandId: o.commandId } : undefined,
        ),
      );
    },
    raw: (r) => {
      const idem = r.commandId ?? r.headers?.['idempotency-key'];
      return guard(() =>
        transport.request(r.method, r.path, null, r.body, idem ? { commandId: idem } : undefined),
      );
    },
  };
}
