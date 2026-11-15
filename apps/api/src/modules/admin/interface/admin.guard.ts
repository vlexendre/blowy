import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Env } from '../../../config/env';
import type { AuthUser } from '../../../integrations/auth/ports';
import { DomainError } from '../../../shared/errors';
import { ENV } from '../../../shared/tokens';

/**
 * Réserve une route aux adresses de `ADMIN_EMAILS`. S'exécute après la garde globale (jeton vérifié) :
 * sans jeton → 401 ; jeton valide d'une autre adresse → 403. L'appli web d'administration n'est qu'un client.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(ENV) private readonly env: Env) {}

  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>().user;
    if (!user) throw new DomainError('unauthorized');
    const email = user.email?.trim().toLowerCase();
    if (!email || !this.env.facturationAdmin.adminEmails.includes(email)) throw new DomainError('forbidden', 'Accès réservé à l’équipe Blowy.');
    return true;
  }
}
