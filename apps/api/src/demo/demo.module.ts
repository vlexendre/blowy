import { type DynamicModule, Module } from '@nestjs/common';
import { EncountersModule } from '../modules/encounters/encounters.module';
import { LinksModule } from '../modules/links/links.module';
import type { OnboardedHook } from '../modules/me/ports';
import { PetsModule } from '../modules/pets/pets.module';
import { VisionModule } from '../modules/vision/vision.module';
import { RituelsModule } from '../modules/rituels/rituels.module';
import { ONBOARDED_HOOK } from '../shared/tokens';
import { DemoWorld } from './demo-world';
import { DevDemoLinksController, LinksDemo } from './links-demo';
import { PlateformeDemo } from './plateforme-demo';
import { RituelsDemo } from './rituels-demo';
import { ReviewWorld } from '../review/review-world';

/** Le compte de revue d'Apple d'abord (son monde d'exemple, partout) ; sinon le monde de démo (local) ou rien. */
const hookWith = (review: ReviewWorld, demo: OnboardedHook | null): OnboardedHook => ({
  onOnboarded: async (userId) => {
    if (await review.claim(userId)) return;
    await demo?.onOnboarded(userId);
  },
});

/** Fournit le crochet d'inscription : le compte de revue (`ReviewModule`, global), puis le monde de démo en local. */
@Module({})
export class DemoModule {
  static forRoot(enabled: boolean): DynamicModule {
    if (!enabled) {
      return {
        module: DemoModule,
        global: true,
        providers: [{ provide: ONBOARDED_HOOK, useFactory: (review: ReviewWorld) => hookWith(review, null), inject: [ReviewWorld] }],
        exports: [ONBOARDED_HOOK],
      };
    }
    return {
      module: DemoModule,
      global: true,
      imports: [PetsModule, LinksModule, EncountersModule, VisionModule, RituelsModule],
      controllers: [DevDemoLinksController],
      providers: [
        DemoWorld,
        RituelsDemo,
        PlateformeDemo,
        LinksDemo,
        { provide: ONBOARDED_HOOK, useFactory: (review: ReviewWorld, demo: DemoWorld) => hookWith(review, demo), inject: [ReviewWorld, DemoWorld] },
      ],
      exports: [ONBOARDED_HOOK],
    };
  }
}
