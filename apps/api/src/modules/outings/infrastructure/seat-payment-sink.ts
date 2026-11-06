/**
 * Implémentation `outings` du port `SeatPaymentSink` (T3, branchement minimal) : l'économie signale un
 * paiement réussi ou un remboursement réglé ; `outings` écrit SA place, dans la transaction de
 * l'appelant (verrou users tenu ; ici verrou outings → ordre global respecté).
 * - HELD, hold non échu, sortie encore ouverte → CONFIRMED (financement PAID, référence = PaymentIntent).
 * - Trop tard (hold échu, sortie close/annulée, place sortie) ou second paiement → remboursement
 *   intégral (`refundState=PENDING`, place CANCELLED/SYSTEM_REMOVAL si elle était encore HELD).
 */
import type { SeatPaymentOutcome, SeatPaymentSink } from '../../../shared/application/ports/seat-payment-sink.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { OutingLifecycle } from '../application/lifecycle.service.js';
import type { OutingEvents } from '../application/outing-events.js';
import type { OutingsRepository } from '../application/ports/outings.repository.js';

export class OutingsSeatPaymentSink implements SeatPaymentSink {
  constructor(
    private readonly repo: OutingsRepository,
    private readonly lifecycle: OutingLifecycle,
    private readonly events: OutingEvents,
  ) {}

  private async row(scope: TxScope, seatId: string) {
    return txOf(scope).outingSeat.findUnique({ where: { id: seatId }, select: { id: true, outingId: true, userId: true, paymentRef: true } });
  }

  async paymentSucceeded(scope: TxScope, i: { seatId: string; userId: string; paymentRef: string }): Promise<SeatPaymentOutcome> {
    const raw = await this.row(scope, i.seatId);
    if (!raw || raw.userId !== i.userId) return 'REFUND_REQUIRED';
    await scope.lock.outings([raw.outingId]);
    const seat = await this.repo.seat(scope, raw.outingId, i.userId);
    const outing = await this.repo.outing(scope, raw.outingId);
    if (!seat || !outing) return 'REFUND_REQUIRED';
    if (raw.paymentRef === i.paymentRef && seat.status !== 'HELD') return 'ALREADY_CONFIRMED';
    const open = (outing.status === 'PROPOSED' || outing.status === 'FORMING') && scope.now < outing.lockAt;
    if (seat.status === 'HELD' && open && seat.holdExpiresAt && scope.now < seat.holdExpiresAt) {
      // V5.10 : place couverte (offerte, Blowy+…) dont seule l'activité était à payer → elle garde son financement.
      const funding = seat.funding && seat.funding !== 'PAID' ? seat.funding : 'PAID';
      await this.repo.updateSeat(scope, seat.id, { status: 'CONFIRMED', funding, paymentRef: i.paymentRef, confirmedAt: scope.now });
      await this.events.seatUpdated(scope, outing.id, i.userId, { status: 'CONFIRMED', refundState: 'NONE' });
      await scope.outbox.emit({ topic: 'outing.seat_confirmed', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { outingId: outing.id, seatId: seat.id, userId: i.userId, funding } });
      await this.lifecycle.afterConfirm(scope, outing, i.userId);
      return 'CONFIRMED';
    }
    if (seat.status === 'HELD') {
      // V5.10 : financement acquis d'une place HELD (offerte, parrainage, ancien crédit) rendu avant remboursement de la carte.
      if (seat.funding && seat.funding !== 'PAID') await this.lifecycle.releaseHeldFunding(scope, seat);
      // Paiement arrivé après l'échéance du hold (ou sortie close) : place rendue, remboursement intégral.
      await this.repo.updateSeat(scope, seat.id, { status: 'CANCELLED', cancelKind: 'SYSTEM_REMOVAL', funding: 'PAID', paymentRef: i.paymentRef, refundState: 'PENDING', cancelledAt: scope.now });
      await this.events.seatUpdated(scope, outing.id, i.userId, { status: 'CANCELLED', refundState: 'PENDING' });
    } else if (!raw.paymentRef && (seat.status === 'CANCELLED' || seat.status === 'EXPIRED' || seat.status === 'DECLINED')) {
      await this.repo.updateSeat(scope, seat.id, { funding: 'PAID', paymentRef: i.paymentRef, refundState: 'PENDING' });
      await this.events.seatUpdated(scope, outing.id, i.userId, { status: seat.status, refundState: 'PENDING' });
    }
    return 'REFUND_REQUIRED';
  }

  async refundSettled(scope: TxScope, i: { seatId: string; userId: string; refundRef: string }): Promise<void> {
    const raw = await this.row(scope, i.seatId);
    if (!raw) return;
    await scope.lock.outings([raw.outingId]);
    const seat = await this.repo.seat(scope, raw.outingId, raw.userId);
    if (!seat || seat.refundState !== 'PENDING') return;
    await this.repo.updateSeat(scope, seat.id, { refundState: 'REFUNDED', refundRef: i.refundRef });
    await this.events.seatUpdated(scope, raw.outingId, raw.userId, { status: seat.status, refundState: 'REFUNDED' });
  }
}
