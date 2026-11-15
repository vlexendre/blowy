import { Inject, Injectable, Optional } from '@nestjs/common';
import { type AiProcessor, DEFAULT_AI_PROCESSOR, aiProcessorView } from '@blowy/content';
import type { AiConsents as AiConsentsDto } from '@blowy/contract';
import type { Locale } from '@blowy/domain';
import { AI_PROCESSOR } from '../../../integrations/ai/ai-processor';
import type { Clock } from '../../../shared/clock';
import { CLOCK } from '../../../shared/tokens';
import { AI_CONSENTS, type AiConsentsRepository } from '../ports';

/**
 * Accords pour l'IA tierce. Règle : aucune image de preuve ne part au prestataire d'IA sans `proofs === true`
 * (vérifié par `HabitsService` juste avant l'appel). Retirer l'accord est immédiat ; les preuves suivantes ne partent plus.
 */
@Injectable()
export class AiConsents {
  constructor(
    @Inject(AI_CONSENTS) private readonly repo: AiConsentsRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(AI_PROCESSOR) private readonly processor: AiProcessor | null = null,
  ) {}

  /** Vrai seulement si la personne a accepté la vérification de ses preuves par l'IA (et ne l'a pas retirée). */
  async proofsAllowed(userId: string): Promise<boolean> {
    return (await this.repo.proofs(userId)).consent === true;
  }

  async view(userId: string, locale: Locale): Promise<AiConsentsDto> {
    const proofs = await this.repo.proofs(userId);
    return { provider: aiProcessorView(locale, this.processor ?? DEFAULT_AI_PROCESSOR), proofs };
  }

  async setProofs(userId: string, consent: boolean): Promise<void> {
    await this.repo.setProofs(userId, consent, this.clock.now().toISOString());
  }
}
