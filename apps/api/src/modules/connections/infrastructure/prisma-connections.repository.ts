/**
 * Adapter Prisma du module `connections`. Écrit ses tables (`Duo`, `DuoDate`, `DuoVote`,
 * `DuoDateCheckInAttempt`, `DuoLanePass`, `Friendship` V5 pour « partir proprement » et les liens
 * `DUO_VOTE`, `ConnectionReveal` source `DUO_DATE`, branche DUO_LANE de `MatchProposal`/`MatchBatch`).
 * Lectures seules : messages publiés d'un chat DUO (compteurs de l'échange), souvenirs du pet,
 * préférences (moteur seulement).
 */
import { pairKey, seeksOf, type ConnectionKind, type Gender, type VoteChoice } from '@blowy/domain';
import { uuidv7, type Db, type Tx } from '@blowy/database';
import { defaultGroupAge } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { CANDIDATE_INCLUDE, compositionFacts, toCandidate, verifiedSet } from '../../outings/infrastructure/candidates.js';
import { ageOf, loadPersons } from '../../outings/infrastructure/person-facts.js';
import type { BandLinkRow, ConnectionsRepository, DuoDateRow, DuoRow, LaneProposalRow, MemoryRow, SeeksFacts, VenueRow } from '../application/ports/connections.repository.js';

const LIVE: ('EXCHANGE' | 'UNLOCKED' | 'DATE_PROPOSED' | 'DATE_CONFIRMED' | 'AFTER_VOTE' | 'TOGETHER')[] = ['EXCHANGE', 'UNLOCKED', 'DATE_PROPOSED', 'DATE_CONFIRMED', 'AFTER_VOTE', 'TOGETHER'];
const VISIBLE_MESSAGE = ['PUBLISHED', 'WARNED'] as const;

type DuoRecord = { id: string; userLowId: string; userHighId: string; origin: DuoRow['origin']; status: DuoRow['status']; exchangeEndsAt: Date | null; dateDeadline: Date | null; messagesLow: number; messagesHigh: number; datesAttended: number; together: boolean; eggOptInLow: boolean; eggOptInHigh: boolean; endedAt: Date | null; proposalId: string | null; createdAt: Date; conversation?: { id: string } | null };
const duoRow = (d: DuoRecord): DuoRow => ({
  id: d.id,
  userLowId: d.userLowId,
  userHighId: d.userHighId,
  origin: d.origin,
  status: d.status,
  exchangeEndsAt: d.exchangeEndsAt,
  dateDeadline: d.dateDeadline,
  messagesLow: d.messagesLow,
  messagesHigh: d.messagesHigh,
  datesAttended: d.datesAttended,
  together: d.together,
  eggOptInLow: d.eggOptInLow,
  eggOptInHigh: d.eggOptInHigh,
  endedAt: d.endedAt,
  proposalId: d.proposalId,
  createdAt: d.createdAt,
  conversationId: d.conversation?.id ?? null,
});

type DateRecord = DuoDateRow & Record<string, unknown>;
const dateRow = (d: DateRecord): DuoDateRow => ({
  id: d.id,
  duoId: d.duoId,
  proposedByUserId: d.proposedByUserId,
  venueId: d.venueId,
  startsAt: d.startsAt,
  endsAt: d.endsAt,
  status: d.status,
  checkinLowAt: d.checkinLowAt,
  checkinHighAt: d.checkinHighAt,
  votesCloseAt: d.votesCloseAt,
  votesClosedAt: d.votesClosedAt,
  cancelledByUserId: d.cancelledByUserId,
  lateCancel: d.lateCancel,
});

type VenueRecord = { id: string; name: string; addressLine: string; postalCode: string; city: string; neighborhoodId: string; lat: number; lng: number; checkinSecretRef: string; neighborhood: { timezone: string } };
const venueRow = (v: VenueRecord): VenueRow => ({ id: v.id, name: v.name, address: `${v.addressLine}, ${v.postalCode} ${v.city}`, neighborhoodId: v.neighborhoodId, timezone: v.neighborhood.timezone, lat: v.lat, lng: v.lng, secretRef: v.checkinSecretRef });

export class PrismaConnectionsRepository implements ConnectionsRepository {
  constructor(
    private readonly db: Db,
    private readonly tuning: Tuning,
  ) {}

  private c(scope: TxScope | null): Tx | Db {
    return scope ? txOf(scope) : this.db;
  }

  // ------------------------------------------------------------------ duos
  async duo(scope: TxScope | null, duoId: string) {
    const d = await this.c(scope).duo.findUnique({ where: { id: duoId }, include: { conversation: { select: { id: true } } } });
    return d ? duoRow(d) : null;
  }

  async duosOf(userId: string, readOnlySince: Date) {
    const rows = await this.db.duo.findMany({
      where: { OR: [{ userLowId: userId }, { userHighId: userId }], AND: [{ OR: [{ status: { in: LIVE } }, { status: 'EXPIRED', endedAt: { gt: readOnlySince } }] }] },
      include: { conversation: { select: { id: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(duoRow);
  }

  async activeDuoCount(scope: TxScope | null, userId: string) {
    return this.c(scope).duo.count({ where: { status: { in: LIVE }, OR: [{ userLowId: userId }, { userHighId: userId }] } });
  }

  async activeLaneDuoCount(scope: TxScope | null, userId: string) {
    return this.c(scope).duo.count({ where: { origin: 'LANE', status: { in: LIVE }, OR: [{ userLowId: userId }, { userHighId: userId }] } });
  }

  async createDuo(scope: TxScope, d: { id: string; low: string; high: string; origin: DuoRow['origin']; status: DuoRow['status']; exchangeEndsAt: Date | null; dateDeadline: Date | null; proposalId: string | null }) {
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "Duo" (id, "userLowId", "userHighId", origin, status, "exchangeEndsAt", "dateDeadline", "proposalId", "createdAt", "updatedAt")
      VALUES (${d.id}::uuid, ${d.low}::uuid, ${d.high}::uuid, ${d.origin}::"DuoOrigin", ${d.status}::"DuoStatus", ${d.exchangeEndsAt}, ${d.dateDeadline}, ${d.proposalId}::uuid, ${scope.now}, ${scope.now})
      ON CONFLICT DO NOTHING`;
    return n === 1;
  }

  async updateDuo(scope: TxScope, duoId: string, patch: Partial<Pick<DuoRow, 'status' | 'messagesLow' | 'messagesHigh' | 'datesAttended' | 'together' | 'eggOptInLow' | 'eggOptInHigh' | 'endedAt'>>) {
    await txOf(scope).duo.update({ where: { id: duoId }, data: { ...patch, version: { increment: 1 } } });
  }

  async conversationOfDuo(scope: TxScope | null, duoId: string) {
    const c = await this.c(scope).conversation.findUnique({ where: { duoId }, select: { id: true } });
    return c?.id ?? null;
  }

  async humanMessageCounts(scope: TxScope | null, conversationId: string, until: Date | null) {
    const rows = await this.c(scope).message.groupBy({
      by: ['authorUserId'],
      where: { conversationId, authorUserId: { not: null }, systemTemplate: null, status: { in: [...VISIBLE_MESSAGE] }, ...(until ? { publishedAt: { lt: until } } : {}) },
      _count: { _all: true },
    });
    return new Map(rows.filter((r) => r.authorUserId).map((r) => [r.authorUserId!, r._count._all]));
  }

  async dueDuos(at: Date, limit: number) {
    const rows = await this.db.$queryRaw<{ id: string }[]>`
      SELECT d.id FROM "Duo" d WHERE
        (d.status = 'EXCHANGE' AND d."exchangeEndsAt" <= ${at})
        OR (d.origin = 'LANE' AND d.status IN ('UNLOCKED', 'DATE_PROPOSED') AND d."dateDeadline" <= ${at} AND d."datesAttended" = 0 AND NOT d.together)
        OR EXISTS (SELECT 1 FROM "DuoDate" x WHERE x."duoId" = d.id AND (
             (x.status = 'PROPOSED' AND x."startsAt" <= ${at})
          OR (x.status = 'CONFIRMED' AND x."startsAt" + make_interval(mins => ${this.tuning.outings.cycle.checkinClosesAfterMinutes}) <= ${at})
          OR (x.status = 'DONE' AND x."votesCloseAt" <= ${at} AND x."votesClosedAt" IS NULL)))
      ORDER BY d.id LIMIT ${limit}`;
    return rows.map((r) => r.id);
  }

  async expiredToRevoke(before: Date, limit: number) {
    const rows = await this.db.duo.findMany({ where: { status: 'EXPIRED', endedAt: { lte: before }, conversation: { members: { some: { revokedAt: null } } } }, include: { conversation: { select: { id: true } } }, take: limit, orderBy: { id: 'asc' } });
    return rows.map((d) => ({ duoId: d.id, conversationId: d.conversation?.id ?? null, users: [d.userLowId, d.userHighId] as [string, string] }));
  }

  async markRevoked(scope: TxScope, duoId: string) {
    await txOf(scope).duo.update({ where: { id: duoId }, data: { version: { increment: 1 } } });
  }

  async liveDuosBetween(scope: TxScope, a: string, b: string) {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const rows = await txOf(scope).duo.findMany({ where: { userLowId: lo, userHighId: hi, status: { in: LIVE } }, include: { conversation: { select: { id: true } } } });
    return rows.map(duoRow);
  }

  // ------------------------------------------------------------------ rendez-vous
  async date(scope: TxScope | null, dateId: string) {
    const d = await this.c(scope).duoDate.findUnique({ where: { id: dateId } });
    return d ? dateRow(d) : null;
  }

  async currentDate(scope: TxScope | null, duoId: string) {
    const live = await this.liveDate(scope, duoId);
    if (live) return live;
    const d = await this.c(scope).duoDate.findFirst({ where: { duoId, status: 'DONE', votesCloseAt: { not: null }, votesClosedAt: null }, orderBy: { startsAt: 'desc' } });
    return d ? dateRow(d) : null;
  }

  async liveDate(scope: TxScope | null, duoId: string) {
    const d = await this.c(scope).duoDate.findFirst({ where: { duoId, status: { in: ['PROPOSED', 'CONFIRMED'] } } });
    return d ? dateRow(d) : null;
  }

  async createDate(scope: TxScope, d: { id: string; duoId: string; proposedByUserId: string; venueId: string; startsAt: Date; endsAt: Date }) {
    await txOf(scope).duoDate.create({ data: { ...d, status: 'PROPOSED', createdAt: scope.now, updatedAt: scope.now } });
  }

  async updateDate(scope: TxScope, dateId: string, patch: Partial<Pick<DuoDateRow, 'status' | 'checkinLowAt' | 'checkinHighAt' | 'votesCloseAt' | 'votesClosedAt' | 'cancelledByUserId' | 'lateCancel'>> & { ballotsPurgedAt?: Date }) {
    await txOf(scope).duoDate.update({ where: { id: dateId }, data: { ...patch, updatedAt: scope.now, version: { increment: 1 } } });
  }

  async venue(venueId: string) {
    const v = await this.db.venue.findFirst({ where: { id: venueId, status: 'ACTIVE' }, include: { neighborhood: { select: { timezone: true } } } });
    return v ? venueRow(v) : null;
  }

  async venuesFor(userIds: string[]) {
    const users = await this.db.user.findMany({ where: { id: { in: userIds } }, select: { neighborhoodId: true } });
    const ids = [...new Set(users.map((u) => u.neighborhoodId).filter((x): x is string => !!x))];
    if (ids.length === 0) return [];
    const rows = await this.db.venue.findMany({ where: { neighborhoodId: { in: ids }, status: 'ACTIVE' }, include: { neighborhood: { select: { timezone: true } } }, orderBy: [{ name: 'asc' }, { id: 'asc' }] });
    return rows.map(venueRow);
  }

  async checkInAttempts(scope: TxScope, dateId: string, userId: string, method: 'GEO' | 'VENUE_CODE') {
    return txOf(scope).duoDateCheckInAttempt.count({ where: { duoDateId: dateId, userId, method } });
  }

  async recordCheckInAttempt(scope: TxScope, a: { dateId: string; userId: string; method: 'GEO' | 'VENUE_CODE'; result: 'ACCEPTED' | 'TOO_FAR' | 'LOW_ACCURACY' | 'CODE_INVALID'; accuracyBucket: 'LE_50' | 'LE_150' | 'GT_150' | null }) {
    await txOf(scope).duoDateCheckInAttempt.create({ data: { duoDateId: a.dateId, userId: a.userId, method: a.method, result: a.result, accuracyBucket: a.accuracyBucket, createdAt: scope.now } });
  }

  async ballots(scope: TxScope | null, dateId: string) {
    const rows = await this.c(scope).duoVote.findMany({ where: { duoDateId: dateId } });
    return new Map(rows.map((r) => [r.voterUserId, r.choice as VoteChoice]));
  }

  async saveBallot(scope: TxScope, dateId: string, voterId: string, choice: VoteChoice) {
    await txOf(scope).duoVote.upsert({ where: { duoDateId_voterUserId: { duoDateId: dateId, voterUserId: voterId } }, create: { duoDateId: dateId, voterUserId: voterId, choice, createdAt: scope.now, updatedAt: scope.now }, update: { choice, updatedAt: scope.now } });
  }

  async datesToPurge(before: Date, limit: number) {
    const rows = await this.db.duoDate.findMany({ where: { votesClosedAt: { lte: before }, ballotsPurgedAt: null }, select: { id: true }, take: limit, orderBy: { id: 'asc' } });
    return rows.map((r) => r.id);
  }

  async purgeBallots(scope: TxScope, dateId: string) {
    const r = await txOf(scope).duoVote.deleteMany({ where: { duoDateId: dateId } });
    await txOf(scope).duoDate.update({ where: { id: dateId }, data: { ballotsPurgedAt: scope.now } });
    return r.count;
  }

  async createReveal(scope: TxScope, r: { id: string; dateId: string; low: string; high: string; kind: ConnectionKind; friendshipId: string | null; duoId: string | null }) {
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "ConnectionReveal" (id, "sourceKind", "sourceId", "userLowId", "userHighId", result, "revealedAt", "friendshipId", "duoId")
      VALUES (${r.id}::uuid, 'DUO_DATE', ${r.dateId}::uuid, ${r.low}::uuid, ${r.high}::uuid, ${r.kind}::"ConnectionKind", ${scope.now}, ${r.friendshipId}::uuid, ${r.duoId}::uuid)
      ON CONFLICT ("sourceKind", "sourceId", "userLowId", "userHighId") DO NOTHING`;
    return n === 1;
  }

  // ------------------------------------------------------------------ bande
  async bandLink(scope: TxScope | null, linkId: string): Promise<BandLinkRow | null> {
    const f = await this.c(scope).friendship.findUnique({ where: { id: linkId }, include: { conversation: { select: { id: true } } } });
    return f ? { id: f.id, userLowId: f.userLowId, userHighId: f.userHighId, status: f.status, origin: f.origin, conversationId: f.conversation?.id ?? null } : null;
  }

  async activeBandLinksBetween(scope: TxScope, a: string, b: string) {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const f = await txOf(scope).friendship.findMany({ where: { userLowId: lo, userHighId: hi, status: 'ACTIVE', origin: { not: null } }, include: { conversation: { select: { id: true } } } });
    return f.map((x) => ({ id: x.id, userLowId: x.userLowId, userHighId: x.userHighId, status: x.status, origin: x.origin, conversationId: x.conversation?.id ?? null }));
  }

  async withdrawBandLink(scope: TxScope, linkId: string, reason: 'LEFT' | 'BLOCKED') {
    await txOf(scope).friendship.update({ where: { id: linkId }, data: { status: 'WITHDRAWN', endedAt: scope.now, endedReason: reason } });
  }

  async ensureBandLink(scope: TxScope, l: { id: string; low: string; high: string; duoId: string; invitedById: string }) {
    const tx = txOf(scope);
    const existing = await tx.friendship.findUnique({ where: { userLowId_userHighId: { userLowId: l.low, userHighId: l.high } } });
    if (existing) {
      if (existing.status === 'ACTIVE' && existing.origin) return { id: existing.id, created: false };
      await tx.friendship.update({ where: { id: existing.id }, data: { status: 'ACTIVE', origin: 'DUO_VOTE', sourceDuoId: l.duoId, acceptedAt: scope.now, endedAt: null, endedReason: null } });
      return { id: existing.id, created: true };
    }
    await tx.friendship.create({ data: { id: l.id, userLowId: l.low, userHighId: l.high, status: 'ACTIVE', invitedById: l.invitedById, createdAt: scope.now, acceptedAt: scope.now, origin: 'DUO_VOTE', sourceDuoId: l.duoId } });
    return { id: l.id, created: true };
  }

  async memories(userId: string, limit: number): Promise<MemoryRow[]> {
    const pet = await this.db.pet.findUnique({ where: { primaryOwnerId: userId }, select: { id: true } });
    if (!pet) return [];
    const rows = await this.db.petMemory.findMany({ where: { petId: pet.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: limit });
    return rows.map((r) => ({ id: r.id, kind: r.kind, data: (r.data ?? {}) as Record<string, unknown>, createdAt: r.createdAt }));
  }

  async streetArrangement(userId: string) {
    return (await this.db.streetArrangement.findUnique({ where: { userId } }))?.memoryIds ?? [];
  }

  async setStreetArrangement(scope: TxScope, userId: string, memoryIds: string[]) {
    await txOf(scope).streetArrangement.upsert({ where: { userId }, create: { userId, memoryIds, updatedAt: scope.now }, update: { memoryIds, updatedAt: scope.now } });
  }

  async receivedGifts(userId: string, limit: number) {
    return this.db.streetGift.findMany({ where: { toUserId: userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: limit, select: { fromUserId: true, linkId: true, accessoryId: true, createdAt: true } });
  }

  async createGift(scope: TxScope, g: { fromUserId: string; toUserId: string; linkId: string; accessoryId: string }) {
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "StreetGift" (id, "fromUserId", "toUserId", "linkId", "accessoryId", "createdAt")
      VALUES (${uuidv7(scope.now.getTime())}::uuid, ${g.fromUserId}::uuid, ${g.toUserId}::uuid, ${g.linkId}::uuid, ${g.accessoryId}, ${scope.now})
      ON CONFLICT ("fromUserId", "toUserId", "accessoryId") DO NOTHING`;
    return n === 1;
  }

  async hasAccessory(scope: TxScope | null, userId: string, accessoryId: string) {
    return (await this.c(scope).petAccessory.count({ where: { accessoryId, pet: { primaryOwnerId: userId } } })) > 0;
  }

  // ------------------------------------------------------------------ personnes
  persons(userIds: string[], at: Date) {
    return loadPersons(this.db, userIds, at);
  }

  async seeks(userIds: string[], at: Date) {
    const rows = await this.db.user.findMany({ where: { id: { in: userIds } }, include: { profile: { select: { gender: true } }, matchPreferences: true, outingPreferences: true } });
    const out = new Map<string, SeeksFacts>();
    for (const u of rows) {
      const p = u.matchPreferences;
      const age = ageOf(u.birthDate, u.timezone, at);
      const lookingFor = p?.lookingFor ?? 'FRIENDS';
      out.set(u.id, {
        gender: (u.profile?.gender ?? 'UNDISCLOSED') as Gender,
        lookingFor,
        storySeriousness: p?.storySeriousness ?? null,
        kidsSomeday: p?.kidsSomeday ?? null,
        meetingMode: p?.meetingMode ?? null,
        meetGenders: (p?.meetGenders ?? []) as Gender[],
        romanceGenders: seeksOf(lookingFor).romance ? ((p?.romanceGenders ?? []) as Gender[]) : [],
        age,
        groupAge: u.outingPreferences ? { min: u.outingPreferences.groupAgeMin, max: u.outingPreferences.groupAgeMax } : defaultGroupAge(age, this.tuning),
      });
    }
    return out;
  }

  async verified(scope: TxScope | null, userId: string, at: Date) {
    return (await verifiedSet(this.c(scope), [userId], at)).has(userId);
  }

  async timezoneOf(userId: string) {
    return (await this.db.user.findUnique({ where: { id: userId }, select: { timezone: true } }))?.timezone ?? 'Europe/Paris';
  }

  // ------------------------------------------------------------------ voie Duo
  async laneZones() {
    const rows = await this.db.neighborhood.findMany({ where: { status: { in: ['LIVE', 'WAITLIST'] } }, select: { cityZoneId: true, timezone: true }, distinct: ['cityZoneId'] });
    return rows.map((r) => ({ zoneId: r.cityZoneId, timezone: r.timezone }));
  }

  async laneCandidates(zoneId: string, at: Date) {
    const users = await this.db.user.findMany({
      where: { status: 'ACTIVE', deletedAt: null, neighborhood: { cityZoneId: zoneId }, matchPreferences: { meetingMode: { in: ['DUO', 'BOTH'] } } },
      include: CANDIDATE_INCLUDE,
      orderBy: { id: 'asc' },
    });
    const verified = await verifiedSet(this.db, users.map((u) => u.id), at);
    return users.flatMap((u) => {
      if (!verified.has(u.id)) return [];
      const c = toCandidate(u, { at, verified: true, slotStartsAtMs: [], homeNeighborhoodId: u.neighborhoodId, missedWeeks: 0, requestedAt: at, tuning: this.tuning });
      if (!c) return [];
      return [{ userId: u.id, petId: c.profile.petId, profile: c.profile, seeks: { gender: c.profile.gender, seeks: c.seeks, meetGenders: c.meetGenders, romanceGenders: c.romanceGenders, age: c.profile.age, groupAge: c.groupAge } }];
    });
  }

  async laneExcludedPairs(userIds: string[], since: Date) {
    const facts = await compositionFacts(this.db, userIds);
    const recent = await this.db.matchProposal.findMany({ where: { userLowId: { in: userIds }, userHighId: { in: userIds }, OR: [{ status: 'OPEN' }, { kind: 'DUO_LANE', createdAt: { gte: since } }] }, select: { userLowId: true, userHighId: true } });
    return new Set([...facts.blockedPairs, ...facts.metPairs, ...recent.map((r) => pairKey(r.userLowId, r.userHighId))]);
  }

  async openLaneProposalCount(scope: TxScope | null, userId: string, at: Date) {
    return this.c(scope).matchProposal.count({ where: { kind: 'DUO_LANE', status: 'OPEN', expiresAt: { gt: at }, OR: [{ userLowId: userId }, { userHighId: userId }], NOT: { id: { in: await this.passedIds(scope, userId) } } } });
  }

  private async passedIds(scope: TxScope | null, userId: string) {
    return (await this.c(scope).duoLanePass.findMany({ where: { userId }, select: { proposalId: true } })).map((p) => p.proposalId);
  }

  async startLaneBatch(scope: TxScope, b: { id: string; zoneId: string; localDate: string; algoVersion: string; tuningVersion: string }) {
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "MatchBatch" (id, "zoneId", "localDate", kind, status, "algoVersion", "tuningVersion", "startedAt")
      VALUES (${b.id}::uuid, ${b.zoneId}::uuid, ${b.localDate}, 'DUO_LANE', 'RUNNING', ${b.algoVersion}, ${b.tuningVersion}, ${scope.now})
      ON CONFLICT ("zoneId", "localDate", kind) DO NOTHING`;
    return n === 1;
  }

  async finishLaneBatch(scope: TxScope, id: string, stats: Record<string, unknown>) {
    await txOf(scope).matchBatch.update({ where: { id }, data: { status: 'COMPLETED', finishedAt: scope.now, stats: stats as object } });
  }

  async createLaneProposal(scope: TxScope, p: { id: string; batchId: string; userA: string; petA: string; userB: string; petB: string; visionScore: number; expiresAt: Date }) {
    const [lo, hi] = p.petA < p.petB ? [{ u: p.userA, pet: p.petA }, { u: p.userB, pet: p.petB }] : [{ u: p.userB, pet: p.petB }, { u: p.userA, pet: p.petA }];
    const n = await txOf(scope).$executeRaw`
      INSERT INTO "MatchProposal" (id, "batchId", "petLowId", "petHighId", "userLowId", "userHighId", kind, "visionScore", "rankScore", breakdown, status, "expiresAt", "createdAt")
      VALUES (${p.id}::uuid, ${p.batchId}::uuid, ${lo.pet}::uuid, ${hi.pet}::uuid, ${lo.u}::uuid, ${hi.u}::uuid, 'DUO_LANE', ${p.visionScore}, ${p.visionScore}, '{}'::jsonb, 'OPEN', ${p.expiresAt}, ${scope.now})
      ON CONFLICT DO NOTHING`;
    return n === 1;
  }

  private async laneRow(c: Tx | Db, where: object): Promise<LaneProposalRow[]> {
    const rows = await c.matchProposal.findMany({ where: { kind: 'DUO_LANE', ...where }, include: { acceptances: { select: { userId: true } } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    if (rows.length === 0) return [];
    const [passes, duos] = await Promise.all([
      c.duoLanePass.findMany({ where: { proposalId: { in: rows.map((r) => r.id) } }, select: { proposalId: true, userId: true } }),
      c.duo.findMany({ where: { proposalId: { in: rows.map((r) => r.id) } }, select: { id: true, proposalId: true } }),
    ]);
    return rows.map((r) => ({
      id: r.id,
      userLowId: r.userLowId,
      userHighId: r.userHighId,
      petLowId: r.petLowId,
      petHighId: r.petHighId,
      visionScore: r.visionScore,
      status: r.status,
      expiresAt: r.expiresAt,
      acceptedBy: r.acceptances.map((a) => a.userId),
      passedBy: passes.filter((p) => p.proposalId === r.id).map((p) => p.userId),
      duoId: duos.find((d) => d.proposalId === r.id)?.id ?? null,
    }));
  }

  async laneProposal(scope: TxScope | null, id: string) {
    return (await this.laneRow(this.c(scope), { id }))[0] ?? null;
  }

  async laneProposalsFor(userId: string, at: Date) {
    return this.laneRow(this.db, { status: 'OPEN', expiresAt: { gt: at }, OR: [{ userLowId: userId }, { userHighId: userId }] });
  }

  async acceptLaneProposal(scope: TxScope, proposalId: string, userId: string) {
    await txOf(scope).matchAcceptance.upsert({ where: { proposalId_userId: { proposalId, userId } }, create: { proposalId, userId, createdAt: scope.now }, update: {} });
  }

  async passLaneProposal(scope: TxScope, proposalId: string, userId: string) {
    await txOf(scope).$executeRaw`INSERT INTO "DuoLanePass" (id, "proposalId", "userId", "createdAt") VALUES (${uuidv7(scope.now.getTime())}::uuid, ${proposalId}::uuid, ${userId}::uuid, ${scope.now}) ON CONFLICT DO NOTHING`;
  }

  async setLaneProposalStatus(scope: TxScope, id: string, status: LaneProposalRow['status']) {
    await txOf(scope).matchProposal.update({ where: { id }, data: { status, resolvedAt: scope.now } });
  }
}
