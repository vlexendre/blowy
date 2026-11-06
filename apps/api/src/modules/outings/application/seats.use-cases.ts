/**
 * Commandes de place (spec-v5 §2.6, §7.2, V5.1 E.16) : « Je viens » (financement : 1ʳᵉ offerte,
 * Blowy+, sinon paiement — port), refus, annulation (avant verrouillage : remboursable ; après :
 * absence, sans remboursement ; sécurité : remboursée, aucun effet), check-in, votes groupés,
 * contestation d'absence. Toutes passent par le CommandBus (idempotence, transaction, verrous
 * users → pets → outings) ; aucun appel réseau sous verrou.
 */
import { type OutingCancelRequestKind, type SeatCancelKind, type VoteChoice } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import type { CheckInRequest, SeatAcceptResponse } from '@blowy/api-contract';
import type { Tuning } from '@blowy/tuning';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { GroupChatPort } from '../../../shared/application/ports/group-chat.port.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { codeMatches, venueCode } from '../domain/checkin.js';
import { isPaused } from '../domain/reliability.js';
import { cancelPreview, emergencyAvailable, emergencyWindowStart, refundModeFor, refundStateFor, type CancelPreview } from '../domain/seat-policy.js';
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
        // T3 (G) : paiement en cours (hold non échu) → même réponse ; l'intention est rendue après commit (idempotente).
        if (seat.status === 'HELD' && seat.holdExpiresAt && scope.now < seat.holdExpiresAt) return { seat: { status: 'HELD', holdExpiresAt: seat.holdExpiresAt.toISOString() } };
        if (seat.status !== 'INVITED' && seat.status !== 'HELD') throw Errors.precondition('SEAT_NOT_INVITED');
        if (outing.status !== 'PROPOSED' && outing.status !== 'FORMING') throw Errors.precondition('OUTING_NOT_OPEN');
        if (scope.now >= seat.acceptDeadline || scope.now >= outing.lockAt) throw Errors.precondition('INVITATION_EXPIRED');
        const r = await this.repo.requester(scope, userId, scope.now);
        if (!r?.verified) throw Errors.precondition('AGE_VERIFICATION_REQUIRED');
        if (!r.hasPhoto) throw Errors.precondition('PHOTO_REQUIRED');
        if (isPaused(r.reliability, scope.now)) throw Errors.precondition('RELIABILITY_PAUSED', { until: r.reliability!.pausedUntil!.toISOString() });
        // V5.10 (jury tour 11) : activité payante prépayée avec la place ; une place HELD garde son financement acquis.
        const activity = (await this.repo.activityQuote?.(scope, outingId)) ?? null;
        const planned = seat.status === 'HELD' && seat.funding && seat.funding !== 'PAID' ? seat.funding : null;
        const decision = await this.funding.fund(scope, { userId, seatId: seat.id, outingId, mode, freeFirstAvailable: !planned && this.tuning.pricing.firstOutingFree && !(await this.repo.usedFreeFirst(scope, userId)), activity, planned });
        if (decision.kind === 'UNAVAILABLE') throw new AppError('PROVIDER_UNAVAILABLE', 'Paiement indisponible pour le moment', { retryable: true });
        if (decision.kind === 'HOLD') {
          // T3 (G) : place réservée pendant le paiement ; confirmée par le webhook signé du fournisseur.
          // V5.10 : place couverte (offerte, Blowy+…) dont seule l'activité reste à payer → financement gardé sur la place HELD.
          await this.repo.updateSeat(scope, seat.id, { status: 'HELD', holdExpiresAt: decision.holdExpiresAt, respondedAt: scope.now, ...(decision.funding ? { funding: decision.funding, ...(decision.creditRef ? { creditRef: decision.creditRef } : {}) } : {}) });
          await this.events.seatUpdated(scope, outingId, userId, { status: 'HELD', refundState: 'NONE' });
          return { seat: { status: 'HELD', holdExpiresAt: decision.holdExpiresAt.toISOString() } };
        }
        await this.repo.updateSeat(scope, seat.id, { status: 'CONFIRMED', funding: decision.funding, paymentRef: decision.paymentRef, ...(decision.creditRef ? { creditRef: decision.creditRef } : {}), confirmedAt: scope.now, respondedAt: scope.now });
        await this.events.seatUpdated(scope, outingId, userId, { status: 'CONFIRMED', refundState: 'NONE' });
        await scope.outbox.emit({ topic: 'outing.seat_confirmed', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { outingId, seatId: seat.id, userId, funding: decision.funding } });
        await this.lifecycle.afterConfirm(scope, outing, userId);
        return { seat: { status: 'CONFIRMED', funding: decision.funding }, ...(decision.payment ? { payment: decision.payment } : {}) };
      },
    });
    // T3 (G) : intention de paiement créée APRÈS commit (réseau jamais sous verrou), idempotente côté fournisseur.
    if (result.seat.status === 'HELD' && this.funding.prepareIntent) {
      const seat = await this.repo.seat(null, outingId, userId);
      if (!seat) throw Errors.notFound('Sortie');
      const activity = (await this.repo.activityQuote?.(null, outingId)) ?? null;
      return { ...result, payment: await this.funding.prepareIntent({ userId, seatId: seat.id, seatDue: !seat.funding || seat.funding === 'PAID', activity }) };
    }
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

  /** V5.5 (D-056) : reste-t-il à la personne son « imprévu » (1 par 30 j glissants) ? */
  async emergencyLeft(scope: TxScope | null, userId: string, outingId: string, now: Date): Promise<boolean> {
    void outingId;
    const per = this.tuning.outings.emergencyCancelsPerMonth;
    if (per <= 0) return false;
    return emergencyAvailable(await this.repo.emergencyCancelsSince(scope, userId, emergencyWindowStart(now, this.tuning.outings.emergencyWindowDays)), per);
  }

  async preview(userId: string, outingId: string, kind: OutingCancelRequestKind, now: Date): Promise<CancelPreview> {
    const [seat, outing] = await Promise.all([this.repo.seat(null, outingId, userId), this.repo.outing(null, outingId)]);
    if (!seat || !outing) throw Errors.notFound('Sortie');
    if (seat.status !== 'CONFIRMED' && seat.status !== 'HELD' && seat.status !== 'CHECKED_IN') throw Errors.precondition('SEAT_NOT_ACTIVE');
    const afterLock = now >= outing.lockAt && kind !== 'SAFETY';
    return cancelPreview({ funding: seat.funding, now, revealAt: outing.lockAt, kind, ...(afterLock ? { emergencyAvailable: await this.emergencyLeft(null, userId, outingId, now) } : {}) });
  }

  async cancel(userId: string, outingId: string, kind: OutingCancelRequestKind, commandId: string): Promise<CancelPreview> {
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
        // V5.4 (B.8) : le quota d'« imprévu » est relu sous le verrou de la personne (deux annulations simultanées → une seule).
        const afterLock = scope.now >= outing.lockAt && kind !== 'SAFETY';
        const left = afterLock ? await this.emergencyLeft(scope, userId, outingId, scope.now) : undefined;
        // V5.5 (spec §7.2) : un « imprévu » hors quota est REFUSÉ (412 EMERGENCY_QUOTA) — la personne choisit alors
        // en connaissance de cause d'annuler (absence) ; jamais de bascule silencieuse.
        if (kind === 'EMERGENCY' && afterLock && left === false) throw Errors.precondition('EMERGENCY_QUOTA');
        const p = cancelPreview({ funding: seat.funding, now: scope.now, revealAt: outing.lockAt, kind, ...(left !== undefined ? { emergencyAvailable: left } : {}) });
        await this.cancelIn(scope, seat, outing, p);
        return p;
      },
    });
    return result;
  }

  /**
   * Retrait système (D-025, T4) : place annulée `SYSTEM_REMOVAL`, remboursée intégralement (port de
   * financement), sans effet de fiabilité ; le groupe voit « ne pourra pas venir ». Verrous users →
   * outings tenus par l'appelant.
   */
  async systemRemove(scope: TxScope, seat: SeatRow, outing: OutingRow, cancelKind: 'SYSTEM_REMOVAL' | 'SAFETY_EXIT' = 'SYSTEM_REMOVAL'): Promise<string> {
    // `SAFETY_EXIT` = « Je pars, mal à l'aise » (V5.3 B.9) : mêmes effets, sans pénalité.
    await this.cancelIn(scope, seat, outing, { cancelKind: 'SAFETY_EXIT', refund: refundModeFor(seat.funding), countsAsAbsence: false }, cancelKind);
    return (await this.repo.seat(scope, outing.id, seat.userId))?.refundState ?? 'NONE';
  }

  /** Annulation d'une place (verrous users → outings tenus par l'appelant). */
  private async cancelIn(scope: TxScope, seat: SeatRow, outing: OutingRow, p: CancelPreview, cancelKind: SeatCancelKind = p.cancelKind) {
    const outingId = outing.id;
    const userId = seat.userId;
    // V5.4 (B.8) : un « imprévu » n'est pas une absence mais la place n'est pas remboursée (NOT_ELIGIBLE).
    const refundable = !p.countsAsAbsence && p.cancelKind !== 'EMERGENCY';
    let refundState = refundStateFor(p.refund, refundable);
    // T3 (G) + D-042 : carte remboursée intégralement (place payée), 1ʳᵉ offerte qui reste offerte, lot rendu (crédit déprécié).
    const cause = cancelKind === 'SYSTEM_REMOVAL' ? 'SYSTEM_REMOVAL' : p.cancelKind === 'SAFETY_EXIT' ? 'SAFETY_EXIT' : 'USER_EARLY';
    if (refundable && p.refund === 'CARD') refundState = await this.funding.refundCard(scope, { userId, seatId: seat.id, paymentRef: null, cause });
    else if (refundable && p.refund === 'CREDIT' && seat.funding && this.funding.refundCredit) refundState = await this.funding.refundCredit(scope, { userId, seatId: seat.id, funding: seat.funding, cause });
    else if (refundable && seat.funding === 'REFERRAL_FREE' && this.funding.refundCredit) refundState = await this.funding.refundCredit(scope, { userId, seatId: seat.id, funding: seat.funding, cause });
    // V5.10 : l'activité prépayée est remboursée dans tous les cas où la place l'est (place payée : déjà incluse).
    if (refundable && this.funding.refundActivity) refundState = (await this.funding.refundActivity(scope, { userId, seatId: seat.id, cause })) ?? refundState;
    await this.repo.updateSeat(scope, seat.id, { status: 'CANCELLED', cancelKind, refundState, cancelledAt: scope.now });
    const conv = await this.chat.conversationOfOuting(scope, outingId);
    if (conv) await this.chat.revokeMember(scope, conv, userId);
    await this.events.revoke(scope, userId, outingId, conv);
    await this.events.seatUpdated(scope, outingId, userId, { status: 'CANCELLED', refundState });
    // V5.1 E.16 / V5.2 C.8 : après la révélation des visages, annuler = absence (sauf sécurité).
    if (p.countsAsAbsence) await this.lifecycle.absence(scope, userId, 'LATE_CANCEL', seat.id);
    await scope.outbox.emit({ topic: 'outing.seat_cancelled', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { outingId, seatId: seat.id, cancelKind } });
    await this.afterLeave(scope, outing);
  }

  /** Après un départ : sortie sous le seuil avant `startsAt − n h` → annulée ; sinon le groupe est prévenu. */
  private async afterLeave(scope: TxScope, outing: OutingRow) {
    const seats = await this.repo.seats(scope, outing.id);
    const confirmed = seats.filter((s) => s.status === 'CONFIRMED' || s.status === 'CHECKED_IN').map((s) => s.userId);
    const undersizeLimit = outing.startsAt.getTime() - this.tuning.outings.cancelUndersizedBeforeStartHours * 3_600_000;
    if (outing.status === 'CONFIRMED' && confirmed.length < this.tuning.outings.minSizeToHold && scope.now.getTime() < undersizeLimit) {
      await this.lifecycle.cancelOuting(scope, outing, 'UNDERSIZED');
    } else {
      await this.events.updated(scope, outing.id, confirmed, { status: outing.status, confirmedCount: confirmed.length, changed: 'MEMBERS' });
    }
  }

  /**
   * « Je connais quelqu'un ici » (V5.2 C.10, V5.6 A.1) : signalement PRIVÉ, après la confirmation, avant le
   * début. Jamais une absence, jamais compté dans l'imprévu.
   *  - dans le quota (`[T] outings.knowsSomeoneMovesPerMonth` par fenêtre glissante) et lien réel déjà connu
   *    (bande, duo, blocage, contacts évités) → DÉPLACEMENT vers un autre groupe confirmé du même créneau si
   *    une place compatible existe (E18), sinon retrait sans pénalité, remboursé, prioritaire (`MOVED`) ;
   *  - dans le quota, lien inconnu → examen humain (`IN_REVIEW`) ;
   *  - au-delà du quota (E23) → sortie pour raison de sécurité : retrait immédiat, remboursé, sans pénalité,
   *    examinée par un humain (`SAFETY_REVIEW`). Plus jamais `COUNTED_AS_CANCEL`.
   */
  async knowsSomeone(userId: string, outingId: string, targetUserId: string, commandId: string): Promise<{ status: 'MOVED' | 'IN_REVIEW' | 'SAFETY_REVIEW'; newOutingId?: string }> {
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
        // V5.3 B.7 (T4) : ouvert dès la confirmation (statut CONFIRMED = verrouillage J-1 18 h), avant le début.
        const open = seat.status === 'CONFIRMED' && outing.status === 'CONFIRMED' && scope.now >= outing.lockAt && scope.now < outing.startsAt;
        if (!open || !target || targetUserId === userId || (target.status !== 'CONFIRMED' && target.status !== 'CHECKED_IN')) throw Errors.precondition('KNOWS_SOMEONE_NOT_AVAILABLE');
        // Un seul signalement par place (rejeu ou double envoi) : on renvoie l'état déjà enregistré.
        const prior = await this.repo.knowsSomeoneBySeat(scope, seat.id);
        if (prior) return { status: prior.status === 'SAFETY_REVIEW' ? ('SAFETY_REVIEW' as const) : prior.status === 'IN_REVIEW' ? ('IN_REVIEW' as const) : ('MOVED' as const) };
        const o = this.tuning.outings;
        const recent = await this.repo.knowsSomeoneSince(scope, userId, new Date(scope.now.getTime() - o.knowsSomeoneWindowDays * 86_400_000));
        if (recent >= o.knowsSomeoneMovesPerMonth) {
          await this.repo.createKnowsSomeone(scope, { id: this.random.uuid(), seatId: seat.id, userId, targetUserId, status: 'SAFETY_REVIEW' });
          await this.systemRemove(scope, seat, outing, 'SAFETY_EXIT');
          await scope.outbox.emit({ topic: 'outing.knows_someone_review', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { seatId: seat.id } });
          return { status: 'SAFETY_REVIEW' as const };
        }
        if (await this.repo.knownRelation(userId, targetUserId)) {
          await this.repo.createKnowsSomeone(scope, { id: this.random.uuid(), seatId: seat.id, userId, targetUserId, status: 'AUTO_ACCEPTED' });
          const newOutingId = await this.relocateOrRemove(scope, seat, outing);
          return { status: 'MOVED' as const, ...(newOutingId ? { newOutingId } : {}) };
        }
        await this.repo.createKnowsSomeone(scope, { id: this.random.uuid(), seatId: seat.id, userId, targetUserId, status: 'IN_REVIEW' });
        await scope.outbox.emit({ topic: 'outing.knows_someone_review', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { seatId: seat.id } });
        return { status: 'IN_REVIEW' as const };
      },
    });
    return result;
  }

  /**
   * V5.6 (E18) : déplace la personne vers un autre groupe CONFIRMÉ du même créneau (place libre, ≤ 3 du même
   * genre, aucun lien connu avec ses membres) ; sinon retrait sans pénalité, remboursé (`SAFETY_EXIT`).
   * Verrous users → outings tenus par l'appelant (les sorties cibles sont verrouillées ici, après).
   * Renvoie la sortie d'arrivée, ou null si la personne a été retirée.
   */
  async relocateOrRemove(scope: TxScope, seat: SeatRow, outing: OutingRow): Promise<string | null> {
    const maxSame = this.tuning.outings.composition.maxSameGender;
    const gender = await this.repo.genderOf(scope, seat.userId);
    for (const sib of await this.repo.siblingOutings(scope, outing)) {
      // Une sortie admet 4 à 6 personnes (`[T] outings.maxSize`) : la table s'agrandit d'une place si besoin.
      if (sib.members.length >= this.tuning.outings.maxSize || sib.members.some((m) => m.userId === seat.userId)) continue;
      if (gender && sib.members.filter((m) => m.gender === gender).length >= maxSame) continue;
      let known = false;
      for (const m of sib.members) if (await this.repo.knownRelation(seat.userId, m.userId)) { known = true; break; }
      if (known) continue;
      await scope.lock.outings([sib.outingId]);
      await this.repo.relocateSeat(scope, { seatId: seat.id, toOutingId: sib.outingId, newSeatId: this.random.uuid(), acceptDeadline: sib.acceptDeadline });
      // Ancien groupe : « ne pourra pas venir » (aucun motif) ; nouveau groupe : un membre de plus.
      const conv = await this.chat.conversationOfOuting(scope, outing.id);
      if (conv) await this.chat.revokeMember(scope, conv, seat.userId);
      await this.events.revoke(scope, seat.userId, outing.id, conv);
      // Même lieu (autre table du créneau) : la place reste occupée chez lui, rien à compenser ; autre lieu : la table
      // réservée perd une place → compensation 3 € HT (E22).
      await scope.outbox.emit({ topic: 'outing.seat_cancelled', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { outingId: outing.id, seatId: seat.id, cancelKind: sib.venueId === outing.venueId ? 'MOVED' : 'SAFETY_EXIT' } });
      const dest = await this.chat.conversationOfOuting(scope, sib.outingId);
      if (dest) await this.chat.addMember(scope, dest, seat.userId);
      const destSeats = (await this.repo.seats(scope, sib.outingId)).filter((x) => x.status === 'CONFIRMED' || x.status === 'CHECKED_IN').map((x) => x.userId);
      await this.events.seatUpdated(scope, sib.outingId, seat.userId, { status: 'CONFIRMED', refundState: 'NONE' });
      await this.events.updated(scope, sib.outingId, destSeats, { status: 'CONFIRMED', confirmedCount: destSeats.length, changed: 'MEMBERS' });
      await scope.outbox.emit({ topic: 'outing.seat_moved', aggregateType: 'OutingSeat', aggregateId: seat.id, payload: { fromOutingId: outing.id, toOutingId: sib.outingId, userId: seat.userId } });
      await this.afterLeave(scope, outing);
      return sib.outingId;
    }
    await this.systemRemove(scope, seat, outing, 'SAFETY_EXIT');
    return null;
  }

  async checkIn(userId: string, outingId: string, req: CheckInRequest, commandId: string): Promise<{ result: 'ACCEPTED' }> {
    const venue = await this.repo.venueSecretRef(outingId);
    if (!venue) throw Errors.notFound('Sortie');
    // V5.5 (D-062) : code du chevalet uniquement — aucune position n'est demandée ni acceptée.
    const payload = { outingId, method: 'VENUE_CODE', code: req.code };
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
        {
          const max = this.tuning.safety.venueCodeMaxAttempts;
          const used = await this.repo.checkInAttempts(scope, seat.id, 'VENUE_CODE');
          if (used >= max) throw new AppError('RATE_LIMITED', 'Trop d’essais de code', { detailsSafe: { reason: 'CHECKIN_CODE_INVALID', attemptsLeft: 0 } });
          const ok = codeMatches(venueCode(this.secretOf(venue.ref), outing.startsAt), req.code);
          await this.repo.recordCheckInAttempt(scope, { seatId: seat.id, method: 'VENUE_CODE', result: ok ? 'ACCEPTED' : 'CODE_INVALID', accuracyBucket: null });
          if (!ok) return { ok: false, reason: 'CHECKIN_CODE_INVALID', attemptsLeft: max - used - 1 };
        }
        await this.repo.recordCheckIn(scope, seat.id, 'VENUE_CODE');
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
