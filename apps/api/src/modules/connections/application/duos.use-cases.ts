/**
 * Commandes du module `connections` (spec-v5 §7.3 ; V5.1 F ; V5.2 H.25) : voie Duo (accepter /
 * passer une proposition), rendez-vous (proposer, répondre, annuler, check-in), après-rendez-vous
 * (bulletin), « partir proprement » (duo et bande), drapeau œuf. Chaque commande est idempotente
 * (Idempotency-Key), revalidée sous verrous (users → pets → friendships → duos) ; toute réponse
 * ne contient que ce que le lecteur a le droit de voir.
 */
import { accuracyBucket, isDuoTerminal, seeksOf, type DateResponse, type SeatCancelRequestKind, type VoteChoice } from '@blowy/domain';
import type { AcceptDuoProposalResult, CheckInRequest } from '@blowy/api-contract';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { codeMatches, geoCheckIn, venueCode } from '../../outings/domain/checkin.js';
import { canMoveDuo, checkinWindow, DATE_DURATION_MS, dateInRange, duoCapacity, eggActive, eggEligible, isLateCancel, isUnlocked, localMinuteOf, restingStatus, voteOptionsFor } from '../domain/duo-policy.js';
import type { ConnectionsDeps } from './deps.js';
import type { DuoDateRow, DuoRow } from './ports/connections.repository.js';

export const otherOf = (d: Pick<DuoRow, 'userLowId' | 'userHighId'>, me: string) => (d.userLowId === me ? d.userHighId : d.userLowId);
export const isMember = (d: Pick<DuoRow, 'userLowId' | 'userHighId'>, me: string) => d.userLowId === me || d.userHighId === me;

export class DuoUseCases {
  constructor(private readonly x: ConnectionsDeps) {}

  private get repo() {
    return this.x.repo;
  }

  /** Blowy+ (port économie) : duos illimités. Sans port : gratuit. */
  async hasPlus(userId: string, at: Date): Promise<boolean> {
    if (!this.x.entitlements) return false;
    return (await this.x.entitlements.activeKeys(userId, at)).has('PLUS_MONTHLY_BENEFITS');
  }

  /**
   * Duos actifs autorisés (V5.2 H.25, D-041) : lu du port `DUO_ALLOWANCE` d'economy (1 gratuit, illimité
   * Blowy+) ; sans port, `tuning.duo.maxActiveFree` (ou illimité si Blowy+ via les droits).
   */
  async capacity(userId: string, at: Date): Promise<number> {
    if (this.x.allowance) return (await this.x.allowance.maxActiveDuos(userId, at)) ?? Number.POSITIVE_INFINITY;
    return duoCapacity(await this.hasPlus(userId, at), this.x.tuning.duo.maxActiveFree);
  }

  // ------------------------------------------------------------------ voie Duo
  async acceptProposal(userId: string, proposalId: string, commandId: string): Promise<AcceptDuoProposalResult> {
    const pre = await this.repo.laneProposal(null, proposalId);
    if (!pre || (pre.userLowId !== userId && pre.userHighId !== userId) || pre.passedBy.includes(userId)) throw Errors.notFound('Proposition');
    const otherId = pre.userLowId === userId ? pre.userHighId : pre.userLowId;
    const now0 = this.x.clock.now();
    const [plusMe, plusOther, photoMe, photoOther] = await Promise.all([this.capacity(userId, now0), this.capacity(otherId, now0), this.x.photos.currentProfilePhotoId(userId), this.x.photos.currentProfilePhotoId(otherId)]);
    const { result } = await this.x.bus.execute({
      actorId: userId,
      operation: 'duos.accept_proposal',
      commandId,
      payload: { proposalId },
      handle: async (scope): Promise<AcceptDuoProposalResult> => {
        await scope.lock.users([userId, otherId]);
        const p = (await this.repo.laneProposal(scope, proposalId))!;
        if (p.status === 'ACCEPTED' && p.duoId) return { status: 'MATCHED', duoId: p.duoId };
        if (p.status !== 'OPEN' || p.expiresAt <= scope.now) throw Errors.precondition('PROPOSAL_NOT_OPEN');
        if (await this.x.blocks.isBlockedBetween(userId, otherId)) throw Errors.notFound('Proposition');
        // V5.3 (E.20) : jamais de Duo pour qui a choisi « en petit groupe ».
        if (!(await this.laneEnabled(userId))) throw Errors.precondition('DUO_LANE_DISABLED');
        await this.assertCanDuo(scope, userId, plusMe, photoMe);
        await this.repo.acceptLaneProposal(scope, proposalId, userId);
        if (!p.acceptedBy.includes(otherId) || p.passedBy.includes(otherId)) return { status: 'WAITING_OTHER', duoId: null };
        // Second accord : l'autre est revalidé ; s'il ne peut plus, la proposition s'éteint sans motif.
        const otherOk = (await this.laneEnabled(otherId)) && (await this.canDuo(scope, otherId, plusOther, photoOther));
        if (!otherOk) {
          await this.repo.setLaneProposalStatus(scope, proposalId, 'INVALIDATED');
          throw Errors.precondition('PROPOSAL_NOT_OPEN');
        }
        const [low, high] = userId < otherId ? [userId, otherId] : [otherId, userId];
        const duoId = this.x.random.uuid();
        const t = this.x.tuning.duo;
        if (!(await this.repo.createDuo(scope, { id: duoId, low, high, origin: 'LANE', status: 'EXCHANGE', exchangeEndsAt: new Date(scope.now.getTime() + t.exchangeHours * 3_600_000), dateDeadline: new Date(scope.now.getTime() + t.dateDeadlineDays * 86_400_000), proposalId }))) {
          // Un duo vivant existe déjà pour cette paire (né d'une sortie) : la proposition n'a plus d'objet.
          await this.repo.setLaneProposalStatus(scope, proposalId, 'INVALIDATED');
          throw Errors.precondition('PROPOSAL_NOT_OPEN');
        }
        await this.repo.setLaneProposalStatus(scope, proposalId, 'ACCEPTED');
        // Chat « pets » : texte seul pendant l'échange (le vocal n'est jamais une condition).
        await this.x.chat.openLinkChat(scope, { conversationId: this.x.random.uuid(), kind: 'DUO', duoId, memberIds: [low, high] });
        await this.x.events.duoUpdated(scope, duoId, [low, high], 'EXCHANGE', 'STATUS');
        await scope.outbox.emit({ topic: 'duo.matched', aggregateType: 'Duo', aggregateId: duoId, payload: { duoId, userIds: [low, high] } });
        return { status: 'MATCHED', duoId };
      },
    });
    return result;
  }

  async laneEnabled(userId: string): Promise<boolean> {
    const m = (await this.repo.seeks([userId], this.x.clock.now())).get(userId)?.meetingMode ?? null;
    return m === 'DUO' || m === 'BOTH';
  }

  private async canDuo(scope: TxScope, userId: string, capacity: number, photo: string | null): Promise<boolean> {
    try {
      await this.assertCanDuo(scope, userId, capacity, photo);
      return true;
    } catch {
      return false;
    }
  }

  /** Vérification, photo, pause, capacité (1 duo actif gratuit ; illimité Blowy+). */
  private async assertCanDuo(scope: TxScope, userId: string, capacity: number, photo: string | null) {
    if (!(await this.repo.verified(scope, userId, scope.now))) throw Errors.precondition('AGE_VERIFICATION_REQUIRED');
    if (!photo) throw Errors.precondition('PHOTO_REQUIRED');
    if (await this.x.reliability.isPaused(scope, userId, scope.now)) throw Errors.precondition('RELIABILITY_PAUSED');
    // §7.3 : `{upgrade:false}` — aucun argument commercial dans l'erreur ; l'écran explique le quota.
    if ((await this.repo.activeDuoCount(scope, userId)) >= capacity) throw new AppError('CONFLICT', 'Un duo est déjà en cours', { detailsSafe: { reason: 'DUO_LIMIT_REACHED', upgrade: false } });
  }

  async passProposal(userId: string, proposalId: string, commandId: string) {
    const pre = await this.repo.laneProposal(null, proposalId);
    if (!pre || (pre.userLowId !== userId && pre.userHighId !== userId)) throw Errors.notFound('Proposition');
    await this.x.bus.execute({
      actorId: userId,
      operation: 'duos.pass_proposal',
      commandId,
      payload: { proposalId },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        const p = (await this.repo.laneProposal(scope, proposalId))!;
        if (p.passedBy.includes(userId)) return { status: 'PASSED' as const };
        if (p.status !== 'OPEN' || p.expiresAt <= scope.now || p.acceptedBy.includes(userId)) throw Errors.precondition('PROPOSAL_NOT_OPEN');
        // Silencieux : aucun événement, la proposition reste OPEN chez l'autre jusqu'à son expiration.
        await this.repo.passLaneProposal(scope, proposalId, userId);
        return { status: 'PASSED' as const };
      },
    });
    return { status: 'PASSED' as const };
  }

  // ------------------------------------------------------------------ rendez-vous
  /** Charge un duo dont je suis membre (404 identique sinon) et prend les verrous. */
  private async lockedDuo(scope: TxScope, userId: string, duoId: string, withPets = false): Promise<DuoRow> {
    const pre = await this.repo.duo(scope, duoId);
    if (!pre || !isMember(pre, userId)) throw Errors.notFound('Duo');
    await scope.lock.users([pre.userLowId, pre.userHighId]);
    if (withPets) await scope.lock.pets([...(await this.x.memories.primaryPetIds(scope, [pre.userLowId, pre.userHighId])).values()]);
    await scope.lock.duos([duoId]);
    return (await this.repo.duo(scope, duoId))!;
  }

  async proposeDate(userId: string, duoId: string, req: { venueId: string; startsAt: string }, commandId: string): Promise<DuoDateRow> {
    const venue = await this.repo.venue(req.venueId);
    const { result } = await this.x.bus.execute({
      actorId: userId,
      operation: 'duos.date.propose',
      commandId,
      payload: { duoId, ...req },
      handle: async (scope) => {
        const d = await this.lockedDuo(scope, userId, duoId);
        if (isDuoTerminal(d.status)) throw Errors.precondition('ALREADY_CLOSED');
        // Jamais avant le déblocage des visages (V5.1 F.18).
        if (!isUnlocked(d.status) || d.status === 'AFTER_VOTE') throw Errors.precondition('DUO_NOT_UNLOCKED');
        if (await this.x.reliability.isPaused(scope, userId, scope.now)) throw Errors.precondition('RELIABILITY_PAUSED');
        const allowed = await this.repo.venuesFor([d.userLowId, d.userHighId]);
        if (!venue || !allowed.some((v) => v.id === venue.id)) throw Errors.precondition('VENUE_NOT_IN_NEIGHBORHOOD');
        const startsAt = new Date(req.startsAt);
        if (!dateInRange({ origin: d.origin, dateDeadline: d.dateDeadline, startsAt, localMinute: localMinuteOf(startsAt, venue.timezone), now: scope.now }, this.x.tuning)) throw Errors.precondition('DATE_OUT_OF_RANGE');
        const live = await this.repo.liveDate(scope, duoId);
        if (live && (live.status === 'CONFIRMED' || live.proposedByUserId === userId)) throw Errors.precondition('DATE_ALREADY_PROPOSED');
        // Contre-proposition : l'ancienne proposition de l'autre est remplacée.
        if (live) await this.repo.updateDate(scope, live.id, { status: 'SUPERSEDED' });
        const id = this.x.random.uuid();
        await this.repo.createDate(scope, { id, duoId, proposedByUserId: userId, venueId: venue.id, startsAt, endsAt: new Date(startsAt.getTime() + DATE_DURATION_MS) });
        if (d.status !== 'DATE_PROPOSED') {
          if (!canMoveDuo(d.status, 'DATE_PROPOSED')) throw Errors.precondition('DUO_NOT_UNLOCKED');
          await this.repo.updateDuo(scope, duoId, { status: 'DATE_PROPOSED' });
        }
        await this.x.events.duoUpdated(scope, duoId, [d.userLowId, d.userHighId], 'DATE_PROPOSED', 'DATE');
        await scope.outbox.emit({ topic: 'duo.date_proposed', aggregateType: 'DuoDate', aggregateId: id, payload: { duoId, duoDateId: id, toUserId: otherOf(d, userId) } });
        return (await this.repo.date(scope, id))!;
      },
    });
    return result;
  }

  async respondDate(userId: string, duoId: string, dateId: string, decision: DateResponse, commandId: string): Promise<DuoDateRow> {
    const { result } = await this.x.bus.execute({
      actorId: userId,
      operation: 'duos.date.respond',
      commandId,
      payload: { duoId, dateId, decision },
      handle: async (scope) => {
        const d = await this.lockedDuo(scope, userId, duoId);
        const date = await this.repo.date(scope, dateId);
        if (!date || date.duoId !== duoId) throw Errors.notFound('Rendez-vous');
        if (date.status !== 'PROPOSED' || date.startsAt <= scope.now) throw Errors.precondition('DATE_NOT_PROPOSED');
        if (date.proposedByUserId === userId) throw Errors.precondition('OWN_PROPOSAL');
        if (decision === 'ACCEPT') {
          if (await this.x.reliability.isPaused(scope, userId, scope.now)) throw Errors.precondition('RELIABILITY_PAUSED');
          await this.repo.updateDate(scope, dateId, { status: 'CONFIRMED' });
          await this.repo.updateDuo(scope, duoId, { status: 'DATE_CONFIRMED' });
          await this.x.events.duoUpdated(scope, duoId, [d.userLowId, d.userHighId], 'DATE_CONFIRMED', 'DATE');
          await scope.outbox.emit({ topic: 'duo.date_confirmed', aggregateType: 'DuoDate', aggregateId: dateId, payload: { duoId, duoDateId: dateId, userIds: [d.userLowId, d.userHighId] } });
        } else {
          await this.repo.updateDate(scope, dateId, { status: 'DECLINED' });
          const back = restingStatus(d.together);
          await this.repo.updateDuo(scope, duoId, { status: back });
          await this.x.events.duoUpdated(scope, duoId, [d.userLowId, d.userHighId], back, 'DATE');
        }
        return (await this.repo.date(scope, dateId))!;
      },
    });
    return result;
  }

  async cancelDate(userId: string, duoId: string, dateId: string, kind: SeatCancelRequestKind, commandId: string): Promise<DuoDateRow> {
    const { result } = await this.x.bus.execute({
      actorId: userId,
      operation: 'duos.date.cancel',
      commandId,
      payload: { duoId, dateId, kind },
      handle: async (scope) => {
        const d = await this.lockedDuo(scope, userId, duoId);
        const date = await this.repo.date(scope, dateId);
        if (!date || date.duoId !== duoId) throw Errors.notFound('Rendez-vous');
        if (date.status !== 'CONFIRMED' || scope.now >= date.startsAt) throw Errors.precondition('DATE_NOT_CONFIRMED');
        // < 24 h : compté (annulation tardive), sauf motif sécurité ; jamais montré à l'autre.
        const late = kind === 'CANT_MAKE_IT' && isLateCancel(date.startsAt, scope.now);
        await this.repo.updateDate(scope, dateId, { status: 'CANCELLED', cancelledByUserId: userId, lateCancel: late });
        if (late) await this.x.reliability.recordDuoDate(scope, { userId, outcome: 'LATE_CANCEL', key: `duo-date:${dateId}` });
        const back = restingStatus(d.together);
        await this.repo.updateDuo(scope, duoId, { status: back });
        await this.x.events.duoUpdated(scope, duoId, [d.userLowId, d.userHighId], back, 'DATE');
        await scope.outbox.emit({ topic: 'duo.date_cancelled', aggregateType: 'DuoDate', aggregateId: dateId, payload: { duoId, duoDateId: dateId, userIds: [d.userLowId, d.userHighId] } });
        return (await this.repo.date(scope, dateId))!;
      },
    });
    return result;
  }

  async checkIn(userId: string, duoId: string, dateId: string, req: CheckInRequest, commandId: string): Promise<{ result: 'ACCEPTED' }> {
    const pre = await this.repo.date(null, dateId);
    const venue = pre ? await this.repo.venue(pre.venueId) : null;
    // L'empreinte d'idempotence ne contient jamais la position.
    const payload = req.method === 'GEO' ? { duoId, dateId, method: 'GEO', tap: commandId } : { duoId, dateId, method: 'VENUE_CODE', code: req.code };
    type Outcome = { ok: true } | { ok: false; reason: string; attemptsLeft?: number };
    const { result } = await this.x.bus.execute<typeof payload, Outcome>({
      actorId: userId,
      operation: 'duos.date.check_in',
      commandId,
      payload,
      handle: async (scope) => {
        const d = await this.lockedDuo(scope, userId, duoId);
        const date = await this.repo.date(scope, dateId);
        if (!date || date.duoId !== duoId || !venue) throw Errors.notFound('Rendez-vous');
        const mine = d.userLowId === userId ? date.checkinLowAt : date.checkinHighAt;
        if (mine) return { ok: true };
        const w = checkinWindow(date.startsAt, this.x.tuning);
        if (date.status !== 'CONFIRMED' || scope.now < w.opensAt || scope.now >= w.closesAt) throw Errors.precondition('CHECKIN_NOT_OPEN');
        if (req.method === 'GEO') {
          const r = geoCheckIn(req, venue, this.x.tuning);
          await this.repo.recordCheckInAttempt(scope, { dateId, userId, method: 'GEO', result: r, accuracyBucket: accuracyBucket(req.accuracyM) });
          if (r !== 'ACCEPTED') return { ok: false, reason: r === 'TOO_FAR' ? 'CHECKIN_TOO_FAR' : 'CHECKIN_LOW_ACCURACY' };
        } else {
          const max = this.x.tuning.safety.venueCodeMaxAttempts;
          const used = await this.repo.checkInAttempts(scope, dateId, userId, 'VENUE_CODE');
          if (used >= max) throw new AppError('RATE_LIMITED', 'Trop d’essais de code', { detailsSafe: { reason: 'CHECKIN_CODE_INVALID', attemptsLeft: 0 } });
          const ok = codeMatches(venueCode(this.x.secretOf(venue.secretRef), date.startsAt), req.code);
          await this.repo.recordCheckInAttempt(scope, { dateId, userId, method: 'VENUE_CODE', result: ok ? 'ACCEPTED' : 'CODE_INVALID', accuracyBucket: null });
          if (!ok) return { ok: false, reason: 'CHECKIN_CODE_INVALID', attemptsLeft: max - used - 1 };
        }
        await this.repo.updateDate(scope, dateId, d.userLowId === userId ? { checkinLowAt: scope.now } : { checkinHighAt: scope.now });
        // L'autre ne voit pas mon arrivée ici (pas de suivi) ; seul le proche voit « arrivé·e ».
        await scope.outbox.emit({ topic: 'duo.date_checked_in', aggregateType: 'DuoDate', aggregateId: dateId, payload: { duoDateId: dateId, userId } });
        return { ok: true };
      },
    });
    if (!result.ok) throw Errors.precondition(result.reason, result.attemptsLeft !== undefined ? { attemptsLeft: result.attemptsLeft } : {});
    return { result: 'ACCEPTED' };
  }

  /** Bulletin d'après-RDV (présents seulement ; 404 sinon). Aucun événement à la saisie. */
  async vote(userId: string, duoId: string, dateId: string, choice: VoteChoice, commandId: string): Promise<{ myChoice: VoteChoice }> {
    const seeks = (await this.repo.seeks([userId], this.x.clock.now())).get(userId);
    const { result } = await this.x.bus.execute({
      actorId: userId,
      operation: 'duos.vote.cast',
      commandId,
      payload: { duoId, dateId, choice },
      handle: async (scope) => {
        const d = await this.lockedDuo(scope, userId, duoId);
        const date = await this.repo.date(scope, dateId);
        const mine = date && (d.userLowId === userId ? date.checkinLowAt : date.checkinHighAt);
        if (!date || date.duoId !== duoId || date.status !== 'DONE' || !date.votesCloseAt || !mine) throw Errors.notFound('Rendez-vous');
        if (date.votesClosedAt || scope.now >= date.votesCloseAt || d.status !== 'AFTER_VOTE') throw Errors.precondition('VOTE_WINDOW_CLOSED');
        if (!voteOptionsFor(seeks ? seeksOf(seeks.lookingFor).romance : false).includes(choice)) throw Errors.precondition('PLUS_NOT_OFFERED');
        await this.repo.saveBallot(scope, dateId, userId, choice);
        return { myChoice: choice };
      },
    });
    return result;
  }

  // ------------------------------------------------------------------ partir proprement
  async leave(userId: string, duoId: string, commandId: string): Promise<{ duoId: string; status: 'LEFT' }> {
    await this.x.bus.execute({
      actorId: userId,
      operation: 'duos.leave',
      commandId,
      payload: { duoId },
      handle: async (scope) => {
        const d = await this.lockedDuo(scope, userId, duoId);
        if (isDuoTerminal(d.status)) throw Errors.precondition('ALREADY_CLOSED');
        await this.x.ending.end(scope, d, 'LEFT', 'system.duo.left', userId);
        return null;
      },
    });
    return { duoId, status: 'LEFT' };
  }

  async leaveBand(userId: string, linkId: string, commandId: string): Promise<{ linkId: string; status: 'WITHDRAWN' }> {
    const pre = await this.repo.bandLink(null, linkId);
    if (!pre || !pre.origin || (pre.userLowId !== userId && pre.userHighId !== userId)) throw Errors.notFound('Lien');
    await this.x.bus.execute({
      actorId: userId,
      operation: 'band.leave',
      commandId,
      payload: { linkId },
      handle: async (scope) => {
        await scope.lock.users([pre.userLowId, pre.userHighId]);
        await scope.lock.friendships([linkId]);
        const l = (await this.repo.bandLink(scope, linkId))!;
        if (l.status !== 'ACTIVE') throw Errors.precondition('ALREADY_LEFT');
        await this.x.ending.withdrawBand(scope, l, 'LEFT');
        return null;
      },
    });
    return { linkId, status: 'WITHDRAWN' };
  }

  // ------------------------------------------------------------------ Ta rue (V5.3 F.24, facultatif)
  /** Ranger ses souvenirs : ordre du décor ; identifiants qui ne sont pas à moi ignorés. Aucun événement. */
  async arrangeStreet(userId: string, memoryIds: string[], commandId: string) {
    const mine = new Set((await this.repo.memories(userId, 500)).map((m) => m.id));
    const kept = [...new Set(memoryIds)].filter((id) => mine.has(id)).slice(0, 30);
    await this.x.bus.execute({
      actorId: userId,
      operation: 'band.street.arrange',
      commandId,
      payload: { memoryIds },
      handle: async (scope) => {
        await this.repo.setStreetArrangement(scope, userId, kept);
        return null;
      },
    });
  }

  /** Offrir (montrer) un accessoire gagné au pet d'un membre de MA bande ; aucune notification. */
  async giftAccessory(userId: string, linkId: string, accessoryId: string, commandId: string): Promise<{ status: 'GIVEN' }> {
    const l = await this.repo.bandLink(null, linkId);
    if (!l || !l.origin || l.status !== 'ACTIVE' || (l.userLowId !== userId && l.userHighId !== userId)) throw Errors.notFound('Lien');
    const to = l.userLowId === userId ? l.userHighId : l.userLowId;
    if (await this.x.blocks.isBlockedBetween(userId, to)) throw Errors.notFound('Lien');
    await this.x.bus.execute({
      actorId: userId,
      operation: 'band.street.gift',
      commandId,
      payload: { linkId, accessoryId },
      handle: async (scope) => {
        await scope.lock.users([l.userLowId, l.userHighId]);
        if (!(await this.repo.hasAccessory(scope, userId, accessoryId))) throw Errors.precondition('ACCESSORY_NOT_UNLOCKED');
        await this.repo.createGift(scope, { fromUserId: userId, toUserId: to, linkId, accessoryId });
        return null;
      },
    });
    return { status: 'GIVEN' };
  }

  // ------------------------------------------------------------------ œuf (drapeau T9)
  async setEgg(userId: string, duoId: string, enabled: boolean, commandId: string) {
    const { result } = await this.x.bus.execute({
      actorId: userId,
      operation: 'duos.egg.set',
      commandId,
      payload: { duoId, enabled },
      handle: async (scope) => {
        const d = await this.lockedDuo(scope, userId, duoId);
        const eligible = eggEligible(d, this.x.tuning);
        if (enabled && !eligible) throw Errors.precondition('EGG_NOT_ELIGIBLE');
        const patch = d.userLowId === userId ? { eggOptInLow: enabled } : { eggOptInHigh: enabled };
        await this.repo.updateDuo(scope, duoId, patch);
        const next = { ...d, ...patch };
        if (eggActive(next) !== eggActive(d)) await this.x.events.duoUpdated(scope, duoId, [d.userLowId, d.userHighId], d.status, 'EGG');
        return { myOptIn: enabled, active: eggActive(next), eligible };
      },
    });
    return result;
  }
}

