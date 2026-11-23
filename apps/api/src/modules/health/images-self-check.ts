import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { ImageProcessor } from '../../integrations/images/ports';
import { IMAGES } from '../../shared/tokens';

/**
 * Au démarrage, essaie le traitement d'image (sharp en mode supabase ; immédiat en mémoire) sans retarder l'écoute :
 * un échec est journalisé en erreur par l'adaptateur et visible dans `GET /health` (`images: 'failed'`).
 */
@Injectable()
export class ImagesSelfCheck implements OnApplicationBootstrap {
  constructor(@Inject(IMAGES) private readonly images: ImageProcessor) {}

  onApplicationBootstrap(): void {
    void this.images.selfCheck().catch(() => undefined);
  }
}
