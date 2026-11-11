import { Module } from '@nestjs/common';
import { LinksModule } from '../links/links.module';
import { PetsModule } from '../pets/pets.module';
import { Avatar } from './application/avatar.usecase';
import { DeleteMe } from './application/delete-me.usecase';
import { GetMe } from './application/get-me.usecase';
import { Onboard } from './application/onboard.usecase';
import { UpdateMe } from './application/update-me.usecase';
import { MeController } from './interface/me.controller';
import { MePresenter } from './interface/me.presenter';

@Module({
  imports: [PetsModule, LinksModule],
  controllers: [MeController],
  providers: [GetMe, Onboard, UpdateMe, DeleteMe, Avatar, MePresenter],
})
export class MeModule {}
