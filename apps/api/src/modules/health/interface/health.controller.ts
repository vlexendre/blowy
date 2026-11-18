import type { HealthDto } from '@blowy/contract';
import { Controller, Get, Inject } from '@nestjs/common';
import type { Env } from '../../../config/env';
import { Public } from '../../../shared/auth.guard';
import { ENV } from '../../../shared/tokens';

/** Contrôle de vie de l'hébergeur (railway.json) ; dit aussi l'environnement (`local`, `staging`, `production`), rien de plus. */
@Public()
@Controller('health')
export class HealthController {
  constructor(@Inject(ENV) private readonly env: Env) {}

  @Get()
  health(): HealthDto {
    return { ok: true, env: this.env.env };
  }
}
