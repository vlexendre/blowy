import { type AppConfig, AppConfigQuery } from '@blowy/contract';
import { isAppPlatform } from '@blowy/domain';
import { Controller, Get, Inject, Query } from '@nestjs/common';
import type { z } from 'zod';
import type { Env } from '../../../config/env';
import { Public } from '../../../shared/auth.guard';
import { ClientApp, type ClientAppInfo } from '../../../shared/client-app';
import { ENV } from '../../../shared/tokens';
import { ZodPipe } from '../../../shared/zod.pipe';

/**
 * `GET /v1/app/config` (public, jamais bloqué) : build minimum servi, dernier build publié et fiche du magasin, pour la
 * plateforme de l'appelant (en-tête `x-app-platform`, ou `?platform=ios`).
 */
@Public()
@Controller('v1/app')
export class AppConfigController {
  constructor(@Inject(ENV) private readonly env: Env) {}

  @Get('config')
  config(@ClientApp() client: ClientAppInfo, @Query(new ZodPipe(AppConfigQuery)) query: z.infer<typeof AppConfigQuery>): AppConfig {
    const asked = query.platform?.trim().toLowerCase();
    const platform = isAppPlatform(asked) ? asked : client.platform;
    if (!platform) return { platform: null, minSupportedBuild: 0, latestBuild: 0, storeUrl: null };
    const v = this.env.appVersions[platform];
    return { platform, minSupportedBuild: v.minSupportedBuild, latestBuild: v.latestBuild, storeUrl: v.storeUrl };
  }
}
