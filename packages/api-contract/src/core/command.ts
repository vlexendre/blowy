import { z } from 'zod';

/**
 * Toute commande métier porte un en-tête `Idempotency-Key` (commandId UUID).
 * Unicité = (acteur, opération, commandId). Même clé + payload différent => IDEMPOTENCY_CONFLICT.
 * L'acteur provient TOUJOURS de la session, jamais du JSON.
 */
export const IDEMPOTENCY_HEADER = 'idempotency-key';

export const CommandMetaSchema = z.object({
  commandId: z.string().uuid(),
  expectedVersion: z.number().int().nonnegative().optional(),
});
export type CommandMeta = z.infer<typeof CommandMetaSchema>;

/** Réponse standard d'une commande acceptée. */
export const CommandResultSchema = z.object({
  commandId: z.string().uuid(),
  status: z.enum(['APPLIED', 'PENDING', 'REPLAYED']),
  aggregateVersion: z.number().int().nonnegative().optional(),
});
export type CommandResult = z.infer<typeof CommandResultSchema>;
