import { createHash, timingSafeEqual } from 'node:crypto';
import { Controller, Headers, HttpCode, Inject, Post } from '@nestjs/common';
import type { TickResult } from '@blowy/contract';
import type { Env } from '../../config/env';
import { Public } from '../../shared/auth.guard';
import { DomainError } from '../../shared/errors';
import { ENV } from '../../shared/tokens';
import { TickService } from './tick.service';

const digest = (s: string): Buffer => createHash('sha256').update(s).digest();

/**
 * `POST /internal/tick`, appelé toutes les quelques minutes par un planificateur externe (voir apps/api/README.md).
 * Secret dans l'en-tête `x-tick-secret` (ou `Authorization: Bearer …`). Sans INTERNAL_TICK_SECRET, la route n'existe pas.
 */
@Public()
@Controller('internal')
export class TickController {
  constructor(
    @Inject(TickService) private readonly ticks: TickService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post('tick')
  @HttpCode(200)
  async tick(@Headers('x-tick-secret') header?: string, @Headers('authorization') authorization?: string): Promise<TickResult> {
    const expected = this.env.plateforme.tick.secret;
    if (!expected) throw new DomainError('not_found');
    const given = header ?? (authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '');
    // Comparaison à temps constant (sur les empreintes, de longueur fixe).
    if (!given || !timingSafeEqual(digest(given), digest(expected))) throw new DomainError('unauthorized');
    return this.ticks.run();
  }
}
