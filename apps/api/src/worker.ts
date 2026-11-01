/**
 * Entrypoint worker (déployable séparément) : relais outbox rejouable, jobs planifiés via
 * BullMQ (job schedulers Redis : une seule instance exécute chaque occurrence), arrêt gracieux.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Queue, Worker } from 'bullmq';
import type { Db } from '@blowy/database';
import { AppModule } from './app.module.js';
import { loadConfig } from './config/env.js';
import { buildWorkerGraph } from './jobs/worker-runtime.js';
import { runOnce } from './jobs/scheduler.js';
import { RealtimeRelayEffect, redisPublish } from './realtime/redis-realtime.publisher.js';
import { createLogger } from './shared/infrastructure/logging/logger.js';
import { createRedis } from './shared/infrastructure/redis/redis.js';
import { DB } from './shared/shared.tokens.js';
import { AI_TASK_QUEUE } from './shared/application/ports/ai.port.js';
import type { SwitchableAiTaskQueue } from './shared/infrastructure/ai/ai-task-queue.js';

const config = loadConfig();
const log = createLogger(config.LOG_LEVEL, { entry: 'worker' });
const redis = createRedis(config.REDIS_URL);
const ctx = await NestFactory.createApplicationContext(AppModule.forRoot({ config, redis }), { logger: false });
const db = ctx.get<Db>(DB);
const graph = buildWorkerGraph(ctx, [new RealtimeRelayEffect(redisPublish(redis))]);

// Jobs récurrents : file BullMQ « blowy-jobs » ; chaque job a un scheduler idempotent.
const connection = { url: config.REDIS_URL };
// Tâches IA : file BullMQ dédiée « blowy-ai » (timeout/retries/backoff/concurrence bornée, échecs conservés).
const aiQueue = ctx.get<SwitchableAiTaskQueue>(AI_TASK_QUEUE);
aiQueue.attachBullMq(connection, 4);
const queue = new Queue('blowy-jobs', { connection });
for (const j of graph.jobs) await queue.upsertJobScheduler(j.name, { every: j.everyMs }, { name: j.name });
const byName = new Map(graph.jobs.map((j) => [j.name, j]));
const worker = new Worker(
  'blowy-jobs',
  async (job) => {
    const def = byName.get(job.name);
    if (!def) return;
    const r = await runOnce(db, def, new Date());
    log.info({ job: job.name, result: r }, 'job_done');
  },
  { connection, concurrency: 2 },
);
worker.on('failed', (job, err) => log.error({ job: job?.name, err: err.message }, 'job_failed'));

// Relais outbox en boucle courte (rejouable : FOR UPDATE SKIP LOCKED + ConsumerDeduplication).
let stopping = false;
const loop = async () => {
  while (!stopping) {
    try {
      const n = await graph.dispatcher.drainOnce(new Date());
      if (n === 0) await new Promise((r) => setTimeout(r, config.WORKER_OUTBOX_POLL_MS));
    } catch (err) {
      log.error({ err: (err as Error).message }, 'outbox_loop_error');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};
const running = loop();
log.info({ jobs: graph.jobs.map((j) => j.name) }, 'worker_started');

for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.once(sig, () => {
    log.info({ sig }, 'worker_shutdown');
    stopping = true;
    void (async () => {
      await worker.close();
      await queue.close();
      await aiQueue.close();
      await running;
      await ctx.close();
      await redis.quit();
      process.exit(0);
    })();
  });
}
