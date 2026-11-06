/**
 * Implémentation du port `OUTING_SAFETY_PORT` (T4, agent E — ajout minimal dans `outings`) :
 * retrait système au blocage (D-025) et décision staff « je connais quelqu'un » (V5.2 C.10).
 * Réutilise l'annulation de place existante (`SeatUseCases.systemRemove`) : remboursement par le
 * port de financement, révocation chat/salle WS, « ne pourra pas venir » pour le groupe.
 */
import type { OutingSafetyPort, SystemRemoval } from '../../../shared/application/ports/outing-safety.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import type { OutingsRepository } from './ports/outings.repository.js';
import type { SeatUseCases } from './seats.use-cases.js';

const LIVE_SEAT = new Set(['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN']);

export class OutingSafetyService implements OutingSafetyPort {
  constructor(
    private readonly repo: OutingsRepository,
    private readonly seats: SeatUseCases,
  ) {}

  async removeFromSharedOutings(scope: TxScope, i: { removedUserId: string; withUserId: string }): Promise<SystemRemoval[]> {
    const mine = await this.repo.activeSeatsOf(scope, i.removedUserId);
    const shared: string[] = [];
    for (const s of mine) {
      const other = await this.repo.seat(scope, s.outingId, i.withUserId);
      if (other && LIVE_SEAT.has(other.status)) shared.push(s.outingId);
    }
    if (shared.length === 0) return [];
    await scope.lock.outings(shared);
    const out: SystemRemoval[] = [];
    for (const outingId of shared) {
      const seat = await this.repo.seat(scope, outingId, i.removedUserId);
      const outing = await this.repo.outing(scope, outingId);
      // Relu sous verrou : la place a pu changer entre-temps.
      if (!seat || !outing || !LIVE_SEAT.has(seat.status) || outing.status === 'CANCELLED' || outing.status === 'DONE') continue;
      const refundState = await this.seats.systemRemove(scope, seat, outing);
      out.push({ outingId, seatId: seat.id, refundState });
    }
    return out;
  }

  async leaveForSafety(scope: TxScope, i: { userId: string; outingId: string }): Promise<SystemRemoval | null> {
    await scope.lock.outings([i.outingId]);
    const seat = await this.repo.seat(scope, i.outingId, i.userId);
    const outing = await this.repo.outing(scope, i.outingId);
    if (!seat || !outing || !LIVE_SEAT.has(seat.status) || outing.status === 'CANCELLED' || outing.status === 'DONE') return null;
    const refundState = await this.seats.systemRemove(scope, seat, outing, 'SAFETY_EXIT');
    return { outingId: i.outingId, seatId: seat.id, refundState };
  }

  async knowsSomeoneUnderReview(scope: TxScope | null, seatId: string) {
    const k = await this.repo.knowsSomeoneBySeat(scope, seatId);
    return k && k.status === 'IN_REVIEW' ? { userId: k.userId, outingId: k.outingId, targetUserId: k.targetUserId } : null;
  }

  async resolveKnowsSomeone(scope: TxScope, i: { seatId: string; accept: boolean }) {
    const k = await this.repo.knowsSomeoneBySeat(scope, i.seatId);
    if (!k || k.status !== 'IN_REVIEW') return null;
    if (!i.accept) {
      await this.repo.setKnowsSomeoneStatus(scope, k.id, 'REJECTED');
      return { status: 'REJECTED' as const };
    }
    await this.repo.setKnowsSomeoneStatus(scope, k.id, 'ACCEPTED');
    const outingId = k.outingId;
    await scope.lock.outings([outingId]);
    const seat = await this.repo.seat(scope, outingId, k.userId);
    const outing = await this.repo.outing(scope, outingId);
    if (!seat || !outing || seat.status !== 'CONFIRMED' || scope.now >= outing.startsAt) return { status: 'ACCEPTED_TOO_LATE' as const };
    await this.seats.systemRemove(scope, seat, outing);
    return { status: 'MOVED' as const };
  }
}
