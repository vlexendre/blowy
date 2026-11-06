/**
 * Routes /v1/safety (authentifiées) et /v1/public/guardian/:token (page du proche, SANS compte).
 * Toute réponse est validée par son contrat `.strict()` (un champ non prévu = échec, pas une fuite).
 * Page publique : `Cache-Control: no-store`, `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer`,
 * 404 IDENTIQUE (jeton inconnu, expiré, révoqué, sujet annulé), aucune IP ni empreinte stockée.
 */
import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Query, Res } from '@nestjs/common';
import {
  CreateGuardianLinkRequestSchema,
  CreateGuardianLinkResponseSchema,
  GuardianLinkListSchema,
  GuardianLinksQuerySchema,
  GuardianPageViewSchema,
  GuardianPushSubscriptionRequestSchema,
  GuardianTokenSchema,
  RaiseAlertRequestSchema,
  RaiseAlertResponseSchema,
  ResolveAlertRequestSchema,
  ResolveAlertResponseSchema,
  SafetyOkRequestSchema,
  SafetyOkResponseSchema,
  SafetyStatusViewSchema,
  UneasyLeaveRequestSchema,
  UneasyLeaveResponseSchema,
  UuidSchema,
} from '@blowy/api-contract';
import type { Response } from 'express';
import type { z } from 'zod';
import { Errors } from '../../../shared/domain/errors.js';
import { Public } from '../../../shared/interface/auth.guard.js';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { SafetyUseCases } from '../application/safety.use-cases.js';
import { GUARDIAN_PUSH_SENDER, SAFETY_RATE_LIMITER, type GuardianPushSender, type SafetyRateLimiter } from '../application/ports/safety.ports.js';

const Id = new ZodPipe(UuidSchema);

function publicHeaders(res: Response) {
  res.setHeader('cache-control', 'no-store, max-age=0');
  res.setHeader('x-robots-tag', 'noindex, nofollow, noarchive');
  res.setHeader('referrer-policy', 'no-referrer');
}

/** Jeton mal formé : même 404 que tout autre jeton non servable. */
function token(raw: string): string {
  const t = GuardianTokenSchema.safeParse(raw);
  if (!t.success) throw Errors.notFound('Lien');
  return t.data;
}

@Controller('v1')
export class SafetyController {
  constructor(@Inject(SafetyUseCases) private readonly safety: SafetyUseCases) {}

  @Post('safety/guardian-links')
  async create(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(CreateGuardianLinkRequestSchema)) body: z.infer<typeof CreateGuardianLinkRequestSchema>) {
    return CreateGuardianLinkResponseSchema.parse(await this.safety.createLink(u.userId, cid, body));
  }

  @Get('safety/guardian-links')
  async list(@CurrentUser() u: AuthenticatedUser, @Query(new ZodPipe(GuardianLinksQuerySchema)) q: z.infer<typeof GuardianLinksQuerySchema>) {
    return GuardianLinkListSchema.parse(await this.safety.listLinks(u.userId, { kind: q.subjectKind, id: q.subjectId }));
  }

  @Delete('safety/guardian-links/:id')
  @HttpCode(204)
  async revoke(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string) {
    await this.safety.revokeLink(u.userId, cid, id);
  }

  @Get('safety/status')
  async status(@CurrentUser() u: AuthenticatedUser, @Query(new ZodPipe(GuardianLinksQuerySchema)) q: z.infer<typeof GuardianLinksQuerySchema>) {
    return SafetyStatusViewSchema.parse(await this.safety.status(u.userId, { kind: q.subjectKind, id: q.subjectId }));
  }

  @Post('safety/ok')
  @HttpCode(200)
  async ok(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(SafetyOkRequestSchema)) body: z.infer<typeof SafetyOkRequestSchema>) {
    return SafetyOkResponseSchema.parse(await this.safety.ok(u.userId, cid, body.subject));
  }

  /** Exclue du limiteur global par IP (`rate-limit.ts`) ; limite dédiée `[T] safety.alertsPerHour`. */
  @Post('safety/alerts')
  @HttpCode(200)
  async alert(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(RaiseAlertRequestSchema)) body: z.infer<typeof RaiseAlertRequestSchema>) {
    return RaiseAlertResponseSchema.parse(await this.safety.raiseAlert(u.userId, cid, body));
  }

  /** « Je pars, mal à l'aise » (V5.3 B.9) : toujours possible, sans pénalité. */
  @Post('safety/leave')
  @HttpCode(200)
  async leave(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(UneasyLeaveRequestSchema)) body: z.infer<typeof UneasyLeaveRequestSchema>) {
    return UneasyLeaveResponseSchema.parse(await this.safety.leave(u.userId, cid, body));
  }

  @Post('safety/alerts/:id/resolve')
  @HttpCode(200)
  async resolve(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', Id) id: string, @Body(new ZodPipe(ResolveAlertRequestSchema)) _body: z.infer<typeof ResolveAlertRequestSchema>) {
    return ResolveAlertResponseSchema.parse(await this.safety.resolveAlert(u.userId, cid, id));
  }
}

@Controller('v1/public/guardian')
export class PublicGuardianController {
  constructor(
    @Inject(SafetyUseCases) private readonly safety: SafetyUseCases,
    @Inject(GUARDIAN_PUSH_SENDER) private readonly push: GuardianPushSender,
    @Inject(SAFETY_RATE_LIMITER) private readonly limiter: SafetyRateLimiter,
  ) {}

  @Public()
  @Get(':token')
  async page(@Param('token') raw: string, @Res({ passthrough: true }) res: Response) {
    publicHeaders(res);
    return GuardianPageViewSchema.parse(await this.safety.page(token(raw), this.limiter));
  }

  @Public()
  @Post(':token/push')
  @HttpCode(204)
  async subscribe(@Param('token') raw: string, @Body(new ZodPipe(GuardianPushSubscriptionRequestSchema)) body: z.infer<typeof GuardianPushSubscriptionRequestSchema>, @Res({ passthrough: true }) res: Response) {
    publicHeaders(res);
    await this.safety.subscribePush(token(raw), body.subscription.endpoint, this.push);
  }
}
