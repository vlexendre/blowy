/**
 * Limitation de débit (Strategy) : fenêtre fixe d'une minute par clé (IP et utilisateur).
 * RedisRateLimiter en exécution normale, MemoryRateLimiter en test.
 */
import type { NextFunction, Response } from 'express';
import type { Redis } from 'ioredis';
import { toApiError } from './error.filter.js';
import { AppError } from '../domain/errors.js';
import type { BlowyRequest } from './request-context.js';

export interface RateLimiter {
  /** Renvoie le nombre de hits dans la fenêtre courante. */
  hit(key: string, windowSec: number): Promise<number>;
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, { n: number; until: number }>();
  async hit(key: string, windowSec: number): Promise<number> {
    const now = Date.now();
    const b = this.buckets.get(key);
    if (!b || b.until <= now) {
      this.buckets.set(key, { n: 1, until: now + windowSec * 1000 });
      return 1;
    }
    b.n++;
    return b.n;
  }
}

export class RedisRateLimiter implements RateLimiter {
  constructor(private readonly redis: Redis) {}
  async hit(key: string, windowSec: number): Promise<number> {
    const bucket = `rl:${key}:${Math.floor(Date.now() / (windowSec * 1000))}`;
    const res = await this.redis.multi().incr(bucket).expire(bucket, windowSec + 1).exec();
    return Number(res?.[0]?.[1] ?? 0);
  }
}

export function rateLimitMiddleware(limiter: RateLimiter, perMinute: number) {
  return async (req: BlowyRequest, res: Response, next: NextFunction) => {
    // Sondes et webhooks fournisseurs (IP partagées, retries ; authentifiés par en-tête) exclus du limiteur par IP.
    if (req.path.endsWith('/healthz') || req.path.endsWith('/readyz') || req.path.startsWith('/v1/webhooks/')) return next();
    try {
      const n = await limiter.hit(`ip:${req.ip ?? 'unknown'}`, 60);
      if (n > perMinute) {
        const { status, body } = toApiError(new AppError('RATE_LIMITED', 'Trop de requêtes'), req.requestId ?? 'unknown');
        res.setHeader('retry-after', '60');
        res.status(status).json(body);
        return;
      }
    } catch {
      // Panne du limiteur : on laisse passer (fail-open), la sécurité métier reste côté commandes.
    }
    next();
  };
}
