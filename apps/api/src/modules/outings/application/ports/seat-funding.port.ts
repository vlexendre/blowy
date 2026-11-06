/**
 * Financement d'une place (spec-v5 §2.6, §6.3). T2 : 1ʳᵉ sortie offerte (FREE_FIRST), Blowy+
 * (PLUS_INCLUDED, droit lu via EntitlementsReader), sinon paiement : adaptateur LOCAL_DEMO hors
 * production (place confirmée, référence `local_demo:<seatId>`) ; en production sans fournisseur,
 * refus 503 PROVIDER_UNAVAILABLE (la place reste INVITED). Stripe et les crédits : T3 (agent G).
 * Aucun appel réseau sous verrou : un vrai fournisseur crée l'intention de paiement après commit.
 */
import type { SeatFunding } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export type FundingDecision =
  | { kind: 'FUNDED'; funding: SeatFunding; paymentRef: string | null; payment: { provider: 'LOCAL_DEMO' | 'STRIPE'; clientSecret: string; amountCents: number; currency: 'EUR' } | null }
  | { kind: 'UNAVAILABLE' };

export interface SeatFundingPort {
  fund(scope: TxScope, i: { userId: string; seatId: string; outingId: string; mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean }): Promise<FundingDecision>;
  /** Remboursement carte : LOCAL_DEMO immédiat ; fournisseur réel planifié via outbox (T3). */
  refundCard(scope: TxScope, i: { userId: string; seatId: string; paymentRef: string | null }): Promise<'REFUNDED' | 'PENDING'>;
}
export const SEAT_FUNDING = Symbol('SeatFundingPort');
