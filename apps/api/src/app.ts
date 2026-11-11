import 'reflect-metadata';
import type { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import type { Env } from './config/env';
import type { CoreOverrides } from './core.module';
import type { PublicUrl } from './integrations/storage/ports';
import { PUBLIC_URL } from './shared/tokens';

export interface CreateAppOptions extends CoreOverrides {
  logger?: false | LogLevel[];
}

/** Construit et démarre l'API (utilisé par `main.ts` et par les tests de bout en bout). */
export async function createApp(env: Env, options: CreateAppOptions = {}): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(env, { clock: options.clock }), {
    bodyParser: false,
    logger: options.logger ?? ['log', 'warn', 'error'],
  });
  app.useBodyParser('json', { limit: '100kb' });
  if (env.adapters === 'memory') app.useBodyParser('raw', { type: ['image/*', 'application/octet-stream'], limit: '8mb' });
  // Derrière le proxy de l'hébergeur : l'IP réelle sert au limiteur de la page « 3 mots ».
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.enableCors({ origin: env.corsOrigins, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'], allowedHeaders: ['authorization', 'content-type'] });
  app.enableShutdownHooks();
  await app.listen(env.port);
  if (env.port === 0) {
    const address = app.getHttpServer().address();
    const port = typeof address === 'object' && address ? address.port : 0;
    app.get<PublicUrl>(PUBLIC_URL).current = `http://127.0.0.1:${port}`;
  }
  return app;
}
