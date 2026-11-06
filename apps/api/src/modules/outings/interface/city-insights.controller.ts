/** V5.5 (D-059) : `GET /v1/me/city-insights` — indicateurs de MA ville, ≥ 10, arrondis, photographie quotidienne. */
import { Controller, Get, Inject } from '@nestjs/common';
import { CityInsightsViewSchema } from '@blowy/api-contract';
import { CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { CityInsights } from '../infrastructure/city-insights.js';

@Controller('v1/me')
export class CityInsightsController {
  constructor(@Inject(CityInsights) private readonly insights: CityInsights) {}

  @Get('city-insights')
  async get(@CurrentUser() u: AuthenticatedUser) {
    return CityInsightsViewSchema.parse(await this.insights.forUser(u.userId));
  }
}
