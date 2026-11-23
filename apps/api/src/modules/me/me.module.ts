import { Module } from '@nestjs/common';
import { LinksModule } from '../links/links.module';
import { PetsModule } from '../pets/pets.module';
import { VisionModule } from '../vision/vision.module';
import { RituelsModule } from '../rituels/rituels.module';
import { Avatar } from './application/avatar.usecase';
import { AvatarBlurJobs } from './application/avatar-blur.jobs';
import { DeleteMe } from './application/delete-me.usecase';
import { GetMe } from './application/get-me.usecase';
import { Onboard } from './application/onboard.usecase';
import { UpdateMe } from './application/update-me.usecase';
import { OrphanMediaJobs } from './application/orphan-media.jobs';
import { MeController } from './interface/me.controller';
import { MePresenter } from './interface/me.presenter';

@Module({
  imports: [PetsModule, LinksModule, VisionModule, RituelsModule],
  controllers: [MeController],
  providers: [GetMe, Onboard, UpdateMe, DeleteMe, Avatar, AvatarBlurJobs, OrphanMediaJobs, MePresenter],
  // Le semis d'un environnement de test inscrit ses comptes par le vrai cas d'usage (demo/seed).
  exports: [Onboard],
})
export class MeModule {}
