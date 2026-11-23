import type { HealthDto } from '@blowy/contract';
import { Controller, Get, Inject } from '@nestjs/common';
import type { Env } from '../../../config/env';
import type { ImageProcessor } from '../../../integrations/images/ports';
import { Public } from '../../../shared/auth.guard';
import { ENV, IMAGES } from '../../../shared/tokens';

/**
 * Contrôle de vie de l'hébergeur (railway.json) ; dit aussi l'environnement (`local`, `staging`, `production`) et
 * l'état du traitement d'image (essai de sharp au démarrage), rien de plus. Reste `ok: true` même si sharp échoue :
 * l'API sert tout le reste, seuls les visages flous manquent (minimoa à la place).
 */
@Public()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(IMAGES) private readonly images: ImageProcessor,
  ) {}

  @Get()
  health(): HealthDto {
    return { ok: true, env: this.env.env, images: this.images.status() };
  }
}
