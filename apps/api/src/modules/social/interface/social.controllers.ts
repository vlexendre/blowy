/**
 * Routes social (réponses anonymes, parrainage).
 *  - Publiques (web, sans compte) : GET/POST /v1/public/profiles/:slug(/responses), GET /v1/public/invites/:ref.
 *    Throttling par IP en plus du limiteur global ; l'IP n'est jamais stockée.
 *  - Authentifiées (mobile) : /v1/me/anonymous-responses…, /v1/referrals/…
 */
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, Query, Req } from '@nestjs/common';
import {
  ClaimReferralRequestSchema,
  InvitePreviewSchema,
  InviteRefSchema,
  OwnAnonymousResponsesSchema,
  PageQuerySchema,
  PublicProfileSchema,
  PublicPageStateSchema,
  PublicSlugSchema,
  SubmitAnonymousResponseRequestSchema,
  SubmitAnonymousResponseResultSchema,
  UpdatePublicPageRequestSchema,
  UuidSchema,
  type SubmitAnonymousResponseRequest,
} from '@blowy/api-contract';
import type { z } from 'zod';
import { AppError } from '../../../shared/domain/errors.js';
import { Public } from '../../../shared/interface/auth.guard.js';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser, BlowyRequest } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { AnonymousResponsesUseCases } from '../application/use-cases/anonymous.use-cases.js';
import { ReferralUseCases } from '../application/use-cases/referral.use-cases.js';
import { SOCIAL_QUOTA, type QuotaCounter } from '../application/ports/social.ports.js';

const Slug = new ZodPipe(PublicSlugSchema);
const VISITOR_HEADER = 'x-blowy-visitor';
const visitorOf = (req: BlowyRequest) => {
  const v = req.headers[VISITOR_HEADER];
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^[A-Za-z0-9_-]{22,64}$/.test(s) ? s : null;
};

@Public()
@Controller('v1/public')
export class PublicSocialController {
  constructor(
    @Inject(AnonymousResponsesUseCases) private readonly anon: AnonymousResponsesUseCases,
    @Inject(ReferralUseCases) private readonly referrals: ReferralUseCases,
    @Inject(SOCIAL_QUOTA) private readonly quota: QuotaCounter,
  ) {}

  private async throttle(req: BlowyRequest, bucket: string, max: number) {
    const n = await this.quota.hit(`ip:${bucket}:${req.ip ?? 'unknown'}`, 60);
    if (n > max) throw new AppError('RATE_LIMITED', 'Trop de requêtes');
  }

  @Get('profiles/:slug')
  async profile(@Param('slug', Slug) slug: string, @Req() req: BlowyRequest) {
    await this.throttle(req, 'profile', 60);
    return PublicProfileSchema.parse(await this.anon.publicProfile(slug, visitorOf(req)));
  }

  @Post('profiles/:slug/responses')
  @HttpCode(200)
  async respond(@Param('slug', Slug) slug: string, @Req() req: BlowyRequest, @Body(new ZodPipe(SubmitAnonymousResponseRequestSchema)) b: SubmitAnonymousResponseRequest) {
    await this.throttle(req, 'respond', 30);
    return SubmitAnonymousResponseResultSchema.parse(await this.anon.submit(slug, b));
  }

  @Get('invites/:ref')
  async invite(@Param('ref', new ZodPipe(InviteRefSchema)) ref: string, @Req() req: BlowyRequest) {
    await this.throttle(req, 'invite', 60);
    return InvitePreviewSchema.parse(await this.referrals.preview(ref));
  }
}

@Controller('v1')
export class SocialController {
  constructor(
    @Inject(AnonymousResponsesUseCases) private readonly anon: AnonymousResponsesUseCases,
    @Inject(ReferralUseCases) private readonly referrals: ReferralUseCases,
  ) {}

  @Get('me/anonymous-responses')
  async own(@CurrentUser() u: AuthenticatedUser, @Query(new ZodPipe(PageQuerySchema)) q: { cursor?: string; limit: number }) {
    return OwnAnonymousResponsesSchema.parse(await this.anon.listOwn(u.userId, q.cursor, q.limit));
  }

  @Get('me/public-page')
  async getPage(@CurrentUser() u: AuthenticatedUser) {
    return PublicPageStateSchema.parse(await this.anon.ownPage(u.userId));
  }

  @Put('me/public-page')
  setPage(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(UpdatePublicPageRequestSchema)) b: { enabled: boolean }) {
    return this.anon.setPage(u.userId, b.enabled, cid).then((r) => PublicPageStateSchema.parse(r));
  }

  @Post('me/anonymous-responses/:id/hide')
  hide(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', new ZodPipe(UuidSchema)) id: string) {
    return this.anon.hide(u.userId, id, cid);
  }

  @Post('me/anonymous-responses/:id/report')
  report(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Param('id', new ZodPipe(UuidSchema)) id: string) {
    return this.anon.report(u.userId, id, cid);
  }

  @Get('me/anonymous-responses/:id/hints')
  hints(@CurrentUser() u: AuthenticatedUser, @Param('id', new ZodPipe(UuidSchema)) id: string) {
    return this.anon.hints(u.userId, id);
  }

  @Post('referrals/link')
  @HttpCode(200)
  link(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string) {
    return this.referrals.myLink(u.userId, cid);
  }

  @Post('referrals/claim')
  @HttpCode(200)
  claim(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(ClaimReferralRequestSchema)) b: z.infer<typeof ClaimReferralRequestSchema>) {
    return this.referrals.claim(u.userId, b.ref, cid);
  }

  @Get('referrals/me')
  status(@CurrentUser() u: AuthenticatedUser) {
    return this.referrals.status(u.userId);
  }

  /** Aperçu authentifié (route attendue par le mobile : /v1/referrals/:code). */
  @Get('referrals/:ref')
  preview(@Param('ref', new ZodPipe(InviteRefSchema)) ref: string) {
    return this.referrals.preview(ref);
  }
}
