/**
 * Commandes de place (spec-v5 §2.6, §7.2, V5.1 E.16) : « Je viens » (financement : 1ʳᵉ offerte,
 * Blowy+, sinon paiement — port), refus, annulation (avant verrouillage : remboursable ; après :
 * absence, sans remboursement ; sécurité : remboursée, aucun effet), check-in, votes groupés,
 * contestation d'absence. Toutes passent par le CommandBus (idempotence, transaction, verrous
 * users → pets → outings) ; aucun appel réseau sous verrou.
 */
import { accuracyBucket, type SeatCancelKind, type SeatCancelRequestKind, type VoteChoice } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import type { CheckInRequest, SeatAcceptResponse } from '@blowy/api-contract';
import type { Tuning } from '@blowy/tuning';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { GroupChatPort } from '../../../shared/application/ports/group-chat.port.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { codeMatches, geoCheckIn, venueCode } from '../domain/checkin.js';
import { isPaused } from '../domain/reliability.js';
import { cancelPreview, refundModeFor, refundStateFor, type CancelPreview } from '../domain/seat-policy.js';
import { voteTargets } from '../domain/votes.js';
import type { OutingLifecycle } from './lifecycle.service.js';
import type { OutingEvents } from './outing-events.js';
import type { OutingRow, OutingsRepository, SeatRow } from './ports/outings.repository.js';
import type { SeatFundingPort } from './ports/seat-funding.port.js';

export interface OutingsConfig {
  /** Base du secret HMAC des codes de lieu (le secret d'un lieu = HMAC(base, ref)). */
  checkinSecretBase: string;
  publicWebOrigin: string;
}

type CheckInOutcome = { ok: true } | { ok: false; reason: 'CHECKIN_TOO_FAR' | 'CHECKIN_LOW_ACCURACY' | 'CHECKIN_CODE_INVALID'; attemptsLeft?: number };

export class SeatUseCases {
  constructor(
    private readonly repo: OutingsRepository,
    private readonly bus: CommandBus,
    private readonly lifecycle: OutingLifecycle,
    private readonly funding: SeatFundingPort,
    private readonly chat: GroupChatPort,
    private readonly events: OutingEvents,
    private readonly random: RandomSource,
    private readonly tuning: Tuning,
    private readonly secretOf: (ref: string) => string,
  ) {}

  async accept(userId: string, outingId: string, mode: 'AUTO' | 'PAY', commandId: string): Promise<SeatAcceptResponse> {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'outings.seat.accept',
      commandId,
      payload: { outingId, mode },
      handle: async (scope): Promise<SeatAcceptResponse> => {
        await scope.lock.users([userId]);
        await scope.lock.outings([outingId]);
        const seat = await this.repo.seat(scope, outingId, userId);
        const outing = await this.repo.outing(scope, outingId);
        if (!seat || !outing) throw Errors.notFound('Sortie');
        if (seat.status === 'CONFIRMED' && seat.funding) return { seat: { status: 'CONFIRMED', funding: seat.funding } };
        if (seat.status !== 'INVITED') throw Errors.precondition('SEAT_NOT_INVITED');
        if (outing.status !== 'PROPOSED' && outing.status !== 'FORMING') throw Errors.precondition('OUTING_NOT_OPEN');
        if (scope.now >= seat.acceptDeadline || scope.now >= outing.lockAt) throw Errors.precondition('INVITATION_EXPIRED');
        const r = await this.repo.requester(scope, userId, scope.now);
        if (!r?.verified) throw Errors.precondition('VERIFICATION_REQUIRED');
        if (!r.hasPhoto) throw Errors.precondition('PHOTO_REQUIRED');
        if (isPaused(r.reliability, scope.now)) throw Errors.precondition('RELIABILITY_PAUSED', { until: r.reliability!.pausedUntil!.toISOString() });
        const decision = await this.funding.fund(scope, { userId, seatId: seat.id, outingId, mode, freeFirstAvailable: this.tuning.pricing.firstOutingFree && !(await this.repo.usedFreeFirst(scope, userId)) });
        if (decision.kind === 'UNAVAILABLE') throw new AppError('PROVIDER_UNAVAILABLE', 'Paiement indisponible pour le moment', { retryable: true });
        await this.repo.updateSeat(scope, seat.id, { status: 'CONFIRMED', funding: decision.funding, paymentRef: decision.paymentRef, confirmedAt: scope.now, respondedAt: scope.now });
        await this.events.seatUpdated(scope, outingId, userId, { status: 'CONFIRMED', refundState: 'NONE' });
        await scope.outbox.emit({ topic: 'outing.seat_confirmed', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { outingId, seatId: seat.id, userId, funding: decision.funding } });
        await this.lifecycle.afterConfirm(scope, outing, userId);
        return { seat: { status: 'CONFIRMED', funding: decision.funding }, ...(decision.payment ? { payment: decision.payment } : {}) };
      },
    });
    return result;
  }

  async decline(userId: string, outingId: string, commandId: string): Promise<{ status: 'DECLINED' }> {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'outings.seat.decline',
      commandId,
      payload: { outingId },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await scope.lock.outings([outingId]);
        const seat = await this.repo.seat(scope, outingId, userId);
        if (!seat) throw Errors.notFound('Sortie');
        if (seat.status !== 'INVITED' && seat.status !== 'HELD') throw Errors.precondition('SEAT_NOT_INVITED');
        await this.repo.updateSeat(scope, seat.id, { status: 'DECLINED', respondedAt: scope.now });
        await this.events.seatUpdated(scope, outingId, userId, { status: 'DECLINED', refundState: seat.refundState });
        await scope.outbox.emit({ topic: 'outing.seat_declined', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { outingId, seatId: seat.id } });
        return { status: 'DECLINED' as const };
      },
    });
    return result;
  }

  async preview(userId: string, outingId: string, kind: SeatCancelRequestKind, now: Date): Promise<CancelPreview> {
    const [seat, outing] = await Promise.all([this.repo.seat(null, outingId, userId), this.repo.outing(null, outingId)]);
    if (!seat || !outing) throw Errors.notFound('Sortie');
    if (seat.status !== 'CONFIRMED' && seat.status !== 'HELD' && seat.status !== 'CHECKED_IN') throw Errors.precondition('SEAT_NOT_ACTIVE');
    return cancelPreview({ funding: seat.funding, now, revealAt: outing.photoRevealAt, kind });
  }

  async cancel(userId: string, outingId: string, kind: SeatCancelRequestKind, commandId: string): Promise<CancelPreview> {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'outings.seat.cancel',
      commandId,
      payload: { outingId, kind },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await scope.lock.outings([outingId]);
        const seat = await this.repo.seat(scope, outingId, userId);
        const outing = await this.repo.outing(scope, outingId);
        if (!seat || !outing) throw Errors.notFound('Sortie');
        const active = seat.status === 'CONFIRMED' || seat.status === 'HELD' || (kind === 'SAFETY' && seat.status === 'CHECKED_IN');
        if (!active) throw Errors.precondition('SEAT_NOT_ACTIVE');
        if (kind !== 'SAFETY' && scope.now >= outing.startsAt) throw Errors.precondition('OUTING_STARTED');
        const p = cancelPreview({ funding: seat.funding, now: scope.now, revealAt: outing.photoRevealAt, kind });
        await this.cancelIn(scope, seat, outing, p);
        return p;
      },
    });
    return result;
  }

  /** Annulation d'une place (verrous users → outings tenus par l'appelant). */
  private async cancelIn(scope: TxScope, seat: SeatRow, outing: OutingRow, p: CancelPreview, cancelKind: SeatCancelKind = p.cancelKind) {
    const outingId = outing.id;
    const userId = seat.userId;
    const refundable = !p.countsAsAbsence;
    let refundState = refundStateFor(p.refund, refundable);
    if (refundable && p.refund === 'CARD') refundState = await this.funding.refundCard(scope, { userId, seatId: seat.id, paymentRef: null });
    await this.repo.updateSeat(scope, seat.id, { status: 'CANCELLED', cancelKind, refundState, cancelledAt: scope.now });
    const conv = await this.chat.conversationOfOuting(scope, outingId);
    if (conv) await this.chat.revokeMember(scope, conv, userId);
    await this.events.revoke(scope, userId, outingId, conv);
    await this.events.seatUpdated(scope, outingId, userId, { status: 'CANCELLED', refundState });
    // V5.1 E.16 / V5.2 C.8 : après la révélation des visages, annuler = absence (sauf sécurité).
    if (p.countsAsAbsence) await this.lifecycle.absence(scope, userId, 'LATE_CANCEL', seat.id);
    await scope.outbox.emit({ topic: 'outing.seat_cancelled', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { outingId, seatId: seat.id, cancelKind } });
    const seats = await this.repo.seats(scope, outingId);
    const confirmed = seats.filter((s) => s.status === 'CONFIRMED' || s.status === 'CHECKED_IN').map((s) => s.userId);
    const undersizeLimit = outing.startsAt.getTime() - this.tuning.outings.cancelUndersizedBeforeStartHours * 3_600_000;
    if (outing.status === 'CONFIRMED' && confirmed.length < this.tuning.outings.minSizeToHold && scope.now.getTime() < undersizeLimit) {
      await this.lifecycle.cancelOuting(scope, outing, 'UNDERSIZED');
    } else {
      await this.events.updated(scope, outingId, confirmed, { status: outing.status, confirmedCount: confirmed.length, changed: 'MEMBERS' });
    }
  }

  /**
   * « Je connais quelqu'un ici » (V5.2 C.10) : signalement PRIVÉ après la révélation des visages,
   * avant le début. Lien réel déjà connu (bande/amitié, duo, blocage) → retrait sans pénalité,
   * remboursé, prioritaire la semaine suivante (`MOVED`) ; sinon examen humain (`IN_REVIEW`, T6).
   * Une fois par mois : au-delà, c'est une annulation (absence).
   */
  async knowsSomeone(userId: string, outingId: string, targetUserId: string, commandId: string): Promise<{ status: 'MOVED' | 'IN_REVIEW' | 'COUNTED_AS_CANCEL' }> {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'outings.seat.knows_someone',
      commandId,
      payload: { outingId, targetUserId },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await scope.lock.outings([outingId]);
        const seat = await this.repo.seat(scope, outingId, userId);
        const outing = await this.repo.outing(scope, outingId);
        if (!seat || !outing) throw Errors.notFound('Sortie');
        const target = await this.repo.seat(scope, outingId, targetUserId);
        const open = seat.status === 'CONFIRMED' && outing.status === 'CONFIRMED' && scope.now >= outing.photoRevealAt && scope.now < outing.startsAt;
        if (!open || !target || targetUserId === userId || (target.status !== 'CONFIRMED' && target.status !== 'CHECKED_IN')) throw Errors.precondition('KNOWS_SOMEONE_NOT_AVAILABLE');
        const recent = await this.repo.knowsSomeoneSince(scope, userId, new Date(scope.now.getTime() - 30 * 86_400_000));
        if (recent > 0) {
          await this.repo.createKnowsSomeone(scope, { id: this.random.uuid(), seatId: seat.id, userId, targetUserId, status: 'COUNTED_AS_CANCEL' });
          await this.cancelIn(scope, seat, outing, cancelPreview({ funding: seat.funding, now: scope.now, revealAt: outing.photoRevealAt, kind: 'CANT_MAKE_IT' }));
          return { status: 'COUNTED_AS_CANCEL' as const };
        }
        if (await this.repo.knownRelation(userId, targetUserId)) {
          await this.repo.createKnowsSomeone(scope, { id: this.random.uuid(), seatId: seat.id, userId, targetUserId, status: 'AUTO_ACCEPTED' });
          // Retrait système neutre : remboursé intégralement, aucune fiabilité, prioritaire la semaine suivante.
          await this.cancelIn(scope, seat, outing, { cancelKind: 'SAFETY_EXIT', refund: refundModeFor(seat.funding), countsAsAbsence: false }, 'SYSTEM_REMOVAL');
          return { status: 'MOVED' as const };
        }
        await this.repo.createKnowsSomeone(scope, { id: this.random.uuid(), seatId: seat.id, userId, targetUserId, status: 'IN_REVIEW' });
        await scope.outbox.emit({ topic: 'outing.knows_someone_review', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { seatId: seat.id } });
        return { status: 'IN_REVIEW' as const };
      },
    });
    return result;
  }

  async checkIn(userId: string, outingId: string, req: CheckInRequest, commandId: string): Promise<{ result: 'ACCEPTED' }> {
    const venue = await this.repo.venueSecretRef(outingId);
    if (!venue) throw Errors.notFound('Sortie');
    // Le payload mémorisé (idempotence) ne contient jamais la position : seulement une empreinte du tap.
    const payload = req.method === 'GEO' ? { outingId, method: 'GEO', tap: commandId } : { outingId, method: 'VENUE_CODE', code: req.code };
    const { result } = await this.bus.execute<typeof payload, CheckInOutcome>({
      actorId: userId,
      operation: 'outings.check_in',
      commandId,
      payload,
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await scope.lock.outings([outingId]);
        const seat = await this.repo.seat(scope, outingId, userId);
        const outing = await this.repo.outing(scope, outingId);
        if (!seat || !outing) throw Errors.notFound('Sortie');
        if (seat.status === 'CHECKED_IN') return { ok: true };
        if (seat.status !== 'CONFIRMED') throw Errors.precondition('SEAT_NOT_ACTIVE');
        if (outing.status !== 'CHECKIN_OPEN' || scope.now < outing.checkinOpensAt || scope.now >= outing.checkinClosesAt) throw Errors.precondition('CHECKIN_NOT_OPEN');
        if (req.method === 'GEO') {
          const r = geoCheckIn(req, venue, this.tuning);
          await this.repo.recordCheckInAttempt(scope, { seatId: seat.id, method: 'GEO', result: r, accuracyBucket: accuracyBucket(req.accuracyM) });
          if (r !== 'ACCEPTED') return { ok: false, reason: r === 'TOO_FAR' ? 'CHECKIN_TOO_FAR' : 'CHECKIN_LOW_ACCURACY' };
        } else {
          const max = this.tuning.safety.venueCodeMaxAttempts;
          const used = await this.repo.checkInAttempts(scope, seat.id, 'VENUE_CODE');
          if (used >= max) throw new AppError('RATE_LIMITED', 'Trop d’essais de code', { detailsSafe: { reason: 'CHECKIN_CODE_INVALID', attemptsLeft: 0 } });
          const ok = codeMatches(venueCode(this.secretOf(venue.ref), outing.startsAt), req.code);
          await this.repo.recordCheckInAttempt(scope, { seatId: seat.id, method: 'VENUE_CODE', result: ok ? 'ACCEPTED' : 'CODE_INVALID', accuracyBucket: null });
          if (!ok) return { ok: false, reason: 'CHECKIN_CODE_INVALID', attemptsLeft: max - used - 1 };
        }
        await this.repo.recordCheckIn(scope, seat.id, req.method);
        await this.repo.updateSeat(scope, seat.id, { status: 'CHECKED_IN', checkedInAt: scope.now });
        const seats = await this.repo.seats(scope, outingId);
        await this.events.checkinUpdated(scope, outingId, seats.filter((s) => s.status === 'CONFIRMED' || s.status === 'CHECKED_IN').map((s) => s.userId), userId);
        await scope.outbox.emit({ topic: 'outing.checked_in', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { outingId, seatId: seat.id } });
        return { ok: true };
      },
    });
    // Un refus est mémorisé (l'essai compte) puis renvoyé en 412 — jamais de distance.
    if (!result.ok) throw Errors.precondition(result.reason, result.attemptsLeft !== undefined ? { attemptsLeft: result.attemptsLeft } : {});
    return { result: 'ACCEPTED' };
  }

  /** Vote groupé (V5.1 A.3) : une ligne par personne présente, « non » par défaut ; aucun événement. */
  async vote(userId: string, outingId: string, choices: Record<string, VoteChoice>, commandId: string): Promise<{ myChoices: Record<string, VoteChoice> }> {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'outings.vote.submit',
      commandId,
      payload: { outingId, choices },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const seat = await this.repo.seat(scope, outingId, userId);
        const outing = await this.repo.outing(scope, outingId);
        if (!seat || !outing || seat.status !== 'ATTENDED' || outing.status !== 'DONE') throw Errors.notFound('Sortie');
        if (outing.votesClosedAt || scope.now >= outing.votesCloseAt) throw Errors.precondition('VOTE_WINDOW_CLOSED');
        const attendees = await this.repo.attendees(scope, outingId, scope.now);
        const me = attendees.find((a) => a.userId === userId);
        if (!me) throw Errors.notFound('Sortie');
        const blocked = await this.repo.blockedAmong(userId, attendees.map((a) => a.userId));
        const targets = voteTargets(me, attendees).filter((t) => !blocked.has(t));
        if (Object.keys(choices).some((t) => !targets.includes(t))) throw Errors.precondition('VOTE_TARGET_NOT_ATTENDEE');
        const full = new Map(targets.map((t) => [t, choices[t] ?? ('NO' as VoteChoice)]));
        await this.repo.saveBallots(scope, outingId, userId, full);
        return { myChoices: Object.fromEntries(full) };
      },
    });
    return result;
  }

  async dispute(userId: string, outingId: string, note: string, commandId: string): Promise<{ status: 'OPEN' }> {
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'attendance.dispute',
      commandId,
      payload: { outingId, note },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const seat = await this.repo.seat(scope, outingId, userId);
        const outing = await this.repo.outing(scope, outingId);
        if (!seat || !outing) throw Errors.notFound('Sortie');
        if (seat.status !== 'NO_SHOW') throw Errors.precondition('NOT_NO_SHOW');
        if (scope.now.getTime() > outing.checkinClosesAt.getTime() + this.tuning.outings.disputeWindowDays * 86_400_000) throw Errors.precondition('DISPUTE_WINDOW_CLOSED');
        if (!(await this.repo.createDispute(scope, { id: this.random.uuid(), seatId: seat.id, userId, note }))) throw new AppError('CONFLICT', 'Contestation déjà ouverte', { detailsSafe: { reason: 'DISPUTE_EXISTS' } });
        await scope.outbox.emit({ topic: 'attendance.disputed', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { seatId: seat.id } });
        return { status: 'OPEN' as const };
      },
    });
    return result;
  }
}
