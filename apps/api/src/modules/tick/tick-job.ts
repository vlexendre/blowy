/**
 * Travail planifié appelé par le minuteur (`POST /internal/tick`).
 * `runDue` doit être idempotent : deux appels rapprochés ne doivent rien envoyer ni écrire deux fois.
 * Il traite par lots et s'arrête de lui-même quand `deadline` (ms epoch) est dépassée ; le reste passe au tick suivant.
 * Il rend le nombre d'éléments traités (facultatif, pour le journal).
 */
export interface TickJob {
  runDue(now: Date, deadline?: number): Promise<number | void>;
}

/** Classe injectable (Nest) d'un travail planifié. */
export type TickJobClass = abstract new (...args: never[]) => TickJob;
