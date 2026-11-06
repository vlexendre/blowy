/**
 * Fiabilité V5 (spec-v5 §2.14) — projection écrite par `outings` (seul écrivain de `ReliabilityStat`),
 * consommée par `connections` pour les rendez-vous duo (§2.12 : absence comptée, présence comptée),
 * dans la transaction de l'appelant (verrou users tenu). Idempotent par `key`.
 */
import type { TxScope } from '../unit-of-work.js';

export interface ReliabilityPort {
  recordDuoDate(scope: TxScope, i: { userId: string; outcome: 'ATTENDED' | 'NO_SHOW' | 'LATE_CANCEL'; key: string }): Promise<void>;
  /** Pause en cours (bloque propositions duo et nouveaux RDV ; duos et bande restent accessibles). */
  isPaused(scope: TxScope | null, userId: string, at: Date): Promise<boolean>;
}
export const RELIABILITY_PORT = Symbol('ReliabilityPort');
