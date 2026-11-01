/** Entrypoint HTTP + WebSocket (déployable séparément du worker). */
import { loadConfig } from './config/env.js';
import { attachRealtime, buildApp } from './bootstrap.js';
import { createRedis } from './shared/infrastructure/redis/redis.js';
import { createLogger } from './shared/infrastructure/logging/logger.js';

const config = loadConfig();
const log = createLogger(config.LOG_LEVEL, { entry: 'main' });
const redis = createRedis(config.REDIS_URL);
const app = await buildApp({ config, redis });
await app.init();
const realtime = attachRealtime(app, config.corsOrigins);
await realtime.attachRedis(createRedis(config.REDIS_URL));
await app.listen(config.PORT, config.HOST);
log.info({ port: config.PORT, env: config.BLOWY_ENV, auth: config.AUTH_PROVIDER }, 'api_listening');

for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.once(sig, () => {
    log.info({ sig }, 'api_shutdown');
    void realtime.close().then(() => app.close()).then(() => redis.quit()).finally(() => process.exit(0));
  });
}
