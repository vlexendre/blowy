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

export type SeatPaymentView = { provider: 'LOCAL_DEMO' | 'STRIPE'; clientSecret: string; amountCents: number; currency: 'EUR'; activityCents?: number };

/**
 * V5.10 (jury tour 11) : activité payante PRÉPAYÉE avec la place (prix TTC par personne, régime de reversement au
 * lieu figé au paiement). Blowy+ / 1ʳᵉ offerte / parrainage couvrent la place, jamais l'activité.
 */
export type ActivityCharge = { cents: number; taxBasis: 'TTC' | 'HT' };

export type FundingDecision =
  | { kind: 'FUNDED'; funding: SeatFunding; paymentRef: string | null; creditRef?: string | null; payment: SeatPaymentView | null }
  /** T3 : paiement carte requis — la place passe HELD jusqu'à `holdExpiresAt` (webhook → CONFIRMED). */
  /** V5.10 : `funding` = financement de la place déjà acquis (offerte, Blowy+…) quand seule l'activité reste à payer. */
  | { kind: 'HOLD'; holdExpiresAt: Date; funding?: SeatFunding; creditRef?: string | null }
  | { kind: 'UNAVAILABLE' };

/** Cause d'un remboursement (T3) : décide carte, crédit 90 j ou rien (§6.4). */
export type SeatRefundCause = 'OUTING_CANCELLED' | 'SYSTEM_REMOVAL' | 'SAFETY_EXIT' | 'USER_EARLY' | 'ACCOUNT_DELETED';

export interface SeatFundingPort {
  /** `activity` (V5.10) : activité à prépayer ; `planned` : financement déjà acquis par une place HELD (jamais consommé deux fois). */
  fund(scope: TxScope, i: { userId: string; seatId: string; outingId: string; mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean; activity?: ActivityCharge | null; planned?: SeatFunding | null }): Promise<FundingDecision>;
  /** Remboursement carte : LOCAL_DEMO immédiat ; fournisseur réel planifié (job) ; T3 : `RECREDITED` si la cause donne un crédit. */
  refundCard(scope: TxScope, i: { userId: string; seatId: string; paymentRef: string | null; cause?: SeatRefundCause }): Promise<'REFUNDED' | 'PENDING' | 'RECREDITED'>;
  /** T3 : recrédit d'une place financée par un crédit (lot rendu) ou par Blowy+ échu (crédit 90 j). */
  refundCredit?(scope: TxScope, i: { userId: string; seatId: string; funding: SeatFunding; cause: SeatRefundCause }): Promise<'RECREDITED'>;
  /** T3 : après commit, crée (idempotent) l'intention de paiement d'une place HELD. Réseau : jamais sous verrou. */
  prepareIntent?(i: { userId: string; seatId: string; seatDue?: boolean; activity?: ActivityCharge | null }): Promise<SeatPaymentView>;
  /**
   * V5.10 : rembourse l'activité prépayée d'une place remboursable (sécurité, Blowy annule, annulation avant la
   * confirmation, retrait système) — sans effet si rien n'a été payé ou si le paiement est déjà remboursé (place payée).
   */
  refundActivity?(scope: TxScope, i: { userId: string; seatId: string; cause: SeatRefundCause }): Promise<'REFUNDED' | 'PENDING' | null>;
}
export const SEAT_FUNDING = Symbol('SeatFundingPort');
