/**
 * Limites de débit par personne sur les routes d'écriture et celles qui peuvent déclencher l'IA.
 * Usage : `@RateLimit('message')` sur une méthode de contrôleur (après la garde d'auth globale).
 * Le compteur vit dans un `RateLimitStore` : en mémoire pour une instance ; pour plusieurs instances, fournir un
 * adaptateur partagé (Redis…) sous le jeton RATE_LIMIT_STORE dans `PlatformModule`.
 */
import { type CanActivate, type ExecutionContext, Inject, Injectable, SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthUser } from '../integrations/auth/ports';
import { DomainError } from './errors';
import { RateLimiter } from './rate-limiter';
import type { Clock } from './clock';

export const RATE_LIMIT_STORE = Symbol('RATE_LIMIT_STORE');

/** Quotas par personne : nombre d'appels par fenêtre. */
export const RATE_LIMITS = {
  /** Messages et photos dans un lien. */
  message: { max: 30, windowMs: 60_000 },
  /** Autres écritures (réglages, accords, appareils). */
  write: { max: 30, windowMs: 60_000 },
  /** Routes qui peuvent appeler un modèle d'IA (preuves d'habitude…). */
  ai: { max: 6, windowMs: 60_000 },
} as const;
export type RateLimitBucket = keyof typeof RATE_LIMITS;

export interface RateLimitStore {
  /** Faux si la clé a dépassé `max` appels dans la fenêtre courante. */
  take(key: string, max: number, windowMs: number): Promise<boolean>;
}

/** Une fenêtre fixe par quota, en mémoire du processus. */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly limiters = new Map<string, RateLimiter>();
  constructor(private readonly clock: Clock) {}

  async take(key: string, max: number, windowMs: number): Promise<boolean> {
    const id = `${max}/${windowMs}`;
    let limiter = this.limiters.get(id);
    if (!limiter) {
      limiter = new RateLimiter(this.clock, max, windowMs);
      this.limiters.set(id, limiter);
    }
    return limiter.take(key);
  }
}

const BUCKET = 'blowy:rate-limit';

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(RATE_LIMIT_STORE) private readonly store: RateLimitStore,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const bucket = this.reflector.get<RateLimitBucket | undefined>(BUCKET, ctx.getHandler());
    if (!bucket) return true;
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const who = req.user?.userId ?? `ip:${req.ip ?? 'inconnue'}`;
    const { max, windowMs } = RATE_LIMITS[bucket];
    if (!(await this.store.take(`${bucket}:${who}`, max, windowMs))) throw new DomainError('rate_limited');
    return true;
  }
}

/** Limite par personne (clé : identifiant de la personne connectée, sinon l'IP). */
export const RateLimit = (bucket: RateLimitBucket): MethodDecorator => applyDecorators(SetMetadata(BUCKET, bucket), UseGuards(UserRateLimitGuard));
