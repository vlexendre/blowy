/**
 * Port interdomaine « sécurité des sorties » (spec-v5 §2.6 D-025, V5.2 C.10), fourni par `outings`,
 * consommé par `trust` (blocage → retrait système) et `safety` (décision staff « je connais quelqu'un »).
 *
 * Verrous : l'APPELANT tient déjà les verrous `users` des personnes concernées (ordre global
 * users → pets → relationships → … → outings) ; le port ne prend que les verrous `outings`.
 * Aucun appel réseau : le remboursement passe par le port de financement (economy) dans la
 * transaction, l'éventuel appel fournisseur est planifié par outbox.
 */
import type { TxScope } from '../unit-of-work.js';

export interface SystemRemoval {
  outingId: string;
  seatId: string;
  /** État de remboursement de la place retirée (jamais exposé aux autres membres). */
  refundState: string;
}

export interface OutingSafetyPort {
  /**
   * Retrait système : `removedUserId` quitte toute sortie ACTIVE (non terminée) qu'il ou elle partage
   * avec `withUserId`. Remboursé·e intégralement, aucune fiabilité, message neutre identique à toute
   * recomposition ; le groupe voit seulement « ne pourra pas venir ».
   */
  removeFromSharedOutings(scope: TxScope, i: { removedUserId: string; withUserId: string }): Promise<SystemRemoval[]>;
  /**
   * « Je pars, mal à l'aise » (V5.3 B.9) : toujours possible (même après le début, même après le
   * check-in), sans pénalité, remboursé comme une sortie de sécurité. null si aucune place active.
   */
  leaveForSafety(scope: TxScope, i: { userId: string; outingId: string }): Promise<SystemRemoval | null>;
  /** Place concernée par un « je connais quelqu'un » en examen (personne à verrouiller), ou null. */
  knowsSomeoneUnderReview(scope: TxScope | null, seatId: string): Promise<{ userId: string; outingId: string; targetUserId: string } | null>;
  /**
   * Décision humaine sur un « je connais quelqu'un » en examen : accepté → retrait sans pénalité
   * (remboursé, prioritaire) si la sortie n'a pas commencé ; refusé → la place reste.
   */
  resolveKnowsSomeone(scope: TxScope, i: { seatId: string; accept: boolean }): Promise<{ status: 'MOVED' | 'ACCEPTED_TOO_LATE' | 'REJECTED' | 'REVIEWED' } | null>;
}
export const OUTING_SAFETY_PORT = Symbol.for('blowy.outings.safety');
