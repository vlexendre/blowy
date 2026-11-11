import { Module } from '@nestjs/common';
import { LinksModule } from '../links/links.module';
import { Invites } from './application/invites.usecase';
import { InvitesController } from './interface/invites.controller';

@Module({
  imports: [LinksModule],
  controllers: [InvitesController],
  providers: [Invites],
})
export class InvitesModule {}
