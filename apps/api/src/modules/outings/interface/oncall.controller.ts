/**
 * V5.5 (D-058, spec §7.4) : `GET /v1/safety/oncall?at=` — « une personne de l'équipe est joignable pendant toute
 * ta sortie » : couverture d'astreinte à cet instant dans le fuseau de la ville de la personne. Aucune donnée
 * d'équipe (ni nom, ni numéro) ; authentifié.
 */
import { Controller, Get, Inject, Query } from '@nestjs/common';
import { z } from 'zod';
import { DEFAULT_TUNING } from '@blowy/tuning';
import type { Clock } from '../../../shared/application/clock.js';
import { ONCALL_COVERAGE, type OnCallCoverage } from '../../../shared/application/ports/oncall-coverage.port.js';
import { CLOCK } from '../../../shared/shared.tokens.js';
import { CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { OUTINGS_REPOSITORY, type OutingsRepository } from '../application/ports/outings.repository.js';

const Q = z.object({ at: z.string().datetime({ offset: true }).optional() });

@Controller('v1/safety')
export class OnCallController {
  constructor(
    @Inject(ONCALL_COVERAGE) private readonly oncall: OnCallCoverage,
    @Inject(OUTINGS_REPOSITORY) private readonly repo: OutingsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Get('oncall')
  async status(@CurrentUser() u: AuthenticatedUser, @Query(new ZodPipe(Q)) q: z.infer<typeof Q>) {
    const at = q.at ? new Date(q.at) : this.clock.now();
    const tz = (await this.repo.requester(null, u.userId, this.clock.now()))?.neighborhood?.timezone ?? 'Europe/Paris';
    const covered = await this.oncall.covered(tz, at, new Date(at.getTime() + 60_000));
    return { covered, ...(covered ? { responseMinutes: DEFAULT_TUNING.safety.humanResponseMinutes } : {}) };
  }
}
