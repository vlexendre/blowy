/**
 * Financement T2 (spec-v5 §6.3, V5.1 H.23) : 1ʳᵉ sortie offerte, puis Blowy+ (toutes les sorties
 * incluses), sinon place payante. Le paiement réel (Stripe) est T3 (agent G) : ici, hors production
 * seulement, un adaptateur LOCAL_DEMO étiqueté confirme la place sans débit réel ; en production,
 * sans fournisseur, refus 503 (la place reste INVITED). Lecture des droits = lecture base (aucun
 * appel réseau sous verrou).
 */
import type { Tuning } from '@blowy/tuning';
import type { EntitlementsReader } from '../../../shared/application/ports/entitlements-reader.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import type { FundingDecision, SeatFundingPort } from '../application/ports/seat-funding.port.js';

export class LocalSeatFunding implements SeatFundingPort {
  constructor(
    private readonly entitlements: EntitlementsReader | null,
    private readonly allowLocalDemo: boolean,
    private readonly tuning: Tuning,
  ) {}

  async fund(scope: TxScope, i: { userId: string; seatId: string; outingId: string; mode: 'AUTO' | 'PAY'; freeFirstAvailable: boolean }): Promise<FundingDecision> {
    if (i.mode === 'AUTO' && i.freeFirstAvailable) return { kind: 'FUNDED', funding: 'FREE_FIRST', paymentRef: null, payment: null };
    if (i.mode === 'AUTO' && this.tuning.plus.includesAllOutings && this.entitlements) {
      const keys = await this.entitlements.activeKeys(i.userId, scope.now);
      // Abonné·e Blowy+ direct (les droits dérivés ne comptent pas).
      if (keys.has('PLUS_MONTHLY_BENEFITS')) return { kind: 'FUNDED', funding: 'PLUS_INCLUDED', paymentRef: null, payment: null };
    }
    if (!this.allowLocalDemo) return { kind: 'UNAVAILABLE' };
    const seat = this.tuning.pricing.seat;
    return { kind: 'FUNDED', funding: 'PAID', paymentRef: `local_demo:${i.seatId}`, payment: { provider: 'LOCAL_DEMO', clientSecret: `local_demo_${i.seatId}`, amountCents: seat.amountCents, currency: 'EUR' } };
  }

  async refundCard(scope: TxScope, i: { userId: string; seatId: string; paymentRef: string | null }): Promise<'REFUNDED' | 'PENDING'> {
    if (this.allowLocalDemo) return 'REFUNDED';
    // Fournisseur réel (T3) : remboursement planifié après commit.
    await scope.outbox.emit({ topic: 'outing.seat_refund_due', aggregateType: 'OutingSeat', aggregateId: i.seatId, payload: { seatId: i.seatId, userId: i.userId } });
    return 'PENDING';
  }
}
