import { isUniqueViolation, type Db } from '@blowy/database';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { ageOn, localCivilDate } from '../../users/domain/age.js';
import { storedToVision } from '../../pets/domain/pet.js';
import type { MatchingRepository, PoolMember, ProposalRow } from '../application/ports/matching.repository.js';

const key = (a: string, b: string) => (a < b ? `${a}:${b}` : `${b}:${a}`);

export class PrismaMatchingRepository implements MatchingRepository {
  constructor(
    private readonly db: Db,
    private readonly slotsOf: (userId: string, at: Date) => Promise<number>,
  ) {}
  private c(scope: TxScope | null) {
    return scope ? txOf(scope) : this.db;
  }

  async zones(): Promise<{ id: string; code: string; timezone: string }[]> {
    return this.db.zone.findMany({ where: { active: true }, select: { id: true, code: true, timezone: true } });
  }

  async zoneOfUser(userId: string) {
    const u = await this.db.user.findUnique({ where: { id: userId }, select: { zone: { select: { id: true, timezone: true } } } });
    return u?.zone ?? null;
  }

  async pool(zoneId: string, at: Date): Promise<PoolMember[]> {
    const users = await this.db.user.findMany({
      where: { zoneId, status: 'ACTIVE', onboardedAt: { not: null }, birthDate: { not: null }, primaryPet: { isNot: null }, matchPreferences: { isNot: null } },
      include: {
        profile: true,
        matchPreferences: true,
        primaryPet: { include: { vision: true } },
        verificationSessions: { where: { status: 'VERIFIED', OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] }, take: 1 },
        pausePeriods: { where: { endedAt: null, contextId: null, startsAt: { lte: at }, endsAt: { gt: at } }, take: 1 },
        relationshipSides: { where: { active: true, context: { type: 'DATE', status: { not: 'ENDED' } } }, select: { exclusive: true, context: { select: { legacy: true } } } },
      },
      orderBy: { id: 'asc' },
    });
    const out: PoolMember[] = [];
    for (const u of users) {
      const pet = u.primaryPet;
      const prefs = u.matchPreferences;
      if (!pet?.vision || !prefs || !u.birthDate || !pet.matchable) continue;
      const exclusive = u.relationshipSides.some((s) => s.exclusive);
      const live = u.relationshipSides.filter((s) => !s.context.legacy).length;
      const slots = await this.slotsOf(u.id, at);
      out.push({
        userId: u.id,
        petId: pet.id,
        age: ageOn({ y: u.birthDate.getUTCFullYear(), m: u.birthDate.getUTCMonth() + 1, d: u.birthDate.getUTCDate() }, localCivilDate(at, u.timezone)),
        gender: u.profile?.gender ?? 'UNDISCLOSED',
        prefs: { ageMin: prefs.ageMin, ageMax: prefs.ageMax, maxDistanceKm: prefs.maxDistanceKm, seekingGenders: prefs.seekingGenders, intention: prefs.intention },
        verified: u.verificationSessions.length > 0,
        reliability: u.reliability,
        limit: pet.vision.limit,
        lastActiveAt: u.lastActiveAt,
        cell: prefs.areaCellLat !== null && prefs.areaCellLng !== null ? { lat: prefs.areaCellLat, lng: prefs.areaCellLng } : null,
        hasCapacity: !exclusive && live < slots,
        paused: u.pausePeriods.length > 0,
        species: pet.species,
        vision: storedToVision(pet.vision),
        sunday: pet.vision.sunday,
      });
    }
    return out;
  }

  async blockedPairs(userIds: string[]) {
    const rows = await this.db.block.findMany({ where: { blockerId: { in: userIds }, blockedId: { in: userIds } }, select: { blockerId: true, blockedId: true } });
    const reports = await this.db.report.findMany({ where: { reporterId: { in: userIds }, reportedUserId: { in: userIds } }, select: { reporterId: true, reportedUserId: true } });
    return new Set([...rows.map((r) => key(r.blockerId, r.blockedId)), ...reports.map((r) => key(r.reporterId, r.reportedUserId))]);
  }

  async metPairs(petIds: string[]) {
    const rows = await this.db.petPair.findMany({ where: { petLowId: { in: petIds }, petHighId: { in: petIds }, contexts: { some: { type: 'DATE' } } }, select: { petLowId: true, petHighId: true } });
    const props = await this.db.matchProposal.findMany({ where: { petLowId: { in: petIds }, petHighId: { in: petIds }, status: { in: ['ACCEPTED', 'EXPIRED'] } }, select: { petLowId: true, petHighId: true } });
    return new Set([...rows, ...props].map((r) => key(r.petLowId, r.petHighId)));
  }

  async openProposalCounts(userIds: string[], at: Date) {
    const rows = await this.db.matchProposal.findMany({ where: { status: 'OPEN', expiresAt: { gt: at }, OR: [{ userLowId: { in: userIds } }, { userHighId: { in: userIds } }] }, select: { userLowId: true, userHighId: true } });
    const m = new Map<string, number>();
    for (const r of rows) for (const u of [r.userLowId, r.userHighId]) m.set(u, (m.get(u) ?? 0) + 1);
    return m;
  }

  async openPairs(at: Date) {
    const rows = await this.db.matchProposal.findMany({ where: { status: 'OPEN', expiresAt: { gt: at } }, select: { petLowId: true, petHighId: true } });
    return new Set(rows.map((r) => key(r.petLowId, r.petHighId)));
  }

  async startBatch(scope: TxScope, b: Parameters<MatchingRepository['startBatch']>[1]) {
    try {
      await txOf(scope).$executeRaw`SAVEPOINT batch_start`;
      await txOf(scope).matchBatch.create({ data: { ...b, startedAt: scope.now } });
      await txOf(scope).$executeRaw`RELEASE SAVEPOINT batch_start`;
      return true;
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      await txOf(scope).$executeRaw`ROLLBACK TO SAVEPOINT batch_start`;
      return false;
    }
  }

  async finishBatch(scope: TxScope, id: string, stats: Record<string, unknown>) {
    await txOf(scope).matchBatch.update({ where: { id }, data: { status: 'COMPLETED', finishedAt: scope.now, stats: stats as object } });
  }

  async createProposal(scope: TxScope, p: Parameters<MatchingRepository['createProposal']>[1]) {
    await txOf(scope).matchProposal.create({ data: { ...p, breakdown: p.breakdown as object, createdAt: scope.now } });
  }

  async load(scope: TxScope | null, id: string): Promise<ProposalRow | null> {
    const p = await this.c(scope).matchProposal.findUnique({ where: { id }, include: { acceptances: { select: { userId: true } } } });
    return p ? { ...p, acceptedBy: p.acceptances.map((a) => a.userId) } : null;
  }

  async forUser(userId: string, at: Date) {
    const rows = await this.db.matchProposal.findMany({
      where: { status: 'OPEN', expiresAt: { gt: at }, OR: [{ userLowId: userId }, { userHighId: userId }] },
      include: { acceptances: { where: { userId }, select: { userId: true } } },
      orderBy: [{ rankScore: 'desc' }, { id: 'asc' }],
    });
    // Seule ma propre acceptation est chargée (jamais celle de l'autre).
    return rows.map((p) => ({ ...p, acceptedBy: p.acceptances.map((a) => a.userId) }));
  }

  async accept(scope: TxScope, proposalId: string, userId: string) {
    const n = await txOf(scope).$executeRaw`INSERT INTO "MatchAcceptance" (id, "proposalId", "userId", "createdAt") VALUES (gen_random_uuid(), ${proposalId}::uuid, ${userId}::uuid, ${scope.now}) ON CONFLICT DO NOTHING`;
    return n === 1;
  }

  async setStatus(scope: TxScope, id: string, status: ProposalRow['status'], contextId?: string) {
    await txOf(scope).matchProposal.update({ where: { id }, data: { status, resolvedAt: scope.now, ...(contextId ? { contextId } : {}) } });
  }

  async expireDue(scope: TxScope, at: Date) {
    return (await txOf(scope).matchProposal.updateMany({ where: { status: 'OPEN', expiresAt: { lte: at } }, data: { status: 'EXPIRED', resolvedAt: at } })).count;
  }

  async feedContext(userId: string, at: Date) {
    const u = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        primaryPet: { select: { id: true } },
        verificationSessions: { where: { status: 'VERIFIED', OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] }, take: 1, select: { id: true } },
        pausePeriods: { where: { endedAt: null, contextId: null, startsAt: { lte: at }, endsAt: { gt: at } }, take: 1, select: { id: true } },
      },
    });
    return { verified: (u?.verificationSessions.length ?? 0) > 0, hasPet: !!u?.primaryPet, paused: (u?.pausePeriods.length ?? 0) > 0 };
  }

  async matchingInputs(scope: TxScope, userId: string, at: Date) {
    const u = await txOf(scope).user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        status: true,
        timezone: true,
        verificationSessions: { where: { status: 'VERIFIED', OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] }, take: 1, select: { id: true } },
        primaryPet: { select: { vision: { select: { sunday: true } } } },
      },
    });
    return { verified: u.verificationSessions.length > 0, status: u.status, timezone: u.timezone, dateSpotHint: u.primaryPet?.vision ? `spot.${u.primaryPet.vision.sunday.toLowerCase()}` : null };
  }
}
