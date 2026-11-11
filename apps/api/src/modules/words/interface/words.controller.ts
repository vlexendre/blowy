import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';
import { type WordsPage, WordsBody } from '@blowy/contract';
import { WORD_KEYS } from '@blowy/domain';
import type { Request } from 'express';
import { z } from 'zod';
import type { Clock } from '../../../shared/clock';
import { Public } from '../../../shared/auth.guard';
import { DomainError } from '../../../shared/errors';
import { RateLimiter } from '../../../shared/rate-limiter';
import { CLOCK } from '../../../shared/tokens';
import { ZodPipe } from '../../../shared/zod.pipe';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import { Words } from '../application/words.usecase';

const Code = new ZodPipe(z.string().trim().min(4).max(32));
/** Votes par IP et par code sur la fenêtre. */
const VOTES_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60_000;

@Public()
@Controller('v1/words')
export class WordsController {
  private readonly limiter: RateLimiter;

  constructor(
    @Inject(Words) private readonly words: Words,
    @Inject(CLOCK) clock: Clock,
  ) {
    this.limiter = new RateLimiter(clock, VOTES_PER_WINDOW, WINDOW_MS);
  }

  @Get(':code')
  async get(@Param('code', Code) code: string): Promise<WordsPage> {
    const { profile, pet } = await this.words.target(code);
    return { displayName: profile.displayName, pet: toPublicPet(pet, 'joie'), words: WORD_KEYS };
  }

  @Post(':code')
  async vote(@Param('code', Code) code: string, @Body(new ZodPipe(WordsBody)) body: z.infer<typeof WordsBody>, @Req() req: Request): Promise<{ ok: true }> {
    const ip = req.ip ?? 'inconnue';
    if (!this.limiter.take(`${ip}|${code.toUpperCase()}`)) throw new DomainError('rate_limited');
    await this.words.vote({ code, words: body.words, ip, userAgent: req.headers['user-agent'] ?? '' });
    return { ok: true };
  }
}
