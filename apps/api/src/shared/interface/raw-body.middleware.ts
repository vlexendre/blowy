/** Collecte des octets bruts bornée (upload média). Au-delà de `limit` : 413, flux interrompu. */
import type { NextFunction, Response } from 'express';
import type { BlowyRequest } from './request-context.js';

export function rawBodyMiddleware(limit: number) {
  return (req: BlowyRequest, res: Response, next: NextFunction) => {
    if (req.method !== 'PUT') return next();
    const chunks: Buffer[] = [];
    let size = 0;
    let done = false;
    req.on('data', (c: Buffer) => {
      if (done) return;
      size += c.length;
      if (size > limit) {
        done = true;
        res.status(413).json({ code: 'VALIDATION_FAILED', message: 'Fichier trop volumineux', requestId: req.requestId ?? 'unknown', retryable: false });
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (done) return;
      req.rawBody = Buffer.concat(chunks);
      (req as { body?: unknown }).body = req.rawBody;
      // Indique au parseur JSON que le corps est déjà lu.
      (req as { _body?: boolean })._body = true;
      next();
    });
    req.on('error', (e) => next(e));
  };
}
