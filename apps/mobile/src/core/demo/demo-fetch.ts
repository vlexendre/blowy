/**
 * `fetch` de démonstration : sert les routes d'un scénario (méthode + motif de chemin) avec des
 * réponses JSON. Une route non décrite répond 404 `NOT_FOUND` (jamais une donnée inventée par
 * défaut). Les écritures renvoient la réponse décrite (ou 204) sans effet de bord persistant.
 */
export type DemoHandler = (ctx: {
  method: string;
  path: string;
  params: string[];
  body: unknown;
}) => { status?: number; json?: unknown } | unknown;

export interface DemoRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Motif de chemin (sans la requête), `:x` = segment quelconque. */
  path: string;
  respond: DemoHandler | unknown;
}

/** Réponse jamais rendue (état de chargement) / panne réseau (fetch rejeté). */
export const DEMO_PENDING = Symbol('demo-pending');
export const DEMO_OFFLINE = Symbol('demo-offline');

const toRegex = (p: string) =>
  new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[a-zA-Z]+/g, '([^/]+)')}$`);

export function matchRoute(
  routes: readonly DemoRoute[],
  method: string,
  path: string,
): { route: DemoRoute; params: string[] } | null {
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = toRegex(r.path).exec(path);
    if (m) return { route: r, params: m.slice(1) };
  }
  return null;
}

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export function createDemoFetch(routes: readonly DemoRoute[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    );
    const method = (init?.method ?? 'GET').toUpperCase();
    const hit = matchRoute(routes, method, url.pathname);
    if (!hit)
      return json(404, {
        code: 'NOT_FOUND',
        message: `Cannot ${method} ${url.pathname}`,
        requestId: 'demo',
        retryable: false,
        detailsSafe: { reason: 'ROUTE_NOT_FOUND' },
      });
    if (hit.route.respond === DEMO_PENDING) return new Promise<Response>(() => undefined);
    if (hit.route.respond === DEMO_OFFLINE) throw new TypeError('Network request failed');
    const body =
      typeof init?.body === 'string' && init.body ? (JSON.parse(init.body) as unknown) : undefined;
    const out =
      typeof hit.route.respond === 'function'
        ? (hit.route.respond as DemoHandler)({
            method,
            path: url.pathname,
            params: hit.params,
            body,
          })
        : hit.route.respond;
    if (
      out &&
      typeof out === 'object' &&
      'status' in out &&
      typeof (out as { status: unknown }).status === 'number'
    ) {
      const o = out as { status: number; json?: unknown };
      return json(o.status, o.json);
    }
    return out === undefined ? new Response('', { status: 204 }) : json(200, out);
  }) as typeof fetch;
}
