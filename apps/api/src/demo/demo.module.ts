import { type DynamicModule, Module } from '@nestjs/common';
import { EncountersModule } from '../modules/encounters/encounters.module';
import { LinksModule } from '../modules/links/links.module';
import type { OnboardedHook } from '../modules/me/ports';
import { PetsModule } from '../modules/pets/pets.module';
import { ONBOARDED_HOOK } from '../shared/tokens';
import { DemoWorld } from './demo-world';

const noHook: OnboardedHook = { onOnboarded: async () => undefined };

/** Fournit le crochet d'inscription : le monde de démo en local, rien sinon. */
@Module({})
export class DemoModule {
  static forRoot(enabled: boolean): DynamicModule {
    if (!enabled) {
      return { module: DemoModule, global: true, providers: [{ provide: ONBOARDED_HOOK, useValue: noHook }], exports: [ONBOARDED_HOOK] };
    }
    return {
      module: DemoModule,
      global: true,
      imports: [PetsModule, LinksModule, EncountersModule],
      providers: [DemoWorld, { provide: ONBOARDED_HOOK, useExisting: DemoWorld }],
      exports: [ONBOARDED_HOOK],
    };
  }
}
