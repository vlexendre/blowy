/**
 * Travaux lancés après la réponse (appel d'IA du chat, envoi de push) : la requête ne les attend pas.
 * Une erreur est journalisée, jamais renvoyée. `settle()` attend ceux en cours (tests, arrêt propre).
 * Plusieurs instances : chacune exécute les siens ; rien n'est partagé.
 */
import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class Background implements OnApplicationShutdown {
  private readonly logger = new Logger('Arrière-plan');
  private readonly running = new Set<Promise<void>>();

  run(what: string, task: () => Promise<unknown>): void {
    const p: Promise<void> = Promise.resolve()
      .then(task)
      .then(
        () => undefined,
        (err: unknown) => this.logger.warn(`${what} : ${err instanceof Error ? err.message : 'erreur inconnue'}`),
      )
      .finally(() => this.running.delete(p));
    this.running.add(p);
  }

  /** Attend que tout ce qui tourne (et ce que ça lance) soit fini. */
  async settle(): Promise<void> {
    while (this.running.size > 0) await Promise.all([...this.running]);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.settle();
  }
}
