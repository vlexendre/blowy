import { Logger } from '@nestjs/common';
import { createApp } from './app';
import { loadEnv } from './config/env';

const env = loadEnv();
await createApp(env);
new Logger('Blowy').log(`API prête sur le port ${env.port} (${env.env}, adaptateurs ${env.adapters}${env.demo ? ', démo' : ''})`);
