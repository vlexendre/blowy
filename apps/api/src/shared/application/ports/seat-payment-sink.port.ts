/**
 * Port inter-modules (V5 T3) : l'économie signale à `outings` le résultat d'un paiement de place ou
 * d'un remboursement ; `outings` écrit SES tables (place HELD → CONFIRMED, état de remboursement).
 * Appelé dans la transaction de l'économie (verrou users déjà tenu, ordre users → outings respecté).
 * Implémentation : module outings (`SEAT_PAYMENT_SINK`).
 */
import type { TxScope } from '../unit-of-work.js';

export type SeatPaymentOutcome =
  /** Place confirmée (HELD non échu, sortie ouverte). */
  | 'CONFIRMED'
  /** Déjà confirmée par ce même paiement (rejeu) : aucun effet. */
  | 'ALREADY_CONFIRMED'
  /** Paiement trop tard (hold échu, place prise, sortie close/annulée) ou doublon : à rembourser intégralement. */
  | 'REFUND_REQUIRED';

export interface SeatPaymentSink {
  paymentSucceeded(scope: TxScope, i: { seatId: string; userId: string; paymentRef: string }): Promise<SeatPaymentOutcome>;
  /** Remboursement carte effectué par le fournisseur : `refundState → REFUNDED` (idempotent). */
  refundSettled(scope: TxScope, i: { seatId: string; userId: string; refundRef: string }): Promise<void>;
}
export const SEAT_PAYMENT_SINK = Symbol('SeatPaymentSink');
