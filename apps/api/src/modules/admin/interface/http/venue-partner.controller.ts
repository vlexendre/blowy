/**
 * Espace lieu partenaire /v1/venue/* (spec-v5 §10.2). Garde DÉDIÉE : ignore l'en-tête Authorization
 * (bearer mobile) et le cookie staff ; session lieu via en-tête `x-blowy-venue-session` (BFF) ou
 * cookie `blowy_venue` ; CSRF lié à la session sur toute méthode non sûre.
 */
import { Body, Controller, createParamDecorator, Delete, Get, HttpCode, Inject, Injectable, Post, Put, Query, SetMetadata, UseGuards, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  VENUE_CSRF_HEADER,
  VENUE_PENDING_HEADER,
  VENUE_SESSION_COOKIE,
  VENUE_SESSION_HEADER,
  VenueCapRequestSchema,
  VenueClosureRequestSchema,
  VenueContractSignRequestSchema,
  VenueDayRequestSchema,
  VenueIncidentRequestSchema,
  VenueLoginRequestSchema,
  VenueMfaRequestSchema,
  VenuePhotoRequestSchema,
} from '@blowy/api-contract';
import { z } from 'zod';
import { AppError } from '../../../../shared/domain/errors.js';
import { Public } from '../../../../shared/interface/auth.guard.js';
import { CommandId } from '../../../../shared/interface/decorators.js';
import type { BlowyRequest } from '../../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../../shared/interface/zod.pipe.js';
import { VenuePartnerAuthService, VenuePartnerUseCases, type VenuePartnerContext } from '../../application/use-cases/venue-partner.use-cases.js';
import { readCookie, RequestId } from './admin-guard.js';

const PRE_AUTH = 'blowy:venuePreAuth';
const VenuePreAuth = () => SetMetadata(PRE_AUTH, true);
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
const header = (req: BlowyRequest, name: string): string | undefined => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};
interface VenueRequest extends BlowyRequest {
  venuePartner?: VenuePartnerContext;
}

@Injectable()
export class VenuePartnerGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(VenuePartnerAuthService) private readonly auth: VenuePartnerAuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(PRE_AUTH, [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest<VenueRequest>();
    const p = await this.auth.resolve(header(req, VENUE_SESSION_HEADER) ?? readCookie(req, VENUE_SESSION_COOKIE));
    if (!p) throw new AppError('UNAUTHENTICATED', 'Session lieu requise');
    if (!SAFE.has(req.method) && !this.auth.verifyCsrf(p.sessionId, header(req, VENUE_CSRF_HEADER))) {
      throw new AppError('FORBIDDEN', 'Jeton CSRF invalide', { detailsSafe: { reason: 'CSRF' } });
    }
    req.venuePartner = { ...p, requestId: req.requestId ?? null };
    return true;
  }
}

const Partner = createParamDecorator((_: unknown, ctx: ExecutionContext): VenuePartnerContext => {
  const req = ctx.switchToHttp().getRequest<VenueRequest>();
  if (!req.venuePartner) throw new AppError('UNAUTHENTICATED', 'Session lieu requise');
  return req.venuePartner;
});
const Pending = createParamDecorator((_: unknown, ctx: ExecutionContext) => header(ctx.switchToHttp().getRequest<BlowyRequest>(), VENUE_PENDING_HEADER));

const q = <T extends z.ZodType>(s: T) => new ZodPipe(s);
const VenueQuery = z.object({ venueId: z.string().uuid().optional() });
const StatementQuery = VenueQuery.extend({ period: z.string().regex(/^\d{4}-\d{2}$/).optional() });

@Public()
@UseGuards(VenuePartnerGuard)
@Controller('v1/venue')
export class VenuePartnerController {
  constructor(
    @Inject(VenuePartnerAuthService) private readonly auth: VenuePartnerAuthService,
    @Inject(VenuePartnerUseCases) private readonly venue: VenuePartnerUseCases,
  ) {}

  @VenuePreAuth()
  @Post('auth/login')
  @HttpCode(200)
  login(@Body(q(VenueLoginRequestSchema)) b: z.infer<typeof VenueLoginRequestSchema>, @RequestId() rid: string | null) {
    return this.auth.login(b.provider, b.credential, rid);
  }
  @VenuePreAuth()
  @Post('auth/mfa/enroll')
  @HttpCode(200)
  enroll(@Pending() p: string | undefined, @RequestId() rid: string | null) {
    return this.auth.startEnrollment(p, rid);
  }
  @VenuePreAuth()
  @Post('auth/mfa/verify')
  @HttpCode(200)
  verify(@Pending() p: string | undefined, @Body(q(VenueMfaRequestSchema)) b: { code: string }, @RequestId() rid: string | null) {
    return this.auth.completeMfa(p, b.code, rid);
  }
  @Delete('auth/session')
  @HttpCode(204)
  async logout(@Partner() p: VenuePartnerContext) {
    await this.auth.logout(p);
  }

  @Get('me')
  me(@Partner() p: VenuePartnerContext) {
    return this.venue.me(p);
  }
  @Get('roster')
  roster(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>) {
    return this.venue.roster(p, x.venueId);
  }
  @Get('schedule')
  schedule(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>) {
    return this.venue.schedule(p, x.venueId);
  }
  @Put('schedule/days')
  day(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>, @CommandId() cid: string, @Body(q(VenueDayRequestSchema)) b: z.infer<typeof VenueDayRequestSchema>) {
    return this.venue.setDay(p, x.venueId, b, cid);
  }
  @Put('schedule/cap')
  cap(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>, @CommandId() cid: string, @Body(q(VenueCapRequestSchema)) b: z.infer<typeof VenueCapRequestSchema>) {
    return this.venue.setCap(p, x.venueId, b.tables, cid);
  }
  @Post('schedule/closures')
  closure(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>, @CommandId() cid: string, @Body(q(VenueClosureRequestSchema)) b: z.infer<typeof VenueClosureRequestSchema>) {
    return this.venue.addClosure(p, x.venueId, b, cid);
  }
  @Get('contract')
  contract(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>) {
    return this.venue.contract(p, x.venueId);
  }
  @Post('contract/sign')
  sign(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>, @CommandId() cid: string, @Body(q(VenueContractSignRequestSchema)) b: z.infer<typeof VenueContractSignRequestSchema>) {
    return this.venue.sign(p, x.venueId, b, cid);
  }
  @Get('statement')
  statement(@Partner() p: VenuePartnerContext, @Query(q(StatementQuery)) x: z.infer<typeof StatementQuery>) {
    return this.venue.statement(p, x.venueId, x.period);
  }
  @Post('incidents')
  incident(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>, @CommandId() cid: string, @Body(q(VenueIncidentRequestSchema)) b: z.infer<typeof VenueIncidentRequestSchema>) {
    return this.venue.reportIncident(p, x.venueId, b, cid);
  }
  @Post('photo-requests')
  photo(@Partner() p: VenuePartnerContext, @Query(q(VenueQuery)) x: z.infer<typeof VenueQuery>, @CommandId() cid: string, @Body(q(VenuePhotoRequestSchema)) b: z.infer<typeof VenuePhotoRequestSchema>) {
    return this.venue.requestPhoto(p, x.venueId, b.note, cid);
  }
}
