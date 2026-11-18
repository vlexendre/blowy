import { Module } from '@nestjs/common';
import type { Env } from '../../config/env';
import { EncountersModule } from '../../modules/encounters/encounters.module';
import { GroupsModule } from '../../modules/groups/groups.module';
import { LinksModule } from '../../modules/links/links.module';
import { MeModule } from '../../modules/me/me.module';
import { PetsModule } from '../../modules/pets/pets.module';
import { RituelsModule } from '../../modules/rituels/rituels.module';
import { VisionModule } from '../../modules/vision/vision.module';
import type { Db } from '../../persistence/database.types';
import type { MemoryDb } from '../../persistence/memory-db';
import { ENV, MEMORY_DB, SUPABASE } from '../../shared/tokens';
import { SEED_STORE } from './ports';
import { MemorySeedStore, SupabaseSeedStore } from './seed-stores';
import { Seeder } from './seeder';

/**
 * Semis d'un environnement de test (docs/SEED-TEST.md). Jamais chargé en production : la démo locale l'importe
 * (`BLOWY_SEED_CITIES`), et le script `pnpm --filter @blowy/api seed:test` le monte dans son propre contexte.
 */
@Module({
  imports: [MeModule, PetsModule, LinksModule, EncountersModule, GroupsModule, RituelsModule, VisionModule],
  providers: [
    {
      provide: SEED_STORE,
      useFactory: (env: Env, db: MemoryDb | undefined, client: Db | undefined) => {
        if (env.env === 'production') throw new Error('semis refusé : API configurée pour la production');
        if (env.adapters === 'memory' && db) return new MemorySeedStore(db);
        if (env.adapters === 'supabase' && client) return new SupabaseSeedStore(client);
        throw new Error('semis : base introuvable');
      },
      inject: [ENV, { token: MEMORY_DB, optional: true }, { token: SUPABASE, optional: true }],
    },
    Seeder,
  ],
  exports: [Seeder],
})
export class SeedModule {}
