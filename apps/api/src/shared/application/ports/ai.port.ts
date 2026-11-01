/**
 * Ports IA transverses (agent E). Les services IA de @blowy/ai sont injectés via AI_SERVICES ;
 * `providers === null` ⇒ aucun fournisseur : rien n'est approuvé, fallback éditorial.
 */
import type { AiProviders, AiRunner } from '@blowy/ai';

export interface AiServices {
  providers: AiProviders | null;
  runner: AiRunner;
  /** Honnêteté envers le client : LIVE (OpenAI), LOCAL_DEMO (déterministe), NOT_CONFIGURED. */
  mode: 'LIVE' | 'LOCAL_DEMO' | 'NOT_CONFIGURED';
  /** Libellé fournisseur affiché dans l'information de consentement. */
  providerLabel: string;
}
export const AI_SERVICES = Symbol.for('blowy.ai.services');

/** File de tâches IA : BullMQ dans le worker (timeout, retries bornés, backoff, concurrence), inline en test. */
export interface AiTaskQueue {
  register(name: string, handler: (payload: Record<string, unknown>) => Promise<void>): void;
  /** `key` = identifiant métier (déduplication du job). */
  enqueue(name: string, key: string, payload: Record<string, unknown>): Promise<void>;
}
export const AI_TASK_QUEUE = Symbol.for('blowy.ai.taskQueue');
