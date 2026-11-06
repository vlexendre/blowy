import { uuidv7, type Db, type Tx } from '@blowy/database';
import { ACTIVE_SEAT_STATUSES } from '@blowy/domain';
import { mondayOfWeek, wallToUtc, weekKeyOf } from '@blowy/pet-engine';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { NeighborhoodRow, NeighborhoodsRepository } from '../application/ports/neighborhoods.repository.js';

const ACTIVE = ACTIVE_SEAT_STATUSES as unknown as ('INVITED' | 'HELD' | 'CONFIRMED' | 'CHECKED_IN' | 'ATTENDED' | 'NO_SHOW')[];
const row = (n: NeighborhoodRow): NeighborhoodRow => ({ id: n.id, slug: n.slug, name: n.name, city: n.city, status: n.status, densityThreshold: n.densityThreshold, estimatedLaunchAt: n.estimatedLaunchAt, timezone: n.timezone, cityZoneId: n.cityZoneId });

export class PrismaNeighborhoodsRepository implements NeighborhoodsRepository {
  constructor(private readonly db: Db) {}
  private c(scope: TxScope | null): Tx | Db {
    return scope ? txOf(scope) : this.db;
  }

  async list() {
    return (await this.db.neighborhood.findMany({ orderBy: [{ city: 'asc' }, { name: 'asc' }] })).map(row);
  }

  async byId(scope: TxScope | null, id: string) {
    const n = await this.c(scope).neighborhood.findUnique({ where: { id } });
    return n ? row(n) : null;
  }

  async userState(scope: TxScope | null, userId: string, at: Date) {
    const c = this.c(scope);
    const u = await c.user.findUnique({ where: { id: userId }, select: { neighborhoodId: true, neighborhoodChangedAt: true } });
    if (!u) return null;
    const [verified, photo, seats] = await Promise.all([
      c.verificationSession.count({ where: { userId, status: 'VERIFIED', OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] } }),
      c.mediaAsset.count({ where: { ownerUserId: userId, purpose: 'PROFILE_PHOTO', status: 'READY' } }),
      c.outingSeat.count({ where: { userId, status: { in: ACTIVE.filter((s) => s !== 'ATTENDED' && s !== 'NO_SHOW') }, outing: { startsAt: { gt: at } } } }),
    ]);
    return { neighborhoodId: u.neighborhoodId, changedAt: u.neighborhoodChangedAt, verified: verified > 0, hasPhoto: photo > 0, hasActiveSeat: seats > 0 };
  }

  async verifiedWaiting(neighborhoodId: string, at: Date) {
    return this.db.user.count({
      where: { neighborhoodId, status: 'ACTIVE', deletedAt: null, onboardedAt: { not: null }, verificationSessions: { some: { status: 'VERIFIED', OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] } } },
    });
  }

  async setUserNeighborhood(scope: TxScope, userId: string, neighborhoodId: string, changed: boolean) {
    await txOf(scope).user.update({ where: { id: userId }, data: { neighborhoodId, ...(changed ? { neighborhoodChangedAt: scope.now } : {}), version: { increment: 1 } } });
  }

  async syncWaitlist(scope: TxScope, userId: string, n: NeighborhoodRow) {
    const tx = txOf(scope);
    if (n.status === 'LIVE') {
      await tx.waitlistEntry.deleteMany({ where: { userId } });
      return;
    }
    await tx.waitlistEntry.upsert({ where: { userId }, create: { userId, neighborhoodId: n.id, joinedAt: scope.now }, update: { neighborhoodId: n.id } });
  }

  async ensureAcceptable(scope: TxScope, userId: string, neighborhoodId: string) {
    await txOf(scope).userAcceptableNeighborhood.upsert({ where: { userId_neighborhoodId: { userId, neighborhoodId } }, create: { userId, neighborhoodId }, update: {} });
  }

  async slotDemand(userId: string, weekKey: string, at: Date) {
    const u = await this.db.user.findUnique({ where: { id: userId }, include: { neighborhood: true, acceptableNeighborhoods: true, slotAvailability: true } });
    if (!u?.neighborhood) return [];
    const nbIds = u.acceptableNeighborhoods.length ? u.acceptableNeighborhoods.map((a) => a.neighborhoodId) : [u.neighborhood.id];
    const templates = await this.db.neighborhoodSlotTemplate.findMany({ where: { neighborhoodId: { in: nbIds }, active: true, ...(u.slotAvailability.length ? { id: { in: u.slotAvailability.map((s) => s.slotTemplateId) } } : {}) } });
    const monday = mondayOfWeek(weekKey);
    const slots = templates.map((t) => new Date(wallToUtc(monday + t.isoWeekday - 1, t.localMinute, u.neighborhood!.timezone))).filter((d) => d > at);
    const out: { startsAt: Date; others: number }[] = [];
    for (const startsAt of slots) {
      const others = await this.db.outingRequest.count({
        where: { weekKey, status: 'OPEN', userId: { not: userId }, slotStartsAt: { has: startsAt }, neighborhood: { cityZoneId: u.neighborhood.cityZoneId }, user: { verificationSessions: { some: { status: 'VERIFIED', OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] } } } },
      });
      out.push({ startsAt, others });
    }
    return out;
  }

  async generateSlots(at: Date, weeksAhead: number, covered?: (timezone: string, startsAt: Date) => Promise<boolean>) {
    const nbs = await this.db.neighborhood.findMany({ where: { status: { in: ['LIVE', 'WAITLIST'] } }, include: { slotTemplates: { where: { active: true } }, venues: { where: { status: 'ACTIVE' } } } });
    const data: { id: string; venueId: string; startsAt: Date; activity: (typeof nbs)[number]['slotTemplates'][number]['activity']; capacityOutings: number }[] = [];
    const memo = new Map<string, boolean>();
    for (const n of nbs) {
      for (let w = 0; w <= weeksAhead; w++) {
        const monday = mondayOfWeek(weekKeyOf(at.getTime() + w * 7 * 86_400_000, n.timezone));
        for (const t of n.slotTemplates) {
          const startsAt = new Date(wallToUtc(monday + t.isoWeekday - 1, t.localMinute, n.timezone));
          if (startsAt <= at) continue;
          if (covered) {
            const k = `${n.timezone}|${startsAt.toISOString()}`;
            if (!memo.has(k)) memo.set(k, await covered(n.timezone, startsAt));
            // V5.6 (E12) : jamais un créneau hors des heures d'astreinte.
            if (!memo.get(k)) continue;
          }
          for (const v of n.venues.filter((x) => x.activities.includes(t.activity))) data.push({ id: uuidv7(at.getTime()), venueId: v.id, startsAt, activity: t.activity, capacityOutings: v.tablesPerSlot });
        }
      }
    }
    return data.length ? (await this.db.venueSlot.createMany({ data, skipDuplicates: true })).count : 0;
  }

  async watchCoverage(at: Date, horizonDays: number, covered: (timezone: string, startsAt: Date) => Promise<boolean>) {
    const slots = await this.db.venueSlot.findMany({
      where: { startsAt: { gt: at, lt: new Date(at.getTime() + horizonDays * 86_400_000) } },
      select: { id: true, startsAt: true, reservedOutings: true, venue: { select: { neighborhood: { select: { timezone: true } } } }, _count: { select: { outings: true } }, outings: { where: { status: { notIn: ['CANCELLED', 'DONE'] } }, select: { id: true } } },
    });
    let removed = 0;
    let escalated = 0;
    for (const s of slots) {
      if (await covered(s.venue.neighborhood.timezone, s.startsAt)) continue;
      if (s._count.outings === 0 && s.reservedOutings === 0) {
        removed += (await this.db.venueSlot.deleteMany({ where: { id: s.id, reservedOutings: 0, outings: { none: {} } } })).count;
        continue;
      }
      const already = await this.db.outboxEvent.count({ where: { topic: 'ops.oncall_coverage_lost', aggregateId: s.id } });
      if (already > 0) continue;
      await this.db.outboxEvent.create({ data: { id: uuidv7(at.getTime()), topic: 'ops.oncall_coverage_lost', aggregateType: 'VenueSlot', aggregateId: s.id, payload: { venueSlotId: s.id, startsAt: s.startsAt.toISOString(), outingIds: s.outings.map((o) => o.id) }, createdAt: at, availableAt: at } });
      escalated++;
    }
    return { removed, escalated };
  }
}
