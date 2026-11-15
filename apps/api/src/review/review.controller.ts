import { createHash, timingSafeEqual } from 'node:crypto';
import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import { ReviewSessionBody, type ReviewReset, type ReviewSession } from '@blowy/contract';
import { auditText, textOf } from '@blowy/content';
import type { Request } from 'express';
import type { z } from 'zod';
import type { Env } from '../config/env';
import type { AuthUser } from '../integrations/auth/ports';
import { CurrentUser, Public } from '../shared/auth.guard';
import type { Clock } from '../shared/clock';
import { DomainError } from '../shared/errors';
import { RateLimiter } from '../shared/rate-limiter';
import { CLOCK, ENV, PETS } from '../shared/tokens';
import { ZodPipe } from '../shared/zod.pipe';
import type { PetsRepository } from '../modules/pets/ports';
import { REVIEW_AUTH, type ReviewAuth } from './review-auth';
import { ReviewWorld } from './review-world';

/** Comparaison en temps constant (empreintes de même longueur). */
const same = (a: string, b: string): boolean => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

/**
 * Compte de revue d'Apple (audit B1). `POST /v1/review/session` (public) : l'adresse `REVIEW_EMAIL` et le code
 * `REVIEW_CODE` ouvrent une session ; toute autre adresse, un mauvais code ou une configuration absente reçoivent la même
 * erreur (rien ne dit qu'une adresse de revue existe). 10 essais par adresse IP et par quart d'heure, 60 par heure en
 * tout. Si le compte a déjà son minimoa, son monde d'exemple est remis à neuf. `POST /v1/review/reset` : le compte de
 * revue seulement.
 */
@Controller('v1/review')
export class ReviewController {
  private readonly perIp: RateLimiter;
  private readonly overall: RateLimiter;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(REVIEW_AUTH) private readonly auth: ReviewAuth,
    @Inject(ReviewWorld) private readonly world: ReviewWorld,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CLOCK) clock: Clock,
  ) {
    this.perIp = new RateLimiter(clock, 10, 15 * 60_000);
    this.overall = new RateLimiter(clock, 60, 60 * 60_000);
  }

  @Public()
  @Post('session')
  async session(@Body(new ZodPipe(ReviewSessionBody)) body: z.infer<typeof ReviewSessionBody>, @Req() req: Request): Promise<ReviewSession> {
    if (!this.perIp.take(`ip:${req.ip ?? 'inconnue'}`) || !this.overall.take('all')) throw new DomainError('rate_limited');
    const review = this.env.audit.review;
    // Les deux comparaisons sont toujours faites (même durée, quelle que soit l'erreur).
    const emailOk = same(body.email, review?.email ?? '\u0000');
    const codeOk = same(body.code, review?.code ?? '\u0000');
    if (!review || !emailOk || !codeOk) throw new DomainError('unauthorized', textOf(auditText, (t) => t.reviewSignIn.wrong));
    const tokens = await this.auth.sessionFor(review.email);
    const onboarded = (await this.pets.findByOwner(tokens.userId)) !== null;
    const fixtures = onboarded ? await this.world.reset(tokens.userId) : 0;
    return { userId: tokens.userId, email: review.email, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, worldReset: fixtures > 0 };
  }

  @Post('reset')
  async reset(@CurrentUser() user: AuthUser): Promise<ReviewReset> {
    if (!this.world.isReviewEmail(user.email)) throw new DomainError('forbidden');
    return { ok: true, fixtures: await this.world.reset(user.userId) };
  }
}
