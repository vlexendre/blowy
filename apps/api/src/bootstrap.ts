/**
 * Construction de l'application HTTP/WS (partagée par main.ts et les tests d'intégration).
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Redis } from 'ioredis';
import { AppModule } from './app.module.js';
import type { AppConfig } from './config/env.js';
import type { CoreOverrides } from './shared/core.module.js';
import { CLOCK, LOGGER, PARTICIPATION_READER, PROJECTION_READER, SESSION_RESOLVER } from './shared/shared.tokens.js';
import type { Clock } from './shared/application/clock.js';
import { RealtimeGateway } from './realtime/realtime.gateway.js';
import type { SessionResolver } from './shared/interface/auth.guard.js';
import type { ParticipationReader } from './shared/application/ports/participation.reader.js';
import type { ProjectionReader } from './shared/application/projection.js';
import { OUTING_ROOMS, type OutingRooms } from './modules/outings/outings.module.js';
import { CONVERSATION_REPOSITORY, type ConversationRepository } from './modules/conversations/application/ports/conversation.repository.js';
import type { Logger } from './shared/infrastructure/logging/logger.js';
import { requestIdMiddleware } from './shared/interface/request-id.middleware.js';
import { rawBodyMiddleware } from './shared/interface/raw-body.middleware.js';
import { MemoryRateLimiter, RedisRateLimiter, rateLimitMiddleware } from './shared/interface/rate-limit.js';

export interface BuildOptions {
  config: AppConfig;
  redis: Redis | null;
  overrides?: CoreOverrides;
}

export async function buildApp(opts: BuildOptions): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(opts), { logger: false, bufferLogs: false, rawBody: true });
  const logger = app.get<Logger>(LOGGER);
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.enableCors({ origin: opts.config.corsOrigins.length ? opts.config.corsOrigins : false, credentials: false });
  app.use(requestIdMiddleware(logger));
  const clock = app.get<Clock>(CLOCK);
  const limiter = opts.redis ? new RedisRateLimiter(opts.redis, clock) : new MemoryRateLimiter(clock);
  app.use(rateLimitMiddleware(limiter, opts.config.RATE_LIMIT_PER_MINUTE));
  // Corps brut conservé pour l'authentification HMAC des webhooks (Veriff signe le corps brut).
  // `rawBody: true` (NestFactory) conserve le corps brut : authentification HMAC des webhooks (Veriff).
  app.useBodyParser('json', { limit: '64kb' });
  // Upload média : octets bruts uniquement sur la route d'upload (taille max contrôlée par session).
  app.use('/v1/media/uploads/', rawBodyMiddleware(26 * 1024 * 1024));
  app.enableShutdownHooks();
  return app;
}

/** Monte la gateway Socket.IO sur le serveur HTTP de l'application. */
export function attachRealtime(app: INestApplication, corsOrigins: string[]): RealtimeGateway {
  return new RealtimeGateway(app.getHttpServer(), {
    sessions: app.get<SessionResolver>(SESSION_RESOLVER),
    participation: app.get<ParticipationReader>(PARTICIPATION_READER),
    conversations: {
      isActiveMember: async (userId, conversationId) => {
        const c = await app.get<ConversationRepository>(CONVERSATION_REPOSITORY).load(null, conversationId);
        return !!c && c.members.some((m) => m.userId === userId && !m.revokedAt);
      },
    },
    outings: app.get<OutingRooms>(OUTING_ROOMS),
    projections: app.get<ProjectionReader>(PROJECTION_READER),
    logger: app.get<Logger>(LOGGER),
    corsOrigins,
    clock: app.get<Clock>(CLOCK),
  });
}
