/**
 * Règles de place (spec-v5 §2.6, V5.1 E.16, V5.2 C.8) : statuts confirmés, aperçu d'annulation et mode de
 * remboursement. `EARLY` = avant la révélation des visages → recrédit ; `LATE` = après →
 * comptée comme absence, sans remboursement ; motif sécurité → remboursé, aucun effet de fiabilité.
 */
import { CONFIRMED_SEAT_STATUSES, type RefundMode, type RefundState, type SeatCancelRequestKind, type SeatFunding, type SeatStatus } from '@blowy/domain';
import { cancelKindAt } from '@blowy/pet-engine';

export const isConfirmedLike = (s: SeatStatus): boolean => CONFIRMED_SEAT_STATUSES.includes(s);
/** Places qui comptent dans `confirmed` avant la sortie (CONFIRMED, CHECKED_IN). */
export const countsAsConfirmed = (s: SeatStatus): boolean => s === 'CONFIRMED' || s === 'CHECKED_IN' || s === 'ATTENDED';
export const isPending = (s: SeatStatus): boolean => s === 'INVITED' || s === 'HELD';
/** Places qui occupent la capacité (I-O1 : une invitation réserve une place). */
export const occupiesCapacity = (s: SeatStatus): boolean => isPending(s) || isConfirmedLike(s) || s === 'NO_SHOW';

/** Mode de remboursement d'un financement en cas d'annulation remboursable. */
export function refundModeFor(funding: SeatFunding | null): RefundMode {
  if (funding === 'PAID') return 'CARD';
  if (funding === 'FREE_FIRST' || funding === 'PLUS_INCLUDED' || funding === 'CREDIT') return 'CREDIT';
  return 'NONE';
}

/** État de remboursement à écrire pour un mode donné (CARD : traité par le fournisseur, T3). */
export function refundStateFor(mode: RefundMode, refundable: boolean): RefundState {
  if (!refundable) return 'NOT_ELIGIBLE';
  return mode === 'CARD' ? 'PENDING' : mode === 'CREDIT' ? 'RECREDITED' : 'NONE';
}

export interface CancelPreview {
  cancelKind: 'EARLY' | 'LATE' | 'SAFETY_EXIT';
  refund: RefundMode;
  countsAsAbsence: boolean;
}

/**
 * V5.3 (B.6, amende V5.2 C.8) : annulation gratuite jusqu'à la CONFIRMATION (veille 18 h, `lockAt`, heure
 * où l'effectif est envoyé au lieu) ; après, annuler = absence. Les appelants passent `revealAt = lockAt`
 * (nom conservé pour la compatibilité de `cancelKindAt`).
 */
export function cancelPreview(i: { funding: SeatFunding | null; now: Date; revealAt: Date; kind: SeatCancelRequestKind }): CancelPreview {
  if (i.kind === 'SAFETY') return { cancelKind: 'SAFETY_EXIT', refund: refundModeFor(i.funding), countsAsAbsence: false };
  const k = cancelKindAt(i.now.getTime(), i.revealAt.getTime());
  // D-019 (T3) : annulation personnelle d'une place payée avant les visages → crédit 90 j (carte sur demande au support).
  const early: RefundMode = i.funding === 'PAID' ? 'CREDIT' : refundModeFor(i.funding);
  return k === 'EARLY' ? { cancelKind: 'EARLY', refund: early, countsAsAbsence: false } : { cancelKind: 'LATE', refund: 'NONE', countsAsAbsence: true };
}
