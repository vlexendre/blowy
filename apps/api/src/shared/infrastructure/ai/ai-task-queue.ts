/**
 * File de tâches IA (Strategy) : inline par défaut (tests, API HTTP) ; le worker appelle
 * `attachBullMq` → file BullMQ « blowy-ai » (concurrence bornée, 3 tentatives, backoff
 * exponentiel, jobId = clé métier pour la déduplication, échecs conservés = file d'échecs).
 */
import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import type { AiTaskQueue } from '../../application/ports/ai.port.js';
import type { LoggerPort } from '../../application/logger.port.js';

type Handler = (payload: Record<string, unknown>) => Promise<void>;

export class SwitchableAiTaskQueue implements AiTaskQueue {
  private readonly handlers = new Map<string, Handler>();
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  constructor(private readonly logger: LoggerPort) {}

  register(name: string, handler: Handler): void {
    this.handlers.set(name, handler);
  }

  async enqueue(name: string, key: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.queue) {
      const h = this.handlers.get(name);
      if (!h) throw new Error(`tâche IA inconnue: ${name}`);
      await h(payload);
      return;
    }
    await this.queue.add(name, payload, { jobId: `${name}:${key}`.replace(/:/g, '_'), attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 1000, removeOnFail: 5000 });
  }

  attachBullMq(connection: ConnectionOptions, concurrency = 4): void {
    this.queue = new Queue('blowy-ai', { connection });
    this.worker = new Worker(
      'blowy-ai',
      async (job) => {
        const h = this.handlers.get(job.name);
        if (!h) throw new Error(`tâche IA inconnue: ${job.name}`);
        await h(job.data as Record<string, unknown>);
      },
      { connection, concurrency },
    );
    // Journal sans contenu : nom de tâche et code d'erreur seulement.
    this.worker.on('failed', (job, err) => this.logger.warn({ task: job?.name, attempts: job?.attemptsMade, err: err.name }, 'ai_task_failed'));
  }

  async close(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }
}
