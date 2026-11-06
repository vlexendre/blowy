/**
 * Financement d'une place (spec-v5 §2.6, §6.3). T2 : 1ʳᵉ sortie offerte (FREE_FIRST), Blowy+
 * (PLUS_INCLUDED, droit lu via EntitlementsReader), sinon paiement : adaptateur LOCAL_DEMO hors
 * production (place confirmée, référence `local_demo:<seatId>`) ; en production sans fournisseur,
 * refus 503 PROVIDER_UNAVAILABLE (la place reste INVITED).
 * T3 (agent G, implémentation `economy`) : crédits (`CREDIT` + `creditRef`), paiement Stripe en deux
 * temps (`HOLD` : place HELD dans la transaction, intention de paiement créée APRÈS commit par
 * `prepareIntent`, confirmation par webhook signé), remboursements selon la cause (§6.4, D-019).
 * Aucun appel réseau sous verrou.
 */
import type { SeatFunding } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export type SeatPaymentView = { provider: 'LOCAL_DEMO' | 'STRIPE'; clientSecret: string; amountCents: number; currency: 'EUR' };

export type FundingDecision =
  | { kind: 'FUNDED'; funding: SeatFunding; paymentRef: string | null; creditRef?: string | null; payment: SeatPaymentView | null }
  /** T3 : paiement carte requis — la place passe HELD jusqu'à `holdExpiresAt` (webhook → CONFIRMED). */
  | { kind: 'HOLD'; holdExpiresAt: Date }
  | { kind: 'UNAVAILABLE' };

/** Cause d'un remboursement (T3) : décide carte, crédit 90 j ou rien (§6.4). */
export type SeatRefundCause = 'OUTING_CANCELLED' | 'SYSTEM_REMOVAL' | 'SAFETY_EXIT' | 'USER_EARLY' | 'ACCOUNT_DELETED';

export interface SeatFundingPort {
  fund(scope: TxScope, i: { userId: string; seatId: string; outingId: string; mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean }): Promise<FundingDecision>;
  /** Remboursement carte : LOCAL_DEMO immédiat ; fournisseur réel planifié (job) ; T3 : `RECREDITED` si la cause donne un crédit. */
  refundCard(scope: TxScope, i: { userId: string; seatId: string; paymentRef: string | null; cause?: SeatRefundCause }): Promise<'REFUNDED' | 'PENDING' | 'RECREDITED'>;
  /** T3 : recrédit d'une place financée par un crédit (lot rendu) ou par Blowy+ échu (crédit 90 j). */
  refundCredit?(scope: TxScope, i: { userId: string; seatId: string; funding: SeatFunding; cause: SeatRefundCause }): Promise<'RECREDITED'>;
  /** T3 : après commit, crée (idempotent) l'intention de paiement d'une place HELD. Réseau : jamais sous verrou. */
  prepareIntent?(i: { userId: string; seatId: string }): Promise<SeatPaymentView>;
}
export const SEAT_FUNDING = Symbol('SeatFundingPort');
