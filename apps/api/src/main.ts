import { Logger } from '@nestjs/common';
import { createApp } from './app';
import { loadEnv } from './config/env';

const env = loadEnv();
await createApp(env);
new Logger('Minimoa').log(`API prête sur le port ${env.port} (${env.env}, adaptateurs ${env.adapters}${env.demo ? ', démo' : ''})`);
if (env.env === 'staging' && env.resendApiKey && !env.mailAllowList) {
  new Logger('Minimoa').warn('staging avec une clé Resend et sans MAIL_ALLOWLIST : les e-mails partent à tout destinataire (docs/ENVIRONNEMENTS.md)');
}
