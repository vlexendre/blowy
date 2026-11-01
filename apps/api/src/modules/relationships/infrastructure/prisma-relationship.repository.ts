import { uuidv7, type Db } from '@blowy/database';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { ContextRow, NewContext, OfferRow, RelationshipRepository, RoundRow } from '../application/ports/relationship.repository.js';

const ctxInclude = { sides: true, conversation: { select: { id: true } } } as const;

type CtxWithSides = Awaited<ReturnType<Db['relationshipContext']['findUniqueOrThrow']>> & {
  sides: Awaited<ReturnType<Db['relationshipSide']['findMany']>>;
  conversation: { id: string } | null;
};

function toRow(c: CtxWithSides): ContextRow {
  return {
    id: c.id,
    pairId: c.pairId,
    type: c.type,
    status: c.status,
    branch: c.branch,
    affinity: c.affinity,
    xpMilli: c.xpMilli,
    eligibleLevel: c.eligibleLevel,
    reachedLevel: c.reachedLevel,
    complicity: c.complicity,
    tension: c.tension,
    dateSpotKey: c.dateSpotKey,
    timezone: c.timezone,
    legacy: c.legacy,
    startedAt: c.startedAt,
    endedAt: c.endedAt,
    version: c.version,
    conversationId: c.conversation?.id ?? null,
    sides: [...c.sides]
      .sort((a, b) => (a.userId < b.userId ? -1 : 1))
      .map((s) => ({ id: s.id, userId: s.userId, petId: s.petId, active: s.active, exclusive: s.exclusive, desire: s.desire, replyOwedSince: s.replyOwedSince, replyOwedEpisode: s.replyOwedEpisode })),
  };
}

export class PrismaRelationshipRepository implements RelationshipRepository {
  constructor(private readonly db: Db) {}
  private c(scope: TxScope | null) {
    return scope ? txOf(scope) : this.db;
  }

  async load(scope: TxScope | null, contextId: string) {
    const c = await this.c(scope).relationshipContext.findUnique({ where: { id: contextId }, include: ctxInclude });
    return c ? toRow(c as CtxWithSides) : null;
  }

  async listForUser(userId: string, includeEnded: boolean) {
    const rows = await this.db.relationshipContext.findMany({
      where: { sides: { some: { userId, ...(includeEnded ? {} : { active: true }) } }, ...(includeEnded ? {} : { status: { not: 'ENDED' } }) },
      include: ctxInclude,
      orderBy: { startedAt: 'desc' },
    });
    return rows.map((r) => toRow(r as CtxWithSides));
  }

  async liveDateContextsOf(scope: TxScope, userId: string) {
    const rows = await txOf(scope).relationshipContext.findMany({ where: { type: 'DATE', status: { not: 'ENDED' }, sides: { some: { userId, active: true } } }, include: ctxInclude });
    return rows.map((r) => toRow(r as CtxWithSides));
  }

  async hasExclusive(scope: TxScope, userId: string) {
    return (await txOf(scope).relationshipSide.count({ where: { userId, exclusive: true, active: true } })) > 0;
  }

  async ensurePair(scope: TxScope, petA: string, petB: string) {
    const [low, high] = petA < petB ? [petA, petB] : [petB, petA];
    const tx = txOf(scope);
    await tx.$executeRaw`INSERT INTO "PetPair" (id, "petLowId", "petHighId", "createdAt") VALUES (${uuidv7(scope.now.getTime())}::uuid, ${low}::uuid, ${high}::uuid, ${scope.now}) ON CONFLICT ("petLowId", "petHighId") DO NOTHING`;
    return (await tx.petPair.findUniqueOrThrow({ where: { petLowId_petHighId: { petLowId: low, petHighId: high } } })).id;
  }

  async existingLiveContext(scope: TxScope, pairId: string) {
    return (await txOf(scope).relationshipContext.findFirst({ where: { pairId, type: 'DATE', status: { not: 'ENDED' } }, select: { id: true } }))?.id ?? null;
  }

  async create(scope: TxScope, n: NewContext) {
    await txOf(scope).relationshipContext.create({
      data: {
        id: n.id,
        pairId: n.pairId,
        type: 'DATE',
        affinity: n.affinity,
        dateSpotKey: n.dateSpotKey,
        timezone: n.timezone,
        complicity: n.complicity,
        tension: n.tension,
        startedAt: scope.now,
        engineVersion: n.engineVersion,
        tuningVersion: n.tuningVersion,
        createdAt: scope.now,
        sides: { create: n.sides.map((s) => ({ userId: s.userId, petId: s.petId, desire: n.desire, joinedAt: scope.now })) },
      },
    });
  }

  async appendEvent(scope: TxScope, contextId: string, e: Parameters<RelationshipRepository['appendEvent']>[2]) {
    const tx = txOf(scope);
    const { lastEventSeq } = await tx.relationshipContext.update({ where: { id: contextId }, data: { lastEventSeq: { increment: 1 } }, select: { lastEventSeq: true } });
    const id = uuidv7(scope.now.getTime());
    await tx.relationshipEvent.create({
      data: {
        id,
        contextId,
        seq: lastEventSeq,
        type: e.type,
        actorUserId: e.actorUserId,
        visibility: e.visibility ?? 'PARTICIPANTS',
        payload: e.payload as object,
        engineVersion: e.engineVersion ?? null,
        tuningVersion: e.tuningVersion ?? null,
        occurredAt: scope.now,
      },
    });
    return { id, seq: lastEventSeq };
  }

  async update(scope: TxScope, contextId: string, patch: Parameters<RelationshipRepository['update']>[2]) {
    const { endReason, ...rest } = patch;
    await txOf(scope).relationshipContext.update({
      where: { id: contextId },
      data: { ...rest, ...(endReason ? { endReason: endReason as never } : {}), version: { increment: 1 } },
    });
  }

  async deactivateSides(scope: TxScope, contextId: string) {
    await txOf(scope).relationshipSide.updateMany({ where: { contextId, active: true }, data: { active: false, exclusive: false, leftAt: scope.now } });
  }

  async setExclusive(scope: TxScope, contextId: string) {
    await txOf(scope).relationshipSide.updateMany({ where: { contextId, active: true }, data: { exclusive: true } });
  }

  async setReplyOwed(scope: TxScope, contextId: string, userId: string, since: Date | null, episode: string | null) {
    await txOf(scope).relationshipSide.updateMany({ where: { contextId, userId }, data: { replyOwedSince: since, replyOwedEpisode: episode } });
  }

  async openOffers(scope: TxScope | null, contextId: string, at: Date): Promise<OfferRow[]> {
    const rows = await this.c(scope).consentSession.findMany({ where: { contextId, status: 'OPEN', expiresAt: { gt: at } }, include: { responses: true }, orderBy: { createdAt: 'asc' } });
    return rows.map((o) => ({ id: o.id, scope: o.scope, version: o.version, proposedBy: o.proposedBy, status: o.status, expiresAt: o.expiresAt, responses: o.responses.map((r) => ({ userId: r.userId, decision: r.decision })) }));
  }

  async nextOfferVersion(scope: TxScope, contextId: string, offerScope: OfferRow['scope']) {
    const agg = await txOf(scope).consentSession.aggregate({ where: { contextId, scope: offerScope }, _max: { version: true } });
    return (agg._max.version ?? 0) + 1;
  }

  async createOffer(scope: TxScope, o: Parameters<RelationshipRepository['createOffer']>[1]) {
    await txOf(scope).consentSession.create({ data: { ...o, createdAt: scope.now } });
  }

  async respondOffer(scope: TxScope, offerId: string, userId: string, decision: 'ACCEPT' | 'DECLINE') {
    await txOf(scope).consentResponse.create({ data: { sessionId: offerId, userId, decision, createdAt: scope.now } });
  }

  async setOfferStatus(scope: TxScope, offerId: string, status: OfferRow['status']) {
    await txOf(scope).consentSession.update({ where: { id: offerId }, data: { status, resolvedAt: scope.now } });
  }

  async supersedeOffersOf(scope: TxScope, contextIds: string[], offerScope: OfferRow['scope']) {
    await txOf(scope).consentSession.updateMany({ where: { contextId: { in: contextIds }, scope: offerScope, status: 'OPEN' }, data: { status: 'SUPERSEDED', resolvedAt: scope.now } });
  }

  async openRound(scope: TxScope | null, contextId: string): Promise<RoundRow | null> {
    const r = await this.c(scope).branchRound.findFirst({ where: { contextId, status: 'OPEN' }, orderBy: { roundNo: 'desc' } });
    return r ? { id: r.id, roundNo: r.roundNo, status: r.status, deadlineAt: r.deadlineAt, result: r.result } : null;
  }

  async createRound(scope: TxScope, r: Parameters<RelationshipRepository['createRound']>[1]) {
    await txOf(scope).branchRound.create({ data: { ...r, createdAt: scope.now } });
  }

  async lastRoundNo(scope: TxScope, contextId: string) {
    return (await txOf(scope).branchRound.aggregate({ where: { contextId }, _max: { roundNo: true } }))._max.roundNo ?? 0;
  }

  async castBallot(scope: TxScope, roundId: string, userId: string, choice: 'FRIEND' | 'PLUS') {
    await txOf(scope).branchBallot.create({ data: { roundId, userId, choice, createdAt: scope.now } });
  }

  async ballotsOf(scope: TxScope, roundId: string) {
    return txOf(scope).branchBallot.findMany({ where: { roundId }, select: { userId: true, choice: true } });
  }

  async myBallot(roundId: string, userId: string) {
    return (await this.db.branchBallot.findUnique({ where: { roundId_userId: { roundId, userId } }, select: { choice: true } }))?.choice ?? null;
  }

  async resolveRound(scope: TxScope, roundId: string, result: 'FRIEND' | 'PLUS', at: Date) {
    await txOf(scope).branchRound.update({ where: { id: roundId }, data: { status: 'RESOLVED', result, resolvedAt: at } });
  }

  async dueRounds(at: Date, limit: number) {
    return this.db.branchRound.findMany({ where: { status: 'OPEN', deadlineAt: { lte: at } }, select: { id: true, contextId: true }, take: limit });
  }

  async todayCounters(scope: TxScope, contextId: string, relDay: string) {
    const rows = await txOf(scope).relationshipDailyCounter.findMany({ where: { contextId, relDay } });
    return Object.fromEntries(rows.map((r) => [r.counterKey, { count: r.count, xpMilli: r.xpMilli }]));
  }

  async addCounters(scope: TxScope, contextId: string, relDay: string, counters: Readonly<Record<string, { count: number; xpMilli: number }>>) {
    const tx = txOf(scope);
    for (const [counterKey, v] of Object.entries(counters)) {
      if (v.count === 0 && v.xpMilli === 0) continue;
      await tx.relationshipDailyCounter.upsert({
        where: { contextId_relDay_counterKey: { contextId, relDay, counterKey } },
        create: { contextId, relDay, counterKey, count: v.count, xpMilli: v.xpMilli },
        update: { count: { increment: v.count }, xpMilli: { increment: v.xpMilli } },
      });
    }
  }

  async contributions(scope: TxScope, contextId: string, since: Date) {
    const rows = await txOf(scope).contributionEvent.groupBy({ by: ['userId'], where: { contextId, occurredAt: { gte: since } }, _sum: { weight: true } });
    return Object.fromEntries(rows.map((r) => [r.userId, r._sum.weight ?? 0]));
  }

  async addContribution(scope: TxScope, c: Parameters<RelationshipRepository['addContribution']>[1]) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "ContributionEvent" (id, "contextId", "userId", kind, weight, "dedupKey", "occurredAt") VALUES (${uuidv7(scope.now.getTime())}::uuid, ${c.contextId}::uuid, ${c.userId}::uuid, ${c.kind}, ${c.weight}, ${c.dedupKey}, ${c.occurredAt}) ON CONFLICT ("dedupKey") DO NOTHING`;
    return n === 1;
  }

  async isPausedFor(scope: TxScope | null, contextId: string, userIds: string[], at: Date) {
    const rows = await this.c(scope).pausePeriod.findMany({
      where: { userId: { in: userIds }, endedAt: null, startsAt: { lte: at }, endsAt: { gt: at }, OR: [{ contextId }, { contextId: null }] },
      select: { userId: true },
    });
    const byUser = new Set(rows.map((r) => r.userId));
    return { any: byUser.size > 0, byUser };
  }

  async photoPreferences(userIds: string[]) {
    const rows = await this.db.privacySettings.findMany({ where: { userId: { in: userIds } }, select: { userId: true, photoPreference: true } });
    return new Map(rows.map((r) => [r.userId, r.photoPreference]));
  }

  async petLocations(petIds: string[]) {
    const rows = await this.db.virtualLocation.findMany({ where: { petId: { in: petIds } } });
    return new Map(rows.map((r) => [r.petId, { kind: r.kind, contextId: r.contextId }]));
  }

  async replyDebtors(before: Date, limit: number) {
    const rows = await this.db.relationshipSide.findMany({
      where: { active: true, replyOwedSince: { lte: before }, replyOwedEpisode: { not: null }, context: { status: { not: 'ENDED' } } },
      select: { contextId: true, userId: true, replyOwedSince: true, replyOwedEpisode: true },
      take: limit,
    });
    return rows.map((r) => ({ contextId: r.contextId, userId: r.userId, since: r.replyOwedSince!, episode: r.replyOwedEpisode! }));
  }

  async silentContexts(lastActivityBefore: Date, limit: number) {
    // Silence admissible : aucun message humain publié depuis la date seuil, relation plus ancienne que le seuil.
    const rows = await this.db.$queryRaw<{ id: string }[]>`
      SELECT c.id FROM "RelationshipContext" c
      LEFT JOIN "Conversation" cv ON cv."contextId" = c.id
      WHERE c.status <> 'ENDED' AND c.type = 'DATE' AND c."startedAt" <= ${lastActivityBefore}
        AND NOT EXISTS (SELECT 1 FROM "Message" m WHERE m."conversationId" = cv.id AND m.kind <> 'SYSTEM'
                        AND m.status = 'PUBLISHED' AND m."publishedAt" > ${lastActivityBefore})
      LIMIT ${limit}`;
    return rows.map((r) => r.id);
  }
}

export class PrismaReliabilityLedger {
  async penalizeOnce(scope: TxScope, input: { userId: string; contextId: string; delta: number; episodeKey: string }): Promise<boolean> {
    const tx = txOf(scope);
    const n = await tx.$executeRaw`INSERT INTO "ReliabilityEvent" (id, "userId", "contextId", reason, delta, "episodeKey", "createdAt") VALUES (${uuidv7(scope.now.getTime())}::uuid, ${input.userId}::uuid, ${input.contextId}::uuid, 'GHOSTING_72H', ${input.delta}, ${input.episodeKey}, ${scope.now}) ON CONFLICT ("userId", reason, "episodeKey") DO NOTHING`;
    if (n !== 1) return false;
    await tx.$executeRaw`UPDATE "User" SET reliability = GREATEST(0, LEAST(100, reliability + ${input.delta})) WHERE id = ${input.userId}::uuid`;
    return true;
  }
}
