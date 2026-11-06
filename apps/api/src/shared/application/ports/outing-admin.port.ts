/**
 * Port « exploitation des sorties » (spec-v5 §10.1 / §10.2, T6), fourni par `outings` (seul écrivain
 * des sorties, places et de la fiabilité), consommé par le module `admin` (staff `ops`, lieu partenaire).
 * Toutes les méthodes s'exécutent dans la transaction de l'appelant (CommandBus + AuditLog) ; le port
 * prend lui-même les verrous `users` puis `outings` dans l'ordre global. Aucun appel réseau : les
 * remboursements passent par le port de financement (economy), exécutés hors verrou par outbox/job.
 */
import type { TxScope } from '../unit-of-work.js';

export type OutingAdminCancelReason = 'STAFF' | 'VENUE_UNAVAILABLE';

export interface OutingAdminPort {
  /**
   * Annule une sortie non terminée (`* → CANCELLED`, §2.6) : places actives remboursées (carte /
   * 1ʳᵉ sortie qui reste offerte), aucun effet de fiabilité, chat fermé, outbox `outing.cancelled`.
   * null si la sortie est introuvable ou déjà terminale (DONE / CANCELLED).
   */
  cancelOuting(scope: TxScope, i: { outingId: string; reason: OutingAdminCancelReason }): Promise<{ affectedSeats: number } | null>;
  /** Retrait d'une place par le staff : `SYSTEM_REMOVAL`, remboursée, sans fiabilité. null si la place n'est pas active. */
  removeSeat(scope: TxScope, i: { seatId: string }): Promise<{ outingId: string; refundState: string } | null>;
  /**
   * Contestation de présence (§2.15) : acceptée → l'absence est retirée (no-show → présent·e,
   * annulation tardive décomptée), pause levée si elle en découlait ; refusée → rien ne change.
   * null si la contestation est introuvable ou déjà tranchée.
   */
  resolveDispute(scope: TxScope, i: { disputeId: string; accept: boolean; staffUserId: string }): Promise<{ seatId: string; userId: string; status: 'ACCEPTED' | 'REJECTED'; corrected: 'NO_SHOW' | 'LATE_CANCEL' | null } | null>;
  /** Lève une pause de fiabilité en cours (décision staff motivée). false si aucune pause active. */
  liftPause(scope: TxScope, i: { userId: string }): Promise<boolean>;
  /** Code du chevalet (4 chiffres) d'un créneau, dérivé du secret du lieu (jamais stocké). */
  venueCode(secretRef: string, startsAt: Date): string;
}
export const OUTING_ADMIN_PORT = Symbol.for('blowy.outings.admin');
