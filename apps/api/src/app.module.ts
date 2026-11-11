import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import type { Env } from './config/env';
import { type CoreOverrides, CoreModule } from './core.module';
import { DemoModule } from './demo/demo.module';
import { DevMediaController } from './integrations/storage/dev-media.controller';
import { EncountersModule } from './modules/encounters/encounters.module';
import { HealthModule } from './modules/health/health.module';
import { InvitesModule } from './modules/invites/invites.module';
import { LinksModule } from './modules/links/links.module';
import { MeModule } from './modules/me/me.module';
import { PetsModule } from './modules/pets/pets.module';
import { SafetyModule } from './modules/safety/safety.module';
import { WordsModule } from './modules/words/words.module';
import { AuthGuard } from './shared/auth.guard';
import { ErrorFilter } from './shared/error.filter';

@Module({})
export class AppModule {
  static forRoot(env: Env, overrides: CoreOverrides = {}): DynamicModule {
    return {
      module: AppModule,
      imports: [
        CoreModule.forRoot(env, overrides),
        DemoModule.forRoot(env.demo),
        HealthModule,
        MeModule,
        PetsModule,
        LinksModule,
        EncountersModule,
        InvitesModule,
        WordsModule,
        SafetyModule,
      ],
      // Envoi et lecture des médias en mode mémoire seulement (imite les URL signées de Supabase).
      controllers: env.adapters === 'memory' ? [DevMediaController] : [],
      providers: [
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_FILTER, useClass: ErrorFilter },
      ],
    };
  }
}
