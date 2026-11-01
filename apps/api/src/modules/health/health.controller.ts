/** Liveness (processus vivant) et readiness (Postgres + Redis joignables). */
import { Controller, Get, HttpCode, Inject, Res } from '@nestjs/common';
import type { Db } from '@blowy/database';
import type { Response } from 'express';
import type { Redis } from 'ioredis';
import { Public } from '../../shared/interface/auth.guard.js';
import { DB, REDIS } from '../../shared/shared.tokens.js';

@Controller('v1')
export class HealthController {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(REDIS) private readonly redis: Redis | null,
  ) {}

  @Public()
  @Get('healthz')
  @HttpCode(200)
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('readyz')
  async ready(@Res({ passthrough: true }) res: Response) {
    const checks: Record<string, 'ok' | 'fail'> = {};
    try {
      await this.db.$queryRawUnsafe('SELECT 1');
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'fail';
    }
    if (this.redis) {
      try {
        checks.redis = (await this.redis.ping()) === 'PONG' ? 'ok' : 'fail';
      } catch {
        checks.redis = 'fail';
      }
    }
    const ok = Object.values(checks).every((v) => v === 'ok');
    res.status(ok ? 200 : 503);
    return { status: ok ? 'ready' : 'degraded', checks };
  }
}
