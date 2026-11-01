/**
 * Pattern Observer interdomaine via outbox : un consommateur déclare les topics qu'il traite.
 * Livraison au moins une fois ; l'effet est appliqué une seule fois grâce à
 * ConsumerDeduplication (consumer, eventId) écrit dans la même transaction que l'effet.
 */
import type { TxScope } from './unit-of-work.js';

export interface OutboxEnvelope {
  id: string;
  topic: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

/** Effet transactionnel : appliqué une seule fois (ConsumerDeduplication dans la même transaction). */
export interface OutboxConsumer {
  /** Nom stable (clé de déduplication). */
  readonly name: string;
  readonly topics: readonly string[];
  handle(scope: TxScope, event: OutboxEnvelope): Promise<void>;
}

/**
 * Effet externe (appel fournisseur, diffusion WS) : exécuté HORS transaction, avant le
 * marquage publié ; doit être idempotent par l'état (ex. message encore PENDING) ou
 * dédupliqué côté récepteur (eventId). Un échec → nouvelle tentative avec backoff.
 */
export interface OutboxEffect {
  readonly name: string;
  readonly topics: readonly string[];
  run(event: OutboxEnvelope): Promise<void>;
}
export const OUTBOX_EFFECTS = Symbol('OutboxEffects');
export const OUTBOX_CONSUMERS = Symbol('OutboxConsumers');
