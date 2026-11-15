import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import type { Env } from './config/env';
import { type CoreOverrides, CoreModule, devTools } from './core.module';
import { DemoModule } from './demo/demo.module';
import { PlateformeModule } from './integrations/plateforme/plateforme.module';
import { DevMediaController } from './integrations/storage/dev-media.controller';
import { EncountersModule } from './modules/encounters/encounters.module';
import { HealthModule } from './modules/health/health.module';
import { InvitesModule } from './modules/invites/invites.module';
import { LinksModule } from './modules/links/links.module';
import { MeModule } from './modules/me/me.module';
import { PetsModule } from './modules/pets/pets.module';
import { SafetyModule } from './modules/safety/safety.module';
import { RituelsModule } from './modules/rituels/rituels.module';
import { VisionModule } from './modules/vision/vision.module';
import { WordsModule } from './modules/words/words.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthGuard } from './shared/auth.guard';
import { DevClockController } from './shared/dev-clock.controller';
import { ErrorFilter } from './shared/error.filter';

@Module({})
export class AppModule {
  static forRoot(env: Env, overrides: CoreOverrides = {}): DynamicModule {
    return {
      module: AppModule,
      imports: [
        CoreModule.forRoot(env, overrides),
        PlateformeModule.forRoot(env),
        DemoModule.forRoot(env.demo),
        HealthModule,
        MeModule,
        PetsModule,
        LinksModule,
        EncountersModule,
        InvitesModule,
        WordsModule,
        SafetyModule,
        VisionModule,
        RituelsModule,
        BillingModule,
        AdminModule.forRoot({ demo: env.demo }),
      ],
      // Mode mémoire : envoi et lecture des médias (imite les URL signées de Supabase) ;
      // en local seulement, l'avance du temps.
      controllers: [...(env.adapters === 'memory' ? [DevMediaController] : []), ...(devTools(env) ? [DevClockController] : [])],
      providers: [
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_FILTER, useClass: ErrorFilter },
      ],
    };
  }
}
