import { type CanActivate, type ExecutionContext, Inject, Injectable, SetMetadata, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthUser, AuthVerifier } from '../integrations/auth/ports';
import { DomainError } from './errors';
import { AUTH_VERIFIER } from './tokens';

const IS_PUBLIC = 'blowy:public';

/** Route accessible sans jeton. */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);

type AuthedRequest = Request & { user?: AuthUser };

/** Personne connectée (posée par la garde globale). */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
  if (!user) throw new DomainError('unauthorized');
  return user;
});

/** Garde globale : toute route exige un jeton Bearer valide, sauf celles marquées @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AUTH_VERIFIER) private readonly verifier: AuthVerifier,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new DomainError('unauthorized');
    const user = await this.verifier.verify(token);
    if (!user) throw new DomainError('unauthorized', 'Ta session a expiré. Reconnecte-toi.');
    req.user = user;
    return true;
  }
}
