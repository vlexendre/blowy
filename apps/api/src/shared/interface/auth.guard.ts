/**
 * Guard d'authentification unique : jeton de session opaque (Bearer) → DeviceSession valide.
 * Les routes publiques sont marquées @Public().
 */
import { SetMetadata, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Errors } from '../domain/errors.js';
import type { BlowyRequest } from './request-context.js';
import { SESSION_RESOLVER, type SessionResolver } from '../application/session.port.js';

export { SESSION_RESOLVER, type SessionResolver };

export const IS_PUBLIC = 'blowy:isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);


export function bearerOf(header: string | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m?.[1]?.trim() || null;
}

export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionResolver,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest<BlowyRequest>();
    const token = bearerOf(req.headers.authorization);
    if (!token) throw Errors.unauthenticated();
    const user = await this.sessions.resolve(token);
    if (!user) throw Errors.unauthenticated();
    req.user = user;
    return true;
  }
}
