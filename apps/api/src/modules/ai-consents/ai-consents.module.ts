import { Module } from '@nestjs/common';
import { AiConsents } from './application/ai-consents.service';
import { AiConsentsController } from './interface/ai-consents.controller';

/** Accords pour l'IA tierce (audit B5). Le dépôt est global (CoreModule). */
@Module({
  controllers: [AiConsentsController],
  providers: [AiConsents],
  exports: [AiConsents],
})
export class AiConsentsModule {}
