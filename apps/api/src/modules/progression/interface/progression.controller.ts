import { Controller, Get, Inject } from '@nestjs/common';
import type { Progression } from '@blowy/contract';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { ProgressionService } from '../application/progression.service';

/** Étincelles, ligue de la semaine et trophées (maquette V7). */
@Controller('v1/progression')
export class ProgressionController {
  constructor(@Inject(ProgressionService) private readonly progression: ProgressionService) {}

  @Get()
  get(@CurrentUser() user: AuthUser): Promise<Progression> {
    return this.progression.get(user.userId);
  }
}
