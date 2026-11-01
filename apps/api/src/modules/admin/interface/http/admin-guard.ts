/**
 * Guard staff (routes /v1/admin/*, hors login/MFA) :
 *  - IGNORE l'en-tête Authorization (un bearer mobile n'ouvre jamais de droit staff) ;
 *  - session staff via en-tête `x-blowy-staff-session` (BFF Next serveur) ou cookie `blowy_staff` ;
 *  - CSRF : toute méthode non sûre exige `x-blowy-csrf` = HMAC(sessionId) (double soumission liée
 *    à la session, comparée en temps constant) ;
 *  - step-up calculé et attaché à l'acteur (vérifié par permission dans les use cases).
 */
import { createParamDecorator, Inject, Injectable, SetMetadata, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { STAFF_CSRF_HEADER, STAFF_SESSION_COOKIE } from '@blowy/api-contract';
import { AppError } from '../../../../shared/domain/errors.js';
import type { BlowyRequest } from '../../../../shared/interface/request-context.js';
import type { AdminActor } from '../../application/admin-command.js';
import { StaffAuthService } from '../../application/use-cases/staff-auth.use-cases.js';
import { ADMIN_CONFIG, type AdminConfig } from '../../infrastructure/admin-config.js';
import { verifyCsrf } from '../../domain/staff-tokens.js';

export const STAFF_SESSION_HEADER = 'x-blowy-staff-session';
export const STAFF_PENDING_HEADER = 'x-blowy-staff-pending';
export const ADMIN_UNAUTHENTICATED = 'blowy:adminPreAuth';
/** Routes de la 1re étape (login / MFA) : pas de session staff exigée. */
export const AdminPreAuth = () => SetMetadata(ADMIN_UNAUTHENTICATED, true);

export interface AdminRequest extends BlowyRequest {
  staff?: AdminActor;
}

export function readCookie(req: BlowyRequest, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

const header = (req: BlowyRequest, name: string): string | undefined => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly csrfSecret: string;
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(StaffAuthService) private readonly auth: StaffAuthService,
    @Inject(ADMIN_CONFIG) cfg: AdminConfig,
  ) {
    this.csrfSecret = cfg.staffSessionSecret;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(ADMIN_UNAUTHENTICATED, [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const token = header(req, STAFF_SESSION_HEADER) ?? readCookie(req, STAFF_SESSION_COOKIE);
    const staff = await this.auth.resolve(token);
    if (!staff) throw new AppError('UNAUTHENTICATED', 'Session staff requise');
    if (!SAFE.has(req.method) && !verifyCsrf(this.csrfSecret, staff.sessionId, header(req, STAFF_CSRF_HEADER))) {
      throw new AppError('FORBIDDEN', 'Jeton CSRF invalide', { detailsSafe: { reason: 'CSRF' } });
    }
    const stepUp = await this.auth.stepUpValidUntil(staff.sessionId);
    req.staff = { ...staff, requestId: req.requestId ?? null, stepUpValid: !!stepUp };
    return true;
  }
}

export const Staff = createParamDecorator((_: unknown, ctx: ExecutionContext): AdminActor => {
  const req = ctx.switchToHttp().getRequest<AdminRequest>();
  if (!req.staff) throw new AppError('UNAUTHENTICATED', 'Session staff requise');
  return req.staff;
});

export const PendingToken = createParamDecorator((_: unknown, ctx: ExecutionContext): string | undefined => {
  const req = ctx.switchToHttp().getRequest<BlowyRequest>();
  return header(req, STAFF_PENDING_HEADER);
});

export const RequestId = createParamDecorator((_: unknown, ctx: ExecutionContext): string | null => ctx.switchToHttp().getRequest<BlowyRequest>().requestId ?? null);
