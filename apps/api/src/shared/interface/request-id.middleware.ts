/** requestId corrélé (en-tête x-request-id accepté s'il est sûr) + log d'accès JSON sans corps. */
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { Logger } from '../infrastructure/logging/logger.js';
import type { BlowyRequest } from './request-context.js';

const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

export function requestIdMiddleware(logger: Logger) {
  return (req: BlowyRequest, res: Response, next: NextFunction) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && SAFE_ID.test(incoming) ? incoming : randomUUID();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      // Route sans query string (aucun identifiant sensible dans les logs d'accès).
      logger.info({ requestId: id, method: req.method, path: req.path, status: res.statusCode, ms: Math.round(ms), userId: req.user?.userId }, 'http');
    });
    next();
  };
}
