import { Global, Module } from '@nestjs/common';
import type { Env } from '../../config/env';
import type { Db } from '../../persistence/database.types';
import type { MemoryStorage } from '../../integrations/storage/memory-storage';
import { ENV, STORAGE, SUPABASE } from '../../shared/tokens';
import { MemoryProofImages, SupabaseProofImages } from '../rituels/infrastructure/adapters';
import type { ProofImages } from '../rituels/ports';
import { AvatarModeration } from './avatar-moderation';
import { ContentFilter } from './content-filter';
import { ModerationJobs } from './moderation.jobs';
import { PHOTO_IMAGES, PhotoCheck } from './photo-check';
import { ReportAlerts } from './report-alerts';
import { ReportDesk } from './report-desk';

/**
 * Filtre des contenus et suite des signalements (audit App Store B6 et M9), global : les modules qui publient du texte
 * ou une photo (liens, profil, minimoa, signalements) passent par `ContentFilter`, `AvatarModeration` et `ReportDesk`.
 */
@Global()
@Module({
  providers: [
    {
      provide: PHOTO_IMAGES,
      useFactory: (env: Env, storage: unknown, client: Db | undefined): ProofImages =>
        env.adapters === 'memory' || !client ? new MemoryProofImages(storage as MemoryStorage) : new SupabaseProofImages(client),
      inject: [ENV, STORAGE, { token: SUPABASE, optional: true }],
    },
    PhotoCheck,
    ReportAlerts,
    ReportDesk,
    ContentFilter,
    AvatarModeration,
    ModerationJobs,
  ],
  exports: [ContentFilter, ReportDesk, AvatarModeration, ReportAlerts, ModerationJobs],
})
export class ModerationModule {}
