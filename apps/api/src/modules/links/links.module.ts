import { Module } from '@nestjs/common';
import { PetsModule } from '../pets/pets.module';
import { HabitSharingModule } from '../groups/sharing/habit-sharing.module';
import { ArchiveLink } from './application/archive-link.usecase';
import { CreateLink } from './application/create-link.usecase';
import { GetLink } from './application/get-link.usecase';
import { GetMemories } from './application/get-memories.usecase';
import { LinkSession } from './application/link-session';
import { ListLinks } from './application/list-links.usecase';
import { ListMessages } from './application/list-messages.usecase';
import { MarkRead } from './application/mark-read.usecase';
import { ReviveLink } from './application/revive-link.usecase';
import { SendMessage } from './application/send-message.usecase';
import { WriteReminders } from './application/write-reminders';
import { LinkPresenter } from './interface/link.presenter';
import { LinksController } from './interface/links.controller';
import { ChatMinimoas } from './minimoas/chat-minimoas';
import { LinkJobs } from './minimoas/link-jobs';
import { LinkMinimoasController } from './minimoas/link-minimoas.controller';

@Module({
  imports: [PetsModule, HabitSharingModule],
  controllers: [LinksController, LinkMinimoasController],
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
    GetMemories,
    ChatMinimoas,
    LinkJobs,
    WriteReminders,
  ],
  exports: [CreateLink, LinkPresenter, SendMessage, ChatMinimoas, LinkJobs],
})
export class LinksModule {}
