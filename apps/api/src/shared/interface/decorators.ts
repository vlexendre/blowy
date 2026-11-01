/** Décorateurs de paramètres partagés : utilisateur courant et commandId (en-tête Idempotency-Key). */
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { IDEMPOTENCY_HEADER } from '@blowy/api-contract';
import { AppError, Errors } from '../domain/errors.js';
import type { AuthenticatedUser, BlowyRequest } from './request-context.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const req = ctx.switchToHttp().getRequest<BlowyRequest>();
  if (!req.user) throw Errors.unauthenticated();
  return req.user;
});

export const CommandId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<BlowyRequest>();
  const raw = req.headers[IDEMPOTENCY_HEADER];
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || !UUID_RE.test(v)) {
    throw new AppError('VALIDATION_FAILED', 'En-tête Idempotency-Key (UUID) requis', { detailsSafe: { header: IDEMPOTENCY_HEADER } });
  }
  return v.toLowerCase();
});
