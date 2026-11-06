/**
 * Adaptateur Prisma du port OutingsRepository. Toute écriture sous la portée transactionnelle de
 * l'appelant (`txOf(scope)`) ; les lectures hors transaction utilisent le client partagé.
 * Ne stocke jamais de position de check-in ; les bulletins ne sont lus que par le dépouillement et
 * par leur auteur.
 */
import { uuidv7, isUniqueViolation, type Db, type Tx } from '@blowy/database';
import { ACTIVE_SEAT_STATUSES, seeksOf, type ConnectionKind, type Gender, type OutingRequestStatus, type OutingStatus, type VoteChoice } from '@blowy/domain';
import { VENUE_OFFERS } from '@blowy/content';
import type { OutingCandidate, SlotOffer } from '@blowy/matching/groups';
import { mondayOfWeek, wallToUtc } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { OutingFacts } from '../domain/facts.js';
import type { ReliabilityState } from '../domain/reliability.js';
import type { Attendee } from '../domain/votes.js';
import type { BandLinkRow, CandidateMeta, CompositionScope, NewOuting, OutingRow, OutingsRepository, RequestRow, RequesterFacts, SeatRow, TeamRow, WeekSlot } from '../application/ports/outings.repository.js';
import { CANDIDATE_INCLUDE, compositionFacts, toCandidate, verifiedSet } from './candidates.js';
import { ageOf, loadPersons, petCardOf, PERSON_INCLUDE, personOf } from './person-facts.js';

const ACTIVE = ACTIVE_SEAT_STATUSES as unknown as ('INVITED' | 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'ATTENDED' | 'NO_SHOW')[];
const DAY = 86_400_000;
const offerLabel = (key: string) => VENUE_OFFERS.find((o) => o.key === key || o.id === key)?.fr ?? '';

const seatRow = (s: { id: string; outingId: string; userId: string; weekKey: string; teamId: string | null; status: SeatRow['status']; funding: SeatRow['funding']; acceptDeadline: Date; holdExpiresAt: Date | null; confirmedAt: Date | null; cancelKind: SeatRow['cancelKind']; refundState: SeatRow['refundState'] }): SeatRow => ({
  id: s.id,
  outingId: s.outingId,
  userId: s.userId,
  weekKey: s.weekKey,
  teamId: s.teamId,
  status: s.status,
  funding: s.funding,
  acceptDeadline: s.acceptDeadline,
  holdExpiresAt: s.holdExpiresAt,
  confirmedAt: s.confirmedAt,
  cancelKind: s.cancelKind,
  refundState: s.refundState,
});

const reqRow = (r: { id: string; userId: string; weekKey: string; status: OutingRequestStatus; slotStartsAt: Date[]; teamId: string | null; missedWeeks: number; createdAt: Date }): RequestRow => ({ id: r.id, userId: r.userId, weekKey: r.weekKey, status: r.status, slotStartsAt: r.slotStartsAt, teamId: r.teamId, missedWeeks: r.missedWeeks, createdAt: r.createdAt });

export class PrismaOutingsRepository implements OutingsRepository {
  constructor(
    private readonly db: Db,
    private readonly tuning: Tuning,
  ) {}
  private c(scope: TxScope | null): Tx | Db {
    return scope ? txOf(scope) : this.db;
  }

  // ------------------------------------------------------------------ lecture
  async requester(scope: TxScope | null, userId: string, at: Date): Promise<RequesterFacts | null> {
    const c = this.c(scope);
    const u = await c.user.findUnique({
      where: { id: userId },
      include: {
        neighborhood: true,
        matchPreferences: { select: { lookingFor: true, meetingMode: true } },
        primaryPet: { select: { id: true } },
        acceptableNeighborhoods: { select: { neighborhoodId: true } },
        slotAvailability: { select: { slotTemplateId: true } },
        weeksOff: { select: { weekKey: true } },
        teamMemberships: { where: { leftAt: null }, select: { teamId: true } },
        reliabilityStat: true,
      },
    });
    if (!u) return null;
    const [verified, photo] = await Promise.all([verifiedSet(c, [userId], at), c.mediaAsset.count({ where: { ownerUserId: userId, purpose: 'PROFILE_PHOTO', status: 'READY' } })]);
    const nb = u.neighborhood;
    return {
      userId,
      onboarded: !!u.onboardedAt && !!u.primaryPet,
      intentionsSet: !!u.matchPreferences?.lookingFor && !!u.matchPreferences.meetingMode,
      verified: verified.has(userId),
      hasPhoto: photo > 0,
      neighborhood: nb ? { id: nb.id, name: nb.name, status: nb.status, timezone: nb.timezone, cityZoneId: nb.cityZoneId } : null,
      acceptableNeighborhoodIds: u.acceptableNeighborhoods.map((a) => a.neighborhoodId),
      availableSlotTemplateIds: u.slotAvailability.map((a) => a.slotTemplateId),
      weeksOff: u.weeksOff.map((w) => w.weekKey),
      activeTeamId: u.teamMemberships[0]?.teamId ?? null,
      reliability: u.reliabilityStat ? this.relOf(u.reliabilityStat) : null,
    };
  }

  private relOf(r: { attended: number; noShows: number; lateCancels: number; episodeAbsences: number; lastAbsenceAt: Date | null; pausedUntil: Date | null; pauseEpisode: number }): ReliabilityState {
    return { attended: r.attended, noShows: r.noShows, lateCancels: r.lateCancels, episodeAbsences: r.episodeAbsences, lastAbsenceAt: r.lastAbsenceAt, pausedUntil: r.pausedUntil, pauseEpisode: r.pauseEpisode };
  }

  async weekSlots(neighborhoodIds: string[], weekKey: string, timezone: string): Promise<WeekSlot[]> {
    const templates = await this.db.neighborhoodSlotTemplate.findMany({ where: { neighborhoodId: { in: neighborhoodIds }, active: true, neighborhood: { status: { in: ['LIVE', 'WAITLIST'] } } }, orderBy: [{ isoWeekday: 'asc' }, { localMinute: 'asc' }] });
    const monday = mondayOfWeek(weekKey);
    return templates
      .map((t) => ({ startsAt: new Date(wallToUtc(monday + t.isoWeekday - 1, t.localMinute, timezone)), isoWeekday: t.isoWeekday, localMinute: t.localMinute, neighborhoodId: t.neighborhoodId, templateId: t.id }))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  async request(scope: TxScope | null, userId: string, weekKey: string) {
    const r = await this.c(scope).outingRequest.findUnique({ where: { userId_weekKey: { userId, weekKey } } });
    return r ? reqRow(r) : null;
  }

  async seatOfWeek(scope: TxScope | null, userId: string, weekKey: string) {
    const c = this.c(scope);
    const s = (await c.outingSeat.findFirst({ where: { userId, weekKey, status: { in: ACTIVE } } })) ?? (await c.outingSeat.findFirst({ where: { userId, weekKey }, orderBy: { invitedAt: 'desc' } }));
    return s ? seatRow(s) : null;
  }

  async outingFacts(scope: TxScope | null, outingId: string, at: Date): Promise<OutingFacts | null> {
    const c = this.c(scope);
    const o = await c.outing.findUnique({ where: { id: outingId }, include: { neighborhood: true, venue: true, seats: { orderBy: { invitedAt: 'asc' } }, conversation: { select: { id: true } } } });
    if (!o) return null;
    const persons = await loadPersons(c, o.seats.map((s) => s.userId), at);
    return {
      id: o.id,
      status: o.status,
      weekKey: o.weekKey,
      neighborhoodName: o.neighborhood.name,
      timezone: o.neighborhood.timezone,
      startsAt: o.startsAt,
      endsAt: o.endsAt,
      capacity: o.capacity,
      activity: o.activity,
      acceptDeadline: o.acceptDeadline,
      lockAt: o.lockAt,
      photoRevealAt: o.photoRevealAt,
      checkinOpensAt: o.checkinOpensAt,
      checkinClosesAt: o.checkinClosesAt,
      votesCloseAt: o.votesCloseAt,
      votesClosedAt: o.votesClosedAt,
      cancelReason: o.cancelReason,
      venue: { id: o.venue.id, name: o.venue.name, address: `${o.venue.addressLine}, ${o.venue.postalCode} ${o.venue.city}`, offerLabel: offerLabel(o.venue.offerKey), photoUrl: o.venue.photoUrl, lat: o.venue.lat, lng: o.venue.lng },
      conversationId: o.conversation?.id ?? null,
      seats: o.seats.flatMap((s) => {
        const person = persons.get(s.userId);
        return person ? [{ seatId: s.id, userId: s.userId, status: s.status, teamId: s.teamId, funding: s.funding, holdExpiresAt: s.holdExpiresAt, acceptDeadline: s.acceptDeadline, confirmedAt: s.confirmedAt, cancelKind: s.cancelKind, refundState: s.refundState, person }] : [];
      }),
    };
  }

  async outing(scope: TxScope | null, outingId: string): Promise<OutingRow | null> {
    const o = await this.c(scope).outing.findUnique({ where: { id: outingId } });
    return o
      ? { id: o.id, status: o.status, neighborhoodId: o.neighborhoodId, venueId: o.venueId, weekKey: o.weekKey, startsAt: o.startsAt, capacity: o.capacity, acceptDeadline: o.acceptDeadline, lockAt: o.lockAt, photoRevealAt: o.photoRevealAt, checkinOpensAt: o.checkinOpensAt, checkinClosesAt: o.checkinClosesAt, votesCloseAt: o.votesCloseAt, votesClosedAt: o.votesClosedAt, ballotsPurgedAt: o.ballotsPurgedAt, activity: o.activity }
      : null;
  }

  async seat(scope: TxScope | null, outingId: string, userId: string) {
    const s = await this.c(scope).outingSeat.findUnique({ where: { outingId_userId: { outingId, userId } } });
    return s ? seatRow(s) : null;
  }

  async seats(scope: TxScope | null, outingId: string) {
    return (await this.c(scope).outingSeat.findMany({ where: { outingId }, orderBy: { id: 'asc' } })).map(seatRow);
  }

  async blockedAmong(userId: string, others: string[]) {
    if (others.length === 0) return new Set<string>();
    const rows = await this.db.block.findMany({ where: { OR: [{ blockerId: userId, blockedId: { in: others } }, { blockedId: userId, blockerId: { in: others } }] }, select: { blockerId: true, blockedId: true } });
    return new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)));
  }

  async linkedAmong(userId: string, others: string[]) {
    if (others.length === 0) return new Set<string>();
    const [f, d] = await Promise.all([
      this.db.friendship.findMany({ where: { status: 'ACTIVE', origin: { not: null }, OR: [{ userLowId: userId, userHighId: { in: others } }, { userHighId: userId, userLowId: { in: others } }] }, select: { userLowId: true, userHighId: true } }),
      this.db.duo.findMany({ where: { status: { notIn: ['EXPIRED', 'CLOSED', 'LEFT', 'EXCHANGE'] }, OR: [{ userLowId: userId, userHighId: { in: others } }, { userHighId: userId, userLowId: { in: others } }] }, select: { userLowId: true, userHighId: true } }),
    ]);
    return new Set([...f, ...d].map((r) => (r.userLowId === userId ? r.userHighId : r.userLowId)));
  }

  async usedFreeFirst(scope: TxScope, userId: string) {
    return (await txOf(scope).outingSeat.count({ where: { userId, funding: 'FREE_FIRST', refundState: { not: 'RECREDITED' } } })) > 0;
  }

  async history(userId: string, before: { startsAt: Date; id: string } | null, limit: number) {
    const rows = await this.db.outingSeat.findMany({
      where: { userId, status: { in: ['ATTENDED', 'NO_SHOW'] }, ...(before ? { outing: { OR: [{ startsAt: { lt: before.startsAt } }, { startsAt: before.startsAt, id: { lt: before.id } }] } } : {}) },
      include: { outing: { include: { venue: { select: { name: true } } } } },
      orderBy: [{ outing: { startsAt: 'desc' } }, { outingId: 'desc' }],
      take: limit,
    });
    const pets = await this.db.pet.findUnique({ where: { primaryOwnerId: userId }, select: { id: true } });
    const memories = pets ? await this.db.petMemory.findMany({ where: { petId: pets.id, kind: 'OUTING_LIVED', refId: { in: rows.map((r) => r.outingId) } }, select: { id: true, refId: true } }) : [];
    return rows.map((r) => ({ id: r.outingId, weekKey: r.outing.weekKey, startsAt: r.outing.startsAt, venueName: r.outing.venue.name, attended: r.status === 'ATTENDED', memoryId: memories.find((m) => m.refId === r.outingId)?.id ?? null }));
  }

  async reliability(scope: TxScope | null, userId: string) {
    const r = await this.c(scope).reliabilityStat.findUnique({ where: { userId } });
    return r ? this.relOf(r) : null;
  }

  async photoRevealAllowed(viewerId: string, ownerId: string, at: Date) {
    if (viewerId === ownerId) return true;
    const rows = await this.db.$queryRaw<{ n: bigint }[]>`
      SELECT count(*)::bigint AS n FROM "OutingSeat" a JOIN "OutingSeat" b ON b."outingId" = a."outingId" JOIN "Outing" o ON o.id = a."outingId"
      WHERE a."userId" = ${viewerId}::uuid AND b."userId" = ${ownerId}::uuid AND (
        (o.status IN ('CONFIRMED', 'CHECKIN_OPEN') AND o."photoRevealAt" <= ${at} AND a.status IN ('CONFIRMED', 'CHECKED_IN') AND b.status IN ('CONFIRMED', 'CHECKED_IN'))
        OR (o.status = 'DONE' AND o."votesCloseAt" > ${at} AND o."votesClosedAt" IS NULL AND a.status = 'ATTENDED' AND b.status = 'ATTENDED'))`;
    if (Number(rows[0]?.n ?? 0) > 0) return true;
    return (await this.linkedAmong(viewerId, [ownerId])).has(ownerId);
  }

  async outingRoomMember(userId: string, outingId: string, at: Date) {
    const s = await this.db.outingSeat.findUnique({ where: { outingId_userId: { outingId, userId } }, include: { outing: { select: { status: true, votesCloseAt: true } } } });
    if (!s || s.outing.status === 'CANCELLED') return false;
    if (s.status === 'CONFIRMED' || s.status === 'CHECKED_IN') return true;
    return s.status === 'ATTENDED' && s.outing.votesCloseAt > at;
  }

  async duoRoomMember(userId: string, duoId: string) {
    const d = await this.db.duo.findUnique({ where: { id: duoId }, select: { userLowId: true, userHighId: true, status: true } });
    return !!d && (d.userLowId === userId || d.userHighId === userId) && !['EXPIRED', 'CLOSED', 'LEFT'].includes(d.status);
  }

  // ------------------------------------------------------------------ demandes
  async upsertRequest(scope: TxScope, r: { id: string; userId: string; neighborhoodId: string; weekKey: string; slotStartsAt: Date[]; teamId: string | null; missedWeeks: number }) {
    const row = await txOf(scope).outingRequest.upsert({
      where: { userId_weekKey: { userId: r.userId, weekKey: r.weekKey } },
      create: { ...r, status: 'OPEN', createdAt: scope.now },
      update: { neighborhoodId: r.neighborhoodId, slotStartsAt: r.slotStartsAt, teamId: r.teamId, missedWeeks: r.missedWeeks, status: 'OPEN', unplacedReason: null },
    });
    return reqRow(row);
  }

  async setRequestStatus(scope: TxScope, id: string, status: OutingRequestStatus, unplacedReason: 'POOL_TOO_SMALL' | 'NO_COMPATIBLE_GROUP' | 'NO_SLOT_CAPACITY' | 'TEAM_INCOMPATIBLE' | null = null) {
    await txOf(scope).outingRequest.update({ where: { id }, data: { status, unplacedReason } });
  }

  async missedWeeksBefore(scope: TxScope, userId: string, weekKey: string) {
    const tx = txOf(scope);
    const prev = await tx.outingRequest.findFirst({ where: { userId, weekKey: { lt: weekKey } }, orderBy: { weekKey: 'desc' } });
    const prevSeatCancelled = await tx.outingSeat.findFirst({ where: { userId, weekKey: { lt: weekKey }, status: 'CANCELLED', cancelKind: 'SYSTEM_REMOVAL' }, orderBy: { weekKey: 'desc' } });
    if (prev?.status === 'UNPLACED') return prev.missedWeeks + 1;
    if (prevSeatCancelled && (!prev || prevSeatCancelled.weekKey >= prev.weekKey)) return (prev?.missedWeeks ?? 0) + 1;
    return 0;
  }

  // ------------------------------------------------------------------ composition
  async liveScopes(): Promise<CompositionScope[]> {
    // V5.2 (A.1) : toute ville compose (quartiers ouverts ou en liste d'attente) dès 5 personnes compatibles.
    const rows = await this.db.neighborhood.findMany({ where: { status: { in: ['LIVE', 'WAITLIST'] } }, select: { id: true, cityZoneId: true, timezone: true }, orderBy: { id: 'asc' } });
    const byZone = new Map<string, CompositionScope>();
    for (const n of rows) {
      const s = byZone.get(n.cityZoneId) ?? { zoneId: n.cityZoneId, timezone: n.timezone, neighborhoodIds: [] };
      s.neighborhoodIds.push(n.id);
      byZone.set(n.cityZoneId, s);
    }
    return [...byZone.values()];
  }

  async seedingScopes(): Promise<CompositionScope[]> {
    const teams = await this.db.team.findMany({ where: { status: 'ACTIVE' }, select: { cityZoneId: true }, distinct: ['cityZoneId'] });
    const out: CompositionScope[] = [];
    for (const t of teams) {
      const nbs = await this.db.neighborhood.findMany({ where: { cityZoneId: t.cityZoneId }, select: { id: true, status: true, timezone: true } });
      if (nbs.length === 0 || nbs.some((n) => n.status === 'LIVE')) continue;
      const open = nbs.filter((n) => n.status !== 'CLOSED');
      if (open.length) out.push({ zoneId: t.cityZoneId, timezone: open[0]!.timezone, neighborhoodIds: open.map((n) => n.id) });
    }
    return out;
  }

  async runExists(scopeKey: string, weekKey: string, kind: 'WEEKLY' | 'SEEDING') {
    return (await this.db.compositionRun.count({ where: { scopeKey, weekKey, kind } })) > 0;
  }

  async ensureVenueSlots(neighborhoodIds: string[], weekKey: string, timezone: string) {
    const templates = await this.db.neighborhoodSlotTemplate.findMany({ where: { neighborhoodId: { in: neighborhoodIds }, active: true } });
    const venues = await this.db.venue.findMany({ where: { neighborhoodId: { in: neighborhoodIds }, status: 'ACTIVE' } });
    const monday = mondayOfWeek(weekKey);
    const data = templates.flatMap((t) =>
      venues
        .filter((v) => v.neighborhoodId === t.neighborhoodId && v.activities.includes(t.activity))
        .map((v) => ({ id: uuidv7(), venueId: v.id, startsAt: new Date(wallToUtc(monday + t.isoWeekday - 1, t.localMinute, timezone)), activity: t.activity, capacityOutings: v.tablesPerSlot })),
    );
    if (data.length === 0) return 0;
    return (await this.db.venueSlot.createMany({ data, skipDuplicates: true })).count;
  }

  async slotOffers(neighborhoodIds: string[], from: Date, to: Date): Promise<SlotOffer[]> {
    const rows = await this.db.venueSlot.findMany({ where: { startsAt: { gt: from, lt: to }, venue: { neighborhoodId: { in: neighborhoodIds }, status: 'ACTIVE' } }, include: { venue: { select: { neighborhoodId: true } } }, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }] });
    return rows.filter((r) => r.reservedOutings < r.capacityOutings).map((r) => ({ venueSlotId: r.id, venueId: r.venueId, neighborhoodId: r.venue.neighborhoodId, activity: r.activity, startsAtMs: r.startsAt.getTime(), remainingOutings: r.capacityOutings - r.reservedOutings }));
  }

  /** Restriction conservatoire (B4) : personne visée par un dossier « mineur » non résolu. */
  private async restricted(userIds: string[]) {
    const rows = await this.db.moderationCase.findMany({ where: { subjectUserId: { in: userIds }, restricted: true, reasonCode: 'REPORT_MINOR', status: { not: 'RESOLVED' } }, select: { subjectUserId: true } });
    return new Set(rows.map((r) => r.subjectUserId));
  }

  private async activeSeatUsers(userIds: string[], weekKeys: string[]) {
    const rows = await this.db.outingSeat.findMany({ where: { userId: { in: userIds }, weekKey: { in: weekKeys }, status: { in: ACTIVE } }, select: { userId: true } });
    return new Set(rows.map((r) => r.userId));
  }

  async weeklyCandidates(scope: CompositionScope, weekKey: string, at: Date) {
    const requests = await this.db.outingRequest.findMany({ where: { neighborhoodId: { in: scope.neighborhoodIds }, weekKey, status: 'OPEN' }, orderBy: { id: 'asc' } });
    const ids = requests.map((r) => r.userId);
    const users = await this.db.user.findMany({ where: { id: { in: ids }, status: 'ACTIVE', onboardedAt: { not: null } }, include: CANDIDATE_INCLUDE });
    const [verified, restricted, busy] = await Promise.all([verifiedSet(this.db, ids, at), this.restricted(ids), this.activeSeatUsers(ids, [weekKey])]);
    const candidates: OutingCandidate[] = [];
    const meta: CandidateMeta[] = [];
    for (const r of requests) {
      const u = users.find((x) => x.id === r.userId);
      if (!u || restricted.has(u.id) || busy.has(u.id) || (u.reliabilityStat?.pausedUntil && u.reliabilityStat.pausedUntil > at)) continue;
      const c = toCandidate(u, { at, verified: verified.has(u.id), slotStartsAtMs: r.slotStartsAt.map((d) => d.getTime()), homeNeighborhoodId: r.neighborhoodId, missedWeeks: r.missedWeeks, requestedAt: r.createdAt, tuning: this.tuning });
      if (!c) continue;
      candidates.push(c);
      meta.push({ userId: u.id, requestId: r.id, teamId: c.teamId });
    }
    return { candidates, meta };
  }

  async seedingCandidates(scope: CompositionScope, offers: SlotOffer[], at: Date) {
    const members = await this.db.teamMember.findMany({ where: { leftAt: null, team: { cityZoneId: scope.zoneId, status: 'ACTIVE' } }, select: { userId: true, teamId: true }, orderBy: { userId: 'asc' } });
    const ids = members.map((m) => m.userId);
    const users = await this.db.user.findMany({ where: { id: { in: ids }, status: 'ACTIVE', onboardedAt: { not: null } }, include: CANDIDATE_INCLUDE });
    const weekKeys = [...new Set(offers.map((o) => (o as SlotOffer & { weekKey?: string }).weekKey).filter((w): w is string => !!w))];
    const [verified, restricted] = await Promise.all([verifiedSet(this.db, ids, at), this.restricted(ids)]);
    const busy = new Set((await this.db.outingSeat.findMany({ where: { userId: { in: ids }, status: { in: ['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN'] } }, select: { userId: true } })).map((s) => s.userId));
    void weekKeys;
    const candidates: OutingCandidate[] = [];
    const meta: CandidateMeta[] = [];
    for (const u of users) {
      if (!verified.has(u.id) || restricted.has(u.id) || busy.has(u.id) || (u.reliabilityStat?.pausedUntil && u.reliabilityStat.pausedUntil > at)) continue;
      const c = toCandidate(u, { at, verified: true, slotStartsAtMs: offers.map((o) => o.startsAtMs), homeNeighborhoodId: u.neighborhoodId, missedWeeks: 0, requestedAt: u.createdAt, tuning: this.tuning });
      if (!c) continue;
      // Ville fermée : tous les lieux de la ville sont acceptables.
      candidates.push({ ...c, neighborhoodIds: scope.neighborhoodIds });
      meta.push({ userId: u.id, requestId: null, teamId: c.teamId });
    }
    return { candidates, meta };
  }

  compositionFacts(userIds: string[]) {
    return compositionFacts(this.db, userIds);
  }

  async createRun(scope: TxScope, r: { id: string; scopeKey: string; weekKey: string; kind: 'WEEKLY' | 'SEEDING'; algoVersion: string; tuningVersion: string; seed: string }) {
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "CompositionRun" (id, "scopeKey", "weekKey", kind, status, "algoVersion", "tuningVersion", seed, "startedAt")
      VALUES (${r.id}::uuid, ${r.scopeKey}, ${r.weekKey}, ${r.kind}::"CompositionRunKind", 'RUNNING', ${r.algoVersion}, ${r.tuningVersion}, ${r.seed}, ${scope.now})
      ON CONFLICT ("scopeKey", "weekKey", kind) DO NOTHING`;
    return n === 1;
  }

  async finishRun(scope: TxScope, id: string, stats: Record<string, unknown>) {
    await txOf(scope).compositionRun.update({ where: { id }, data: { status: 'SUCCEEDED', stats: stats as object, finishedAt: scope.now } });
  }

  async reserveVenueSlot(scope: TxScope, venueSlotId: string) {
    const n = await txOf(scope).$executeRaw`UPDATE "VenueSlot" SET "reservedOutings" = "reservedOutings" + 1 WHERE id = ${venueSlotId}::uuid AND "reservedOutings" < "capacityOutings"`;
    return n === 1;
  }

  async releaseVenueSlot(scope: TxScope, outingId: string) {
    await txOf(scope).$executeRaw`UPDATE "VenueSlot" SET "reservedOutings" = "reservedOutings" - 1 WHERE id = (SELECT "venueSlotId" FROM "Outing" WHERE id = ${outingId}::uuid) AND "reservedOutings" > 0`;
  }

  async createOuting(scope: TxScope, o: NewOuting) {
    await txOf(scope).outing.create({ data: { ...o, status: 'PROPOSED', createdAt: scope.now } });
  }

  async createSeat(scope: TxScope, s: { id: string; outingId: string; userId: string; weekKey: string; teamId: string | null; acceptDeadline: Date }) {
    const tx = txOf(scope);
    try {
      await tx.$executeRaw`SAVEPOINT seat_create`;
      await tx.outingSeat.create({ data: { ...s, status: 'INVITED', invitedAt: scope.now } });
      await tx.$executeRaw`RELEASE SAVEPOINT seat_create`;
      return true;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      await tx.$executeRaw`ROLLBACK TO SAVEPOINT seat_create`;
      return false;
    }
  }

  // ------------------------------------------------------------------ places et sortie
  async updateSeat(scope: TxScope, seatId: string, data: Parameters<OutingsRepository['updateSeat']>[2]) {
    await txOf(scope).outingSeat.update({ where: { id: seatId }, data: { ...data, version: { increment: 1 } } });
  }

  async setOutingStatus(scope: TxScope, outingId: string, status: OutingStatus, extra: { cancelReason?: 'UNDERSIZED' | 'VENUE_UNAVAILABLE' | 'STAFF' | 'NEIGHBORHOOD_CLOSED' | 'SAFETY'; votesClosedAt?: Date; ballotsPurgedAt?: Date } = {}) {
    await txOf(scope).outing.update({ where: { id: outingId }, data: { status, ...extra, ...(status === 'CANCELLED' ? { cancelledAt: scope.now } : {}), version: { increment: 1 } } });
  }

  async dueOutings(at: Date, limit: number) {
    const rows = await this.db.outing.findMany({
      where: {
        OR: [
          { status: { in: ['PROPOSED', 'FORMING'] }, lockAt: { lte: at } },
          { status: 'CONFIRMED', checkinOpensAt: { lte: at } },
          { status: 'CHECKIN_OPEN', checkinClosesAt: { lte: at } },
          { status: 'DONE', votesClosedAt: null, votesCloseAt: { lte: at } },
        ],
      },
      select: { id: true },
      orderBy: { startsAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => r.id);
  }

  async expiredInvitations(at: Date, limit: number) {
    const rows = await this.db.outingSeat.findMany({ where: { status: { in: ['INVITED', 'HELD'] }, acceptDeadline: { lte: at }, outing: { status: { in: ['PROPOSED', 'FORMING'] }, lockAt: { gt: at } } }, select: { id: true, outingId: true, userId: true }, take: limit });
    return rows.map((r) => ({ outingId: r.outingId, seatId: r.id, userId: r.userId }));
  }

  async outingsWithFreePlaces(at: Date, limit: number) {
    const rows = await this.db.$queryRaw<{ id: string }[]>`
      SELECT o.id FROM "Outing" o
      WHERE o.status IN ('PROPOSED', 'FORMING') AND o."lockAt" > ${at}
        AND (SELECT count(*) FROM "OutingSeat" s WHERE s."outingId" = o.id AND s.status IN ('INVITED','HELD','CONFIRMED','CHECKED_IN','ATTENDED','NO_SHOW')) < o.capacity
      ORDER BY o."startsAt" LIMIT ${limit}`;
    return rows.map((r) => r.id);
  }

  async backfillPool(outingId: string, at: Date) {
    const o = await this.db.outing.findUnique({ where: { id: outingId }, include: { seats: true } });
    if (!o) return null;
    const memberIds = o.seats.filter((s) => ['INVITED', 'HELD', 'CONFIRMED'].includes(s.status)).map((s) => s.userId);
    const excluded = o.seats.map((s) => s.userId);
    const requests = await this.db.outingRequest.findMany({ where: { weekKey: o.weekKey, status: 'UNPLACED', userId: { notIn: excluded }, slotStartsAt: { has: o.startsAt } }, orderBy: { id: 'asc' } });
    const ids = [...memberIds, ...requests.map((r) => r.userId)];
    const users = await this.db.user.findMany({ where: { id: { in: ids }, status: 'ACTIVE' }, include: CANDIDATE_INCLUDE });
    const [verified, busy, restricted] = await Promise.all([verifiedSet(this.db, ids, at), this.activeSeatUsers(requests.map((r) => r.userId), [o.weekKey]), this.restricted(ids)]);
    const build = (userId: string, slotMs: number[], home: string | null, missed: number, requestedAt: Date) => {
      const u = users.find((x) => x.id === userId);
      return u ? toCandidate(u, { at, verified: verified.has(userId), slotStartsAtMs: slotMs, homeNeighborhoodId: home, missedWeeks: missed, requestedAt, tuning: this.tuning }) : null;
    };
    const members = memberIds.map((id) => build(id, [o.startsAt.getTime()], o.neighborhoodId, 0, o.createdAt)).filter((c): c is OutingCandidate => !!c).map((c) => ({ ...c, neighborhoodIds: [...new Set([...c.neighborhoodIds, o.neighborhoodId])] }));
    const meta: CandidateMeta[] = [];
    const pool: OutingCandidate[] = [];
    for (const r of requests) {
      if (busy.has(r.userId) || restricted.has(r.userId)) continue;
      const c = build(r.userId, r.slotStartsAt.map((d) => d.getTime()), r.neighborhoodId, r.missedWeeks, r.createdAt);
      if (!c || c.teamId) continue; // backfill : unités de taille 1 seulement (§4.6)
      pool.push(c);
      meta.push({ userId: r.userId, requestId: r.id, teamId: null });
    }
    return { members, pool, meta, slot: { startsAtMs: o.startsAt.getTime(), neighborhoodId: o.neighborhoodId, activity: o.activity } };
  }

  // ------------------------------------------------------------------ check-in
  async venueSecretRef(outingId: string) {
    const o = await this.db.outing.findUnique({ where: { id: outingId }, select: { venue: { select: { checkinSecretRef: true, lat: true, lng: true } } } });
    return o ? { ref: o.venue.checkinSecretRef, lat: o.venue.lat, lng: o.venue.lng } : null;
  }

  async checkInAttempts(scope: TxScope, seatId: string, method: 'GEO' | 'VENUE_CODE') {
    return txOf(scope).outingCheckInAttempt.count({ where: { seatId, method } });
  }

  async recordCheckInAttempt(scope: TxScope, a: Parameters<OutingsRepository['recordCheckInAttempt']>[1]) {
    await txOf(scope).outingCheckInAttempt.create({ data: { ...a, createdAt: scope.now } });
  }

  async recordCheckIn(scope: TxScope, seatId: string, method: 'GEO' | 'VENUE_CODE' | 'STAFF') {
    const n = await txOf(scope).$executeRaw`INSERT INTO "OutingCheckIn" ("seatId", method, "createdAt") VALUES (${seatId}::uuid, ${method}::"CheckInMethod", ${scope.now}) ON CONFLICT DO NOTHING`;
    return n === 1;
  }

  // ------------------------------------------------------------------ votes
  attendees(scope: TxScope | null, outingId: string, at: Date): Promise<Attendee[]> {
    return this.seeksOf(scope, outingId, ['ATTENDED'], at);
  }

  seeksOfActiveSeats(outingId: string, at: Date): Promise<Attendee[]> {
    return this.seeksOf(null, outingId, ['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN', 'ATTENDED'], at);
  }

  async knowsSomeoneSince(scope: TxScope, userId: string, since: Date) {
    return txOf(scope).knowsSomeoneRequest.count({ where: { userId, createdAt: { gt: since } } });
  }

  async createKnowsSomeone(scope: TxScope, r: { id: string; seatId: string; userId: string; targetUserId: string; status: 'AUTO_ACCEPTED' | 'IN_REVIEW' | 'COUNTED_AS_CANCEL' }) {
    await txOf(scope).knowsSomeoneRequest.create({ data: { ...r, createdAt: scope.now, ...(r.status === 'IN_REVIEW' ? {} : { resolvedAt: scope.now }) } });
  }

  async knownRelation(a: string, b: string) {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const [f, d, bl] = await Promise.all([
      this.db.friendship.count({ where: { userLowId: lo, userHighId: hi } }),
      this.db.duo.count({ where: { userLowId: lo, userHighId: hi } }),
      this.db.block.count({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } }),
    ]);
    return f + d + bl > 0;
  }

  private async seeksOf(scope: TxScope | null, outingId: string, statuses: ('INVITED' | 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'ATTENDED')[], at: Date): Promise<Attendee[]> {
    const seats = await this.c(scope).outingSeat.findMany({ where: { outingId, status: { in: statuses } }, include: { user: { include: { profile: { select: { gender: true } }, matchPreferences: true, outingPreferences: true } } }, orderBy: { userId: 'asc' } });
    return seats.map((s) => {
      const p = s.user.matchPreferences;
      const age = ageOf(s.user.birthDate, s.user.timezone, at);
      const seeks = seeksOf(p?.lookingFor ?? 'FRIENDS');
      return {
        userId: s.userId,
        teamId: s.teamId,
        seeks: {
          gender: (s.user.profile?.gender ?? 'UNDISCLOSED') as Gender,
          seeks,
          meetGenders: (p?.meetGenders ?? []) as Gender[],
          romanceGenders: seeks.romance ? ((p?.romanceGenders ?? []) as Gender[]) : [],
          age,
          ...(s.user.outingPreferences ? { groupAge: { min: s.user.outingPreferences.groupAgeMin, max: s.user.outingPreferences.groupAgeMax } } : {}),
        },
      };
    });
  }

  async myBallots(scope: TxScope | null, outingId: string, voterId: string) {
    const rows = await this.c(scope).outingVote.findMany({ where: { outingId, voterUserId: voterId }, select: { targetUserId: true, choice: true } });
    return new Map(rows.map((r) => [r.targetUserId, r.choice as VoteChoice]));
  }

  async saveBallots(scope: TxScope, outingId: string, voterId: string, choices: Map<string, VoteChoice>) {
    const tx = txOf(scope);
    for (const [target, choice] of choices) {
      await tx.outingVote.upsert({
        where: { outingId_voterUserId_targetUserId: { outingId, voterUserId: voterId, targetUserId: target } },
        create: { outingId, voterUserId: voterId, targetUserId: target, choice, createdAt: scope.now, updatedAt: scope.now },
        update: { choice, updatedAt: scope.now },
      });
    }
  }

  async allBallots(scope: TxScope, outingId: string) {
    const rows = await txOf(scope).outingVote.findMany({ where: { outingId }, select: { voterUserId: true, targetUserId: true, choice: true } });
    return new Map(rows.map((r) => [`${r.voterUserId}>${r.targetUserId}`, r.choice as VoteChoice]));
  }

  async purgeBallots(scope: TxScope, outingId: string) {
    return (await txOf(scope).outingVote.deleteMany({ where: { outingId } })).count;
  }

  async myReveals(outingId: string, userId: string) {
    const rows = await this.db.connectionReveal.findMany({ where: { sourceKind: 'OUTING', sourceId: outingId, OR: [{ userLowId: userId }, { userHighId: userId }] } });
    return new Map(rows.map((r) => [r.userLowId === userId ? r.userHighId : r.userLowId, r.result as ConnectionKind]));
  }

  async createReveal(scope: TxScope, r: { id: string; outingId: string; low: string; high: string; kind: ConnectionKind; friendshipId: string | null; duoId: string | null }) {
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "ConnectionReveal" (id, "sourceKind", "sourceId", "userLowId", "userHighId", result, "revealedAt", "friendshipId", "duoId")
      VALUES (${r.id}::uuid, 'OUTING', ${r.outingId}::uuid, ${r.low}::uuid, ${r.high}::uuid, ${r.kind}::"ConnectionKind", ${scope.now}, ${r.friendshipId}::uuid, ${r.duoId}::uuid)
      ON CONFLICT DO NOTHING`;
    return n === 1;
  }

  async ensureBandLink(scope: TxScope, l: { id: string; low: string; high: string; origin: 'OUTING_VOTE' | 'PLUS_ONE'; outingId: string; invitedById: string }) {
    const tx = txOf(scope);
    const existing = await tx.friendship.findUnique({ where: { userLowId_userHighId: { userLowId: l.low, userHighId: l.high } } });
    if (existing) {
      if (existing.status === 'ACTIVE') return { id: existing.id, created: false };
      await tx.friendship.update({ where: { id: existing.id }, data: { status: 'ACTIVE', origin: l.origin, sourceOutingId: l.outingId, acceptedAt: scope.now, endedAt: null, endedReason: null } });
      return { id: existing.id, created: true };
    }
    await tx.friendship.create({ data: { id: l.id, userLowId: l.low, userHighId: l.high, status: 'ACTIVE', invitedById: l.invitedById, createdAt: scope.now, acceptedAt: scope.now, origin: l.origin, sourceOutingId: l.outingId } });
    return { id: l.id, created: true };
  }

  async createDuo(scope: TxScope, d: { id: string; low: string; high: string; outingId: string }) {
    const tx = txOf(scope);
    const live = await tx.duo.findFirst({ where: { userLowId: d.low, userHighId: d.high, status: { notIn: ['EXPIRED', 'CLOSED', 'LEFT'] } } });
    if (live) return { id: live.id, created: false };
    // Accord « plus » issu d'une sortie : démarre UNLOCKED, sans horloge 48 h / J+7 (D-017).
    await tx.duo.create({ data: { id: d.id, userLowId: d.low, userHighId: d.high, origin: 'OUTING_VOTE', status: 'UNLOCKED', sourceOutingId: d.outingId, createdAt: scope.now } });
    return { id: d.id, created: true };
  }

  async outingsToClose(at: Date, limit: number) {
    return (await this.db.outing.findMany({ where: { status: 'DONE', votesClosedAt: null, votesCloseAt: { lte: at } }, select: { id: true }, take: limit })).map((r) => r.id);
  }

  async outingsToPurge(at: Date, retentionDays: number, limit: number) {
    return (await this.db.outing.findMany({ where: { status: 'DONE', ballotsPurgedAt: null, votesClosedAt: { lte: new Date(at.getTime() - retentionDays * DAY) } }, select: { id: true }, take: limit })).map((r) => r.id);
  }

  async chatsToRevoke(at: Date, readOnlyDays: number, limit: number) {
    const rows = await this.db.outing.findMany({
      where: { status: 'DONE', votesCloseAt: { lte: new Date(at.getTime() - readOnlyDays * DAY) }, conversation: { members: { some: { revokedAt: null } } } },
      select: { id: true, conversation: { select: { members: { where: { revokedAt: null }, select: { userId: true } } } } },
      take: limit,
    });
    return rows.map((r) => ({ outingId: r.id, members: r.conversation?.members.map((m) => m.userId) ?? [] }));
  }

  async chatsToPurge(at: Date, purgeDays: number, limit: number) {
    const rows = await this.db.outing.findMany({
      where: { OR: [{ status: 'DONE', votesCloseAt: { lte: new Date(at.getTime() - purgeDays * DAY) } }, { status: 'CANCELLED', cancelledAt: { lte: new Date(at.getTime() - purgeDays * DAY) } }], conversation: { messages: { some: { content: { purgedAt: null } } } } },
      select: { id: true },
      take: limit,
    });
    return rows.map((r) => r.id);
  }

  // ------------------------------------------------------------------ fiabilité
  async saveReliability(scope: TxScope, userId: string, s: ReliabilityState) {
    await txOf(scope).reliabilityStat.upsert({ where: { userId }, create: { userId, ...s, updatedAt: scope.now }, update: { ...s, updatedAt: scope.now } });
  }

  async reliabilityEvent(scope: TxScope, e: { userId: string; reason: 'OUTING_ATTENDED' | 'OUTING_NO_SHOW' | 'OUTING_LATE_CANCEL' | 'RELIABILITY_PAUSE'; episodeKey: string }) {
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "ReliabilityEvent" (id, "userId", reason, delta, "episodeKey", "createdAt")
      VALUES (${uuidv7(scope.now.getTime())}::uuid, ${e.userId}::uuid, ${e.reason}::"ReliabilityReason", 0, ${e.episodeKey}, ${scope.now})
      ON CONFLICT ("userId", reason, "episodeKey") DO NOTHING`;
    return n === 1;
  }

  async createDispute(scope: TxScope, d: { id: string; seatId: string; userId: string; note: string }) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "AttendanceDispute" (id, "seatId", "userId", note, status, "createdAt") VALUES (${d.id}::uuid, ${d.seatId}::uuid, ${d.userId}::uuid, ${d.note}, 'OPEN', ${scope.now}) ON CONFLICT ("seatId") DO NOTHING`;
    return n === 1;
  }

  // ------------------------------------------------------------------ teams
  private async teamRow(c: Tx | Db, where: { id?: string; inviteCode?: string }, at: Date): Promise<TeamRow | null> {
    const t = await c.team.findFirst({ where, include: { members: { where: { leftAt: null }, orderBy: { joinedAt: 'asc' }, include: { user: { include: PERSON_INCLUDE } } } } });
    if (!t) return null;
    const verified = await verifiedSet(c, t.members.map((m) => m.userId), at);
    return { id: t.id, cityZoneId: t.cityZoneId, status: t.status, inviteCode: t.inviteCode, createdAt: t.createdAt, members: t.members.map((m) => ({ userId: m.userId, firstName: personOf(m.user, at).firstName, pet: petCardOf(m.user.primaryPet), verified: verified.has(m.userId) })) };
  }

  async teamOf(scope: TxScope | null, userId: string) {
    const m = await this.c(scope).teamMember.findFirst({ where: { userId, leftAt: null }, select: { teamId: true } });
    return m ? this.teamRow(this.c(scope), { id: m.teamId }, scope?.now ?? new Date(0)) : null;
  }
  teamByCode(scope: TxScope | null, code: string) {
    return this.teamRow(this.c(scope), { inviteCode: code }, scope?.now ?? new Date(0));
  }
  teamById(scope: TxScope | null, id: string) {
    return this.teamRow(this.c(scope), { id }, scope?.now ?? new Date(0));
  }

  async createTeam(scope: TxScope, t: { id: string; cityZoneId: string; createdById: string; inviteCode: string }) {
    await txOf(scope).team.create({ data: { ...t, status: 'FORMING', createdAt: scope.now } });
  }

  async addTeamMember(scope: TxScope, teamId: string, userId: string) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "TeamMember" (id, "teamId", "userId", "joinedAt") VALUES (${uuidv7(scope.now.getTime())}::uuid, ${teamId}::uuid, ${userId}::uuid, ${scope.now}) ON CONFLICT DO NOTHING`;
    return n === 1;
  }

  async leaveTeam(scope: TxScope, teamId: string, userId: string) {
    await txOf(scope).teamMember.updateMany({ where: { teamId, userId, leftAt: null }, data: { leftAt: scope.now } });
  }

  async setTeamStatus(scope: TxScope, teamId: string, status: 'FORMING' | 'ACTIVE' | 'DISSOLVED') {
    await txOf(scope).team.update({ where: { id: teamId }, data: { status, ...(status === 'DISSOLVED' ? { dissolvedAt: scope.now } : {}), version: { increment: 1 } } });
  }

  async teamHasActiveSeat(scope: TxScope, teamId: string, at: Date) {
    return (await txOf(scope).outingSeat.count({ where: { teamId, status: { in: ['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN'] }, outing: { startsAt: { gt: at } } } })) > 0;
  }

  async cityClosed(zoneId: string) {
    return (await this.db.neighborhood.count({ where: { cityZoneId: zoneId, status: 'LIVE' } })) === 0;
  }

  // ------------------------------------------------------------------ bande
  async band(userId: string, at: Date): Promise<BandLinkRow[]> {
    const rows = await this.db.friendship.findMany({ where: { status: 'ACTIVE', origin: { not: null }, OR: [{ userLowId: userId }, { userHighId: userId }] }, include: { conversation: { select: { id: true } } }, orderBy: [{ acceptedAt: 'desc' }, { id: 'desc' }] });
    const others = rows.map((r) => (r.userLowId === userId ? r.userHighId : r.userLowId));
    const persons = await loadPersons(this.db, others, at);
    return rows.flatMap((r) => {
      const other = r.userLowId === userId ? r.userHighId : r.userLowId;
      const person = persons.get(other);
      return person ? [{ linkId: r.id, otherUserId: other, origin: r.origin!, since: r.acceptedAt ?? r.createdAt, conversationId: r.conversation?.id ?? null, person }] : [];
    });
  }
}
