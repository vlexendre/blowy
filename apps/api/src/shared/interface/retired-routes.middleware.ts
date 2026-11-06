/**
 * Routes V4 retirées en V5 (spec-v5 §7.7, D-020, D-034) : `410 GONE {reason:"RETIRED_IN_V5"}`.
 * La liste fait foi dans `@blowy/api-contract` (`RETIRED_V4_ROUTES`, `RETIRED_V4_ROUTE_PREFIXES`).
 * Appliqué avant l'authentification et le rate limit : une route retirée ne révèle rien (pas de 404/401
 * différencié selon l'objet) et ne coûte rien. Aucune route V5 n'est couverte (testé).
 */
import type { NextFunction, Request, Response } from 'express';
import { RETIRED_V4_ROUTES, RETIRED_V4_ROUTE_PREFIXES } from '@blowy/api-contract';
import { Errors } from '../domain/errors.js';
import { toApiError } from './error.filter.js';
import type { BlowyRequest } from './request-context.js';

function compile(path: string): RegExp {
  const body = path
    .split('/')
    .map((seg) => (seg.startsWith(':') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^${body}/?$`);
}

const EXACT = RETIRED_V4_ROUTES.map((r) => ({ method: r.method as string, re: compile(r.path) }));

/** Vrai si `(method, path)` est une route V4 retirée. `path` sans chaîne de requête. */
export function isRetiredRoute(method: string, path: string): boolean {
  const m = method.toUpperCase();
  if (RETIRED_V4_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  return EXACT.some((r) => r.method === m && r.re.test(path));
}

export function retiredRoutesMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isRetiredRoute(req.method, req.path)) return next();
    const { status, body } = toApiError(Errors.gone(), (req as BlowyRequest).requestId ?? 'unknown');
    res.status(status).json(body);
  };
}
