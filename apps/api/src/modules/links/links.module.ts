import { Module } from '@nestjs/common';
import { PetsModule } from '../pets/pets.module';
import { ArchiveLink } from './application/archive-link.usecase';
import { CreateLink } from './application/create-link.usecase';
import { GetLink } from './application/get-link.usecase';
import { GetMemories } from './application/get-memories.usecase';
import { LinkSession } from './application/link-session';
import { ListLinks } from './application/list-links.usecase';
import { ListMessages } from './application/list-messages.usecase';
import { MarkRead } from './application/mark-read.usecase';
import { PhotoTicket } from './application/photo-ticket.usecase';
import { ReviveLink } from './application/revive-link.usecase';
import { SendMessage } from './application/send-message.usecase';
import { SendPhoto } from './application/send-photo.usecase';
import { LinkPresenter } from './interface/link.presenter';
import { LinksController } from './interface/links.controller';

@Module({
  imports: [PetsModule],
  controllers: [LinksController],
  providers: [
    LinkSession,
    LinkPresenter,
    CreateLink,
    ListLinks,
    GetLink,
    ArchiveLink,
    ListMessages,
    SendMessage,
    MarkRead,
    ReviveLink,
    PhotoTicket,
    SendPhoto,
    GetMemories,
  ],
  exports: [CreateLink, LinkPresenter, SendMessage],
})
export class LinksModule {}
