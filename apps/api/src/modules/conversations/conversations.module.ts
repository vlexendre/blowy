import { Global, Module } from '@nestjs/common';
import type { Db } from '@blowy/database';
import type { AppConfig } from '../../config/env.js';
import type { CommandBus } from '../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../shared/application/clock.js';
import type { EventPublisher } from '../../shared/application/event-publisher.js';
import type { BlockReader } from '../../shared/application/ports/block-reader.port.js';
import type { LinkProgressPort } from '../../shared/application/ports/link-progress.port.js';
import type { UnitOfWork } from '../../shared/application/unit-of-work.js';
import type { Logger } from '../../shared/infrastructure/logging/logger.js';
import { APP_CONFIG, BLOCK_READER, CLOCK, COMMAND_BUS, DB, EVENT_PUBLISHER, LINK_PROGRESS_PORT, LOGGER, RANDOM, UNIT_OF_WORK } from '../../shared/shared.tokens.js';
import { CONVERSATION_ADMIN } from '../relationships/application/ports/relationship-side-effects.port.js';
import { USER_PROFILE_REPOSITORY } from '../users/application/ports/user-profile.repository.js';
import { ModerateMessageUseCase } from './application/moderate-message.use-case.js';
import { CONVERSATION_REPOSITORY, type ConversationRepository } from './application/ports/conversation.repository.js';
import { MODERATION_GATEWAY, type ModerationGateway } from './application/ports/moderation.gateway.js';
import { ReadMessagesQuery } from './application/read-messages.query.js';
import { MarkReadUseCase, RevealWarnedUseCase } from './application/reveal-warned.use-case.js';
import { SendMessageUseCase, type ConsentFacts } from './application/send-message.use-case.js';
import { ConversationAdminAdapter } from './infrastructure/conversation-admin.adapter.js';
import { LocalModerationGateway, UnavailableModerationGateway } from './infrastructure/local-moderation.gateway.js';
import { PrismaConversationRepository } from './infrastructure/prisma-conversation.repository.js';
import { ConversationsController } from './interface/conversations.controller.js';

/** Strategy : modération locale hors production ; sinon adapter réel (agent E) ou indisponible. */
function selectModeration(cfg: AppConfig): ModerationGateway {
  return cfg.MODERATION_PROVIDER === 'local' && !cfg.isProduction ? new LocalModerationGateway(cfg.isProduction) : new UnavailableModerationGateway();
}

type R = ConversationRepository;
@Global()
@Module({
  controllers: [ConversationsController],
  providers: [
    { provide: CONVERSATION_REPOSITORY, useFactory: (db: Db) => new PrismaConversationRepository(db), inject: [DB] },
    { provide: MODERATION_GATEWAY, useFactory: selectModeration, inject: [APP_CONFIG] },
    { provide: CONVERSATION_ADMIN, useFactory: (r: R) => new ConversationAdminAdapter(r), inject: [CONVERSATION_REPOSITORY] },
    {
      provide: SendMessageUseCase,
      useFactory: (b: CommandBus, r: R, bl: BlockReader, c: ConsentFacts, rnd: RandomSource, clock: Clock) => new SendMessageUseCase(b, r, bl, c, rnd, () => clock.now()),
      inject: [COMMAND_BUS, CONVERSATION_REPOSITORY, BLOCK_READER, USER_PROFILE_REPOSITORY, RANDOM, CLOCK],
    },
    {
      provide: ModerateMessageUseCase,
      useFactory: (u: UnitOfWork, r: R, m: ModerationGateway, e: EventPublisher, l: LinkProgressPort, log: Logger) => new ModerateMessageUseCase(u, r, m, e, l, log),
      inject: [UNIT_OF_WORK, CONVERSATION_REPOSITORY, MODERATION_GATEWAY, EVENT_PUBLISHER, LINK_PROGRESS_PORT, LOGGER],
    },
    { provide: ReadMessagesQuery, useFactory: (r: R) => new ReadMessagesQuery(r), inject: [CONVERSATION_REPOSITORY] },
    { provide: RevealWarnedUseCase, useFactory: (b: CommandBus, r: R) => new RevealWarnedUseCase(b, r), inject: [COMMAND_BUS, CONVERSATION_REPOSITORY] },
    { provide: MarkReadUseCase, useFactory: (b: CommandBus, r: R) => new MarkReadUseCase(b, r), inject: [COMMAND_BUS, CONVERSATION_REPOSITORY] },
  ],
  exports: [CONVERSATION_ADMIN, ModerateMessageUseCase, CONVERSATION_REPOSITORY, MODERATION_GATEWAY],
})
export class ConversationsModule {}
