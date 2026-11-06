/**
 * Implémentation du port `OUTING_ADMIN_PORT` (T6, agent F — ajout minimal dans `outings`, seul écrivain
 * des sorties, places et de la fiabilité). Réutilise le cycle de vie existant :
 *  - annulation staff / lieu indisponible → `OutingLifecycle.cancelOuting` (remboursements, chat fermé) ;
 *  - retrait d'une place → `SeatUseCases.systemRemove` (remboursée, sans fiabilité) ;
 *  - contestation acceptée → absence retirée (`correctAbsence`), pause levée si elle en découlait.
 * Verrous pris ici dans l'ordre global : users → outings.
 */
import { createHmac } from 'node:crypto';
import type { OutingAdminCancelReason, OutingAdminPort } from '../../../shared/application/ports/outing-admin.port.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { venueCode } from '../domain/checkin.js';
import { EMPTY_RELIABILITY, type ReliabilityState } from '../domain/reliability.js';
import type { OutingLifecycle } from './lifecycle.service.js';
import type { OutingsRepository } from './ports/outings.repository.js';
import type { SeatUseCases } from './seats.use-cases.js';

const LIVE_SEAT = new Set(['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN']);
const TERMINAL_OUTING = new Set(['DONE', 'CANCELLED']);

/**
 * Retire une absence corrigée par le staff (contestation acceptée) : compteurs décrémentés, présence
 * ajoutée pour un no-show, épisode réduit ; une pause en cours est levée (elle exigeait ≥ 2 absences).
 */
export function correctAbsence(s: ReliabilityState, kind: 'NO_SHOW' | 'LATE_CANCEL', now: Date): ReliabilityState {
  const paused = !!s.pausedUntil && s.pausedUntil > now;
  return {
    ...s,
    noShows: Math.max(0, s.noShows - (kind === 'NO_SHOW' ? 1 : 0)),
    lateCancels: Math.max(0, s.lateCancels - (kind === 'LATE_CANCEL' ? 1 : 0)),
    attended: s.attended + (kind === 'NO_SHOW' ? 1 : 0),
    episodeAbsences: Math.max(0, s.episodeAbsences - 1),
    pausedUntil: paused ? null : s.pausedUntil,
  };
}

export class OutingAdminService implements OutingAdminPort {
  constructor(
    private readonly repo: OutingsRepository,
    private readonly lifecycle: OutingLifecycle,
    private readonly seats: SeatUseCases,
    private readonly secretOf: (ref: string) => string,
  ) {}

  async cancelOuting(scope: TxScope, i: { outingId: string; reason: OutingAdminCancelReason }) {
    const pre = await this.repo.seats(scope, i.outingId);
    await scope.lock.users(pre.map((s) => s.userId));
    await scope.lock.outings([i.outingId]);
    const outing = await this.repo.outing(scope, i.outingId);
    if (!outing || TERMINAL_OUTING.has(outing.status)) return null;
    const affected = (await this.repo.seats(scope, i.outingId)).filter((s) => LIVE_SEAT.has(s.status)).length;
    await this.lifecycle.cancelOuting(scope, outing, i.reason);
    return { affectedSeats: affected };
  }

  async removeSeat(scope: TxScope, i: { seatId: string }) {
    const pre = await this.repo.seatById(scope, i.seatId);
    if (!pre) return null;
    await scope.lock.users([pre.userId]);
    await scope.lock.outings([pre.outingId]);
    const seat = await this.repo.seatById(scope, i.seatId);
    const outing = await this.repo.outing(scope, pre.outingId);
    if (!seat || !outing || !LIVE_SEAT.has(seat.status) || TERMINAL_OUTING.has(outing.status)) return null;
    const refundState = await this.seats.systemRemove(scope, seat, outing);
    return { outingId: outing.id, refundState };
  }

  async resolveDispute(scope: TxScope, i: { disputeId: string; accept: boolean; staffUserId: string }) {
    const pre = await this.repo.dispute(scope, i.disputeId);
    if (!pre || pre.status !== 'OPEN') return null;
    await scope.lock.users([pre.userId]);
    const d = await this.repo.dispute(scope, i.disputeId);
    const seat = d ? await this.repo.seatById(scope, d.seatId) : null;
    if (!d || d.status !== 'OPEN' || !seat) return null;
    await scope.lock.outings([seat.outingId]);
    if (!i.accept) {
      await this.repo.setDisputeStatus(scope, d.id, 'REJECTED', i.staffUserId);
      return { seatId: seat.id, userId: d.userId, status: 'REJECTED' as const, corrected: null };
    }
    const kind: 'NO_SHOW' | 'LATE_CANCEL' | null = seat.status === 'NO_SHOW' ? 'NO_SHOW' : seat.status === 'CANCELLED' && seat.cancelKind === 'LATE' ? 'LATE_CANCEL' : null;
    await this.repo.setDisputeStatus(scope, d.id, 'ACCEPTED', i.staffUserId);
    if (kind) {
      const cur = (await this.repo.reliability(scope, d.userId)) ?? EMPTY_RELIABILITY;
      await this.repo.saveReliability(scope, d.userId, correctAbsence(cur, kind, scope.now));
      // Trace idempotente de la correction (une seule par place) ; l'auteur est dans l'AuditLog.
      await this.repo.reliabilityEvent(scope, { userId: d.userId, reason: 'OUTING_ATTENDED', episodeKey: `${seat.id}:staff-correction` });
      if (kind === 'NO_SHOW') {
        await this.repo.updateSeat(scope, seat.id, { status: 'ATTENDED' });
        await this.repo.recordCheckIn(scope, seat.id, 'STAFF');
      }
      await scope.outbox.emit({ topic: 'outing.attendance_corrected', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { seatId: seat.id, userId: d.userId, corrected: kind } });
    }
    return { seatId: seat.id, userId: d.userId, status: 'ACCEPTED' as const, corrected: kind };
  }

  async liftPause(scope: TxScope, i: { userId: string }) {
    await scope.lock.users([i.userId]);
    const cur = await this.repo.reliability(scope, i.userId);
    if (!cur?.pausedUntil || cur.pausedUntil <= scope.now) return false;
    await this.repo.saveReliability(scope, i.userId, { ...cur, pausedUntil: null, episodeAbsences: 0 });
    return true;
  }

  venueCode(secretRef: string, startsAt: Date): string {
    return venueCode(this.secretOf(secretRef), startsAt);
  }
}

/** Secret d'un lieu = HMAC(base serveur, référence) — même dérivation que le check-in (`outings.module`). */
export const venueSecretFrom = (base: string) => (ref: string) => createHmac('sha256', base).update(`venue-checkin:${ref}`).digest('hex');
