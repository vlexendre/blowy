/** Créneaux du minuteur déjà traités (idempotence d'un tick répété). */
export const TICK_RUNS = Symbol('TICK_RUNS');

export interface TickRunsRepository {
  /** Réserve le créneau pour ce travail ; faux s'il l'était déjà. */
  claim(job: string, slot: string, at: string): Promise<boolean>;
  finish(job: string, slot: string, at: string, done: number): Promise<void>;
  purge(before: string): Promise<number>;
}
