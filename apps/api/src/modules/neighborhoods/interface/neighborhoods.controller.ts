import { Body, Controller, Get, Inject, Put, Query } from '@nestjs/common';
import { NeighborhoodListSchema, NeighborhoodSearchQuerySchema, NeighborhoodStatusViewSchema, SetNeighborhoodRequestSchema, type SetNeighborhoodRequest } from '@blowy/api-contract';
import { CommandId, CurrentUser } from '../../../shared/interface/decorators.js';
import type { AuthenticatedUser } from '../../../shared/interface/request-context.js';
import { ZodPipe } from '../../../shared/interface/zod.pipe.js';
import { NeighborhoodsUseCases } from '../application/neighborhoods.use-cases.js';

@Controller('v1')
export class NeighborhoodsController {
  constructor(@Inject(NeighborhoodsUseCases) private readonly uc: NeighborhoodsUseCases) {}

  /** « Tu sors où ? » : saisie libre avec suggestions, jamais de géolocalisation. */
  @Get('neighborhoods')
  async list(@Query(new ZodPipe(NeighborhoodSearchQuerySchema)) q: { q?: string }) {
    return NeighborhoodListSchema.parse(await this.uc.list(q.q));
  }

  @Get('me/neighborhood')
  async mine(@CurrentUser() u: AuthenticatedUser) {
    return NeighborhoodStatusViewSchema.parse(await this.uc.status(u.userId));
  }

  @Put('me/neighborhood')
  async set(@CurrentUser() u: AuthenticatedUser, @CommandId() cid: string, @Body(new ZodPipe(SetNeighborhoodRequestSchema)) b: SetNeighborhoodRequest) {
    return NeighborhoodStatusViewSchema.parse(await this.uc.set(u.userId, b.neighborhoodId, cid));
  }
}
