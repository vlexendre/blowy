/**
 * Cycle de vie d'une sortie (spec-v5 §2.5, V5.1) : formation (≥ minSizeToForm confirmés → chat de
 * groupe), verrouillage la veille (lieu + visages révélés, invitations restantes expirées, ou
 * annulation sous-effectif), ouverture du check-in, clôture (présences, absences, fiabilité,
 * souvenirs, ouverture des votes), dépouillement à date fixe (accords mutuels seulement), annulation
 * avec remboursement, backfill avant verrouillage. Chaque transition est revalidée sous verrou
 * (ordre global users → pets → outings) et idempotente par l'état.
 */
import type { ConnectionKind, OutingCancelReason } from '@blowy/domain';
import { backfillCandidate } from '@blowy/matching/groups';
import { backfillAcceptDeadline } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { GroupChatPort } from '../../../shared/application/ports/group-chat.port.js';
import type { PetMemoryPort } from '../../../shared/application/ports/pet-memory.port.js';
import type { TxScope, UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { EMPTY_RELIABILITY, recordAbsence, recordAttendance, type ReliabilityState } from '../domain/reliability.js';
import { countsAsConfirmed, isPending, occupiesCapacity, refundModeFor } from '../domain/seat-policy.js';
import { pairOf, resolveOutingVotes } from '../domain/votes.js';
import type { OutingEvents } from './outing-events.js';
import type { OutingRow, OutingsRepository, SeatRow } from './ports/outings.repository.js';
import type { SeatFundingPort } from './ports/seat-funding.port.js';

const total = (s: ReliabilityState) => s.attended + s.noShows + s.lateCancels;

export class OutingLifecycle {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly repo: OutingsRepository,
    private readonly chat: GroupChatPort,
    private readonly memories: PetMemoryPort,
    private readonly funding: SeatFundingPort,
    private readonly events: OutingEvents,
    private readonly random: RandomSource,
    private readonly tuning: Tuning,
  ) {}

  private confirmedIds(seats: SeatRow[]) {
    return seats.filter((s) => s.status === 'CONFIRMED' || s.status === 'CHECKED_IN').map((s) => s.userId);
  }

  // ------------------------------------------------------------------ fiabilité (verrou users tenu)
  async absence(scope: TxScope, userId: string, kind: 'NO_SHOW' | 'LATE_CANCEL', episodeKey: string) {
    const fresh = await this.repo.reliabilityEvent(scope, { userId, reason: kind === 'NO_SHOW' ? 'OUTING_NO_SHOW' : 'OUTING_LATE_CANCEL', episodeKey });
    if (!fresh) return;
    const cur = (await this.repo.reliability(scope, userId)) ?? EMPTY_RELIABILITY;
    const { state, paused } = recordAbsence(cur, kind, scope.now, this.tuning);
    await this.repo.saveReliability(scope, userId, state);
    if (paused) await this.repo.reliabilityEvent(scope, { userId, reason: 'RELIABILITY_PAUSE', episodeKey: `${episodeKey}:pause` });
    await this.events.reliabilityUpdated(scope, userId, { attended: state.attended, total: total(state), pausedUntil: state.pausedUntil });
  }

  private async attendance(scope: TxScope, userId: string, episodeKey: string) {
    if (!(await this.repo.reliabilityEvent(scope, { userId, reason: 'OUTING_ATTENDED', episodeKey }))) return;
    const state = recordAttendance((await this.repo.reliability(scope, userId)) ?? EMPTY_RELIABILITY);
    await this.repo.saveReliability(scope, userId, state);
    await this.events.reliabilityUpdated(scope, userId, { attended: state.attended, total: total(state), pausedUntil: state.pausedUntil });
  }

  // ------------------------------------------------------------------ formation (verrous tenus)
  /** Après une confirmation : passage FORMING (chat ouvert) ou ajout au chat. */
  async afterConfirm(scope: TxScope, outing: OutingRow, userId: string) {
    const seats = await this.repo.seats(scope, outing.id);
    const confirmed = this.confirmedIds(seats);
    if (outing.status === 'PROPOSED' && confirmed.length >= this.tuning.outings.minSizeToForm) {
      await this.repo.setOutingStatus(scope, outing.id, 'FORMING');
      const conversationId = this.random.uuid();
      await this.chat.openOutingChat(scope, { conversationId, outingId: outing.id, memberIds: confirmed });
      await this.chat.postSystem(scope, conversationId, 'icebreaker.open');
      await this.events.updated(scope, outing.id, confirmed, { status: 'FORMING', confirmedCount: confirmed.length, changed: 'STATUS' });
      await scope.outbox.emit({ topic: 'outing.formed', aggregateType: 'Outing', aggregateId: outing.id, payload: { outingId: outing.id } });
      return;
    }
    if (outing.status === 'FORMING' || outing.status === 'CONFIRMED') {
      const conv = await this.chat.conversationOfOuting(scope, outing.id);
      if (conv) await this.chat.addMember(scope, conv, userId);
    }
    await this.events.updated(scope, outing.id, confirmed, { status: outing.status, confirmedCount: confirmed.length, changed: 'MEMBERS' });
  }

  // ------------------------------------------------------------------ annulation (verrous tenus)
  /** Rembourse une place annulée par Blowy ou par sécurité (jamais d'effet de fiabilité). */
  async refundFully(scope: TxScope, seat: SeatRow, paymentRef: string | null = null) {
    const mode = refundModeFor(seat.funding);
    if (mode === 'CARD') return this.funding.refundCard(scope, { userId: seat.userId, seatId: seat.id, paymentRef });
    return mode === 'CREDIT' ? ('RECREDITED' as const) : ('NONE' as const);
  }

  async cancelOuting(scope: TxScope, outing: OutingRow, reason: OutingCancelReason) {
    const seats = await this.repo.seats(scope, outing.id);
    const conv = await this.chat.conversationOfOuting(scope, outing.id);
    const affected: string[] = [];
    for (const s of seats) {
      if (!(isPending(s.status) || s.status === 'CONFIRMED' || s.status === 'CHECKED_IN')) continue;
      const refundState = countsAsConfirmed(s.status) ? await this.refundFully(scope, s) : 'NONE';
      await this.repo.updateSeat(scope, s.id, { status: 'CANCELLED', cancelKind: 'SYSTEM_REMOVAL', refundState, cancelledAt: scope.now });
      await this.events.seatUpdated(scope, outing.id, s.userId, { status: 'CANCELLED', refundState });
      if (conv) await this.chat.revokeMember(scope, conv, s.userId);
      await this.events.revoke(scope, s.userId, outing.id, conv);
      affected.push(s.userId);
    }
    await this.repo.setOutingStatus(scope, outing.id, 'CANCELLED', { cancelReason: reason });
    await this.repo.releaseVenueSlot(scope, outing.id);
    if (conv) await this.chat.close(scope, conv);
    await scope.outbox.emit({ topic: 'outing.cancelled', aggregateType: 'Outing', aggregateId: outing.id, payload: { outingId: outing.id, reason, userIds: affected } });
  }

  // ------------------------------------------------------------------ transitions temporelles (job)
  /** Applique la transition due d'une sortie (une seule par appel ; idempotent par l'état). */
  async advance(outingId: string): Promise<string | null> {
    return this.uow.run(async (scope) => {
      const pre = await this.repo.seats(scope, outingId);
      const users = pre.map((s) => s.userId);
      await scope.lock.users(users);
      const pets = await this.memories.primaryPetIds(scope, users);
      await scope.lock.pets([...pets.values()]);
      await scope.lock.outings([outingId]);
      const o = await this.repo.outing(scope, outingId);
      if (!o) return null;
      const now = scope.now;
      if ((o.status === 'PROPOSED' || o.status === 'FORMING') && now >= o.lockAt) return this.lock(scope, o);
      if (o.status === 'CONFIRMED' && now >= o.checkinOpensAt) {
        await this.repo.setOutingStatus(scope, o.id, 'CHECKIN_OPEN');
        const seats = await this.repo.seats(scope, o.id);
        await this.events.updated(scope, o.id, this.confirmedIds(seats), { status: 'CHECKIN_OPEN', confirmedCount: this.confirmedIds(seats).length, changed: 'STATUS' });
        await scope.outbox.emit({ topic: 'outing.checkin_opened', aggregateType: 'Outing', aggregateId: o.id, payload: { outingId: o.id } });
        return 'CHECKIN_OPEN';
      }
      if (o.status === 'CHECKIN_OPEN' && now >= o.checkinClosesAt) return this.done(scope, o);
      if (o.status === 'DONE' && !o.votesClosedAt && now >= o.votesCloseAt) return this.closeVotes(scope, o);
      return null;
    });
  }

  private async lock(scope: TxScope, o: OutingRow) {
    const seats = await this.repo.seats(scope, o.id);
    for (const s of seats.filter((x) => isPending(x.status))) {
      await this.repo.updateSeat(scope, s.id, { status: 'EXPIRED', respondedAt: scope.now });
      await this.events.seatUpdated(scope, o.id, s.userId, { status: 'EXPIRED', refundState: s.refundState });
    }
    const confirmed = this.confirmedIds(seats);
    if (confirmed.length < this.tuning.outings.minSizeToLock) {
      await this.cancelOuting(scope, o, 'UNDERSIZED');
      return 'CANCELLED';
    }
    await this.repo.setOutingStatus(scope, o.id, 'CONFIRMED');
    const conv = await this.chat.conversationOfOuting(scope, o.id);
    if (conv) await this.chat.postSystem(scope, conv, 'icebreaker.lock');
    // Lieu et visages révélés en même temps, à tous les confirmés (V5.1 E.16).
    await this.events.updated(scope, o.id, confirmed, { status: 'CONFIRMED', confirmedCount: confirmed.length, changed: 'VENUE' });
    await scope.outbox.emit({ topic: 'outing.locked', aggregateType: 'Outing', aggregateId: o.id, payload: { outingId: o.id } });
    return 'CONFIRMED';
  }

  private async done(scope: TxScope, o: OutingRow) {
    const seats = await this.repo.seats(scope, o.id);
    const conv = await this.chat.conversationOfOuting(scope, o.id);
    const attended: SeatRow[] = [];
    for (const s of seats) {
      if (s.status === 'CHECKED_IN') {
        await this.repo.updateSeat(scope, s.id, { status: 'ATTENDED' });
        attended.push(s);
      } else if (s.status === 'CONFIRMED') {
        await this.repo.updateSeat(scope, s.id, { status: 'NO_SHOW' });
        if (conv) await this.chat.revokeMember(scope, conv, s.userId);
        await this.events.revoke(scope, s.userId, o.id, conv);
        await this.absence(scope, s.userId, 'NO_SHOW', s.id);
        await scope.outbox.emit({ topic: 'outing.attendance_recorded', aggregateType: 'OutingSeat', aggregateId: s.id, payload: { seatId: s.id, userId: s.userId, attended: false } });
      }
    }
    const votesOpen = attended.length >= this.tuning.votes.minAttendees;
    await this.repo.setOutingStatus(scope, o.id, 'DONE', votesOpen ? {} : { votesClosedAt: scope.now });
    const facts = await this.repo.outingFacts(scope, o.id, scope.now);
    const species = facts ? [...new Set(facts.seats.filter((s) => attended.some((a) => a.userId === s.userId)).map((s) => s.person.pet.species))] : [];
    for (const s of attended) {
      await this.attendance(scope, s.userId, s.id);
      await scope.outbox.emit({ topic: 'outing.attendance_recorded', aggregateType: 'OutingSeat', aggregateId: s.id, payload: { seatId: s.id, userId: s.userId, attended: true } });
      const m = await this.memories.record(scope, { userId: s.userId, kind: 'OUTING_LIVED', refType: 'Outing', refId: o.id, attended: true, data: { weekKey: o.weekKey, venueName: facts?.venue.name ?? '', pets: attended.length, species } });
      if (m?.added) await this.events.petUpdated(scope, s.userId, { petId: m.petId, stage: m.stage, memoryKind: 'OUTING_LIVED', ...(m.accessoriesUnlocked[0] ? { accessoryUnlocked: m.accessoriesUnlocked[0] } : {}) });
    }
    if (votesOpen) await this.events.votesOpened(scope, o.id, attended.map((s) => s.userId), o.votesCloseAt);
    else if (conv) await this.chat.close(scope, conv);
    await scope.outbox.emit({ topic: 'outing.done', aggregateType: 'Outing', aggregateId: o.id, payload: { outingId: o.id, attended: attended.length } });
    return 'DONE';
  }

  /**
   * Dépouillement à date fixe (V5.1 A.4) : accords mutuels seulement, « plus » incompatible ramené à
   * « ami·e » en silence. Les membres d'une même team présents deviennent liés (PLUS_ONE), sans vote.
   */
  private async closeVotes(scope: TxScope, o: OutingRow) {
    const attendees = await this.repo.attendees(scope, o.id, scope.now);
    const ballots = await this.repo.allBallots(scope, o.id);
    const pairs = resolveOutingVotes(attendees, ballots);
    const facts = await this.repo.outingFacts(scope, o.id, scope.now);
    const person = (id: string) => facts?.seats.find((s) => s.userId === id)?.person;
    const counts = new Map(attendees.map((a) => [a.userId, { band: 0, duo: 0 }]));
    for (const p of pairs) {
      const [low, high] = pairOf(p.a, p.b);
      await this.applyConnection(scope, o, low, high, p.kind, person, counts);
    }
    // Teams : liées sans vote ni révélation (déjà venues ensemble).
    const sorted = [...attendees].sort((x, y) => (x.userId < y.userId ? -1 : 1));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]!;
        const b = sorted[j]!;
        if (!a.teamId || a.teamId !== b.teamId) continue;
        const link = await this.repo.ensureBandLink(scope, { id: this.random.uuid(), low: a.userId, high: b.userId, origin: 'PLUS_ONE', outingId: o.id, invitedById: a.userId });
        if (link.created) {
          await this.chat.openLinkChat(scope, { conversationId: this.random.uuid(), kind: 'BAND', friendshipId: link.id, memberIds: [a.userId, b.userId] });
          await this.events.bandUpdated(scope, link.id, [a.userId, b.userId], 'ACTIVE');
        }
      }
    }
    await this.repo.setOutingStatus(scope, o.id, 'DONE', { votesClosedAt: scope.now });
    const conv = await this.chat.conversationOfOuting(scope, o.id);
    if (conv) await this.chat.close(scope, conv);
    await this.events.votesClosed(scope, o.id, counts);
    await scope.outbox.emit({ topic: 'outing.votes_closed', aggregateType: 'Outing', aggregateId: o.id, payload: { outingId: o.id } });
    return 'VOTES_CLOSED';
  }

  private async applyConnection(scope: TxScope, o: OutingRow, low: string, high: string, kind: ConnectionKind, person: (id: string) => { firstName: string; pet: unknown } | undefined, counts: Map<string, { band: number; duo: number }>) {
    let friendshipId: string | null = null;
    let duoId: string | null = null;
    if (kind === 'FRIEND') {
      const link = await this.repo.ensureBandLink(scope, { id: this.random.uuid(), low, high, origin: 'OUTING_VOTE', outingId: o.id, invitedById: low });
      friendshipId = link.id;
      if (link.created) await this.chat.openLinkChat(scope, { conversationId: this.random.uuid(), kind: 'BAND', friendshipId: link.id, memberIds: [low, high] });
    } else {
      const duo = await this.repo.createDuo(scope, { id: this.random.uuid(), low, high, outingId: o.id });
      duoId = duo.id;
      if (duo.created) await this.chat.openLinkChat(scope, { conversationId: this.random.uuid(), kind: 'DUO', duoId: duo.id, memberIds: [low, high] });
    }
    if (!(await this.repo.createReveal(scope, { id: this.random.uuid(), outingId: o.id, low, high, kind, friendshipId, duoId }))) return;
    for (const [me, other] of [
      [low, high],
      [high, low],
    ] as const) {
      const c = counts.get(me);
      if (c) {
        if (kind === 'FRIEND') c.band++;
        else c.duo++;
      }
      const p = person(other);
      await this.events.connectionRevealed(scope, (friendshipId ?? duoId)!, me, {
        kind,
        other: { userId: other, firstName: p?.firstName ?? '', pet: p?.pet },
        ...(friendshipId ? { linkId: friendshipId } : { duoId: duoId! }),
        source: 'OUTING',
      });
      if (kind === 'FRIEND') {
        const m = await this.memories.record(scope, { userId: me, kind: 'BAND_NEW_MEMBER', refType: 'Friendship', refId: friendshipId!, data: { petName: (p?.pet as { name?: string } | undefined)?.name ?? '', species: (p?.pet as { species?: string } | undefined)?.species ?? '' } });
        if (m?.added) await this.events.petUpdated(scope, me, { petId: m.petId, stage: m.stage, memoryKind: 'BAND_NEW_MEMBER', ...(m.accessoriesUnlocked[0] ? { accessoryUnlocked: m.accessoriesUnlocked[0] } : {}) });
      }
    }
    if (friendshipId) await this.events.bandUpdated(scope, friendshipId, [low, high], 'ACTIVE');
    await scope.outbox.emit({ topic: 'connection.revealed', aggregateType: 'Outing', aggregateId: o.id, payload: { kind, users: [low, high], source: 'OUTING', ...(friendshipId ? { friendshipId } : { duoId }) } });
  }

  // ------------------------------------------------------------------ invitations expirées et backfill
  async expireInvitation(outingId: string, seatId: string, userId: string) {
    return this.uow.run(async (scope) => {
      await scope.lock.users([userId]);
      await scope.lock.outings([outingId]);
      const seat = await this.repo.seat(scope, outingId, userId);
      if (!seat || seat.id !== seatId || !isPending(seat.status) || seat.acceptDeadline > scope.now) return false;
      await this.repo.updateSeat(scope, seat.id, { status: 'EXPIRED', respondedAt: scope.now });
      await this.events.seatUpdated(scope, outingId, userId, { status: 'EXPIRED', refundState: seat.refundState });
      return true;
    });
  }

  /** Backfill (§4.6) : une place libérée avant le verrouillage est proposée à une demande non placée. */
  async backfill(outingId: string, now: Date): Promise<boolean> {
    const input = await this.repo.backfillPool(outingId, now);
    if (!input || input.pool.length === 0) return false;
    const chosen = backfillCandidate({ outingMembers: input.members, slot: input.slot, pool: input.pool, facts: await this.repo.compositionFacts([...input.members, ...input.pool].map((c) => c.profile.userId)), seed: `backfill|${outingId}`, tuning: this.tuning });
    if (!chosen) return false;
    const meta = input.meta.find((m) => m.userId === chosen);
    return this.uow.run(async (scope) => {
      await scope.lock.users([chosen]);
      await scope.lock.outings([outingId]);
      const o = await this.repo.outing(scope, outingId);
      if (!o || (o.status !== 'PROPOSED' && o.status !== 'FORMING') || scope.now >= o.lockAt) return false;
      const seats = await this.repo.seats(scope, outingId);
      if (seats.filter((s) => occupiesCapacity(s.status)).length >= o.capacity) return false;
      const acceptDeadline = new Date(backfillAcceptDeadline(scope.now.getTime(), o.lockAt.getTime(), this.tuning));
      if (!(await this.repo.createSeat(scope, { id: this.random.uuid(), outingId, userId: chosen, weekKey: o.weekKey, teamId: null, acceptDeadline }))) return false;
      if (meta?.requestId) await this.repo.setRequestStatus(scope, meta.requestId, 'PLACED', null);
      await this.events.invited(scope, outingId, chosen, acceptDeadline);
      await scope.outbox.emit({ topic: 'outing.invited', aggregateType: 'Outing', aggregateId: outingId, payload: { outingId, userId: chosen, backfill: true } });
      return true;
    });
  }
}
