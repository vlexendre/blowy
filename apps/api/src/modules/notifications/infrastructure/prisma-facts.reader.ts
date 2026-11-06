/**
 * Lecture seule (Prisma) des faits nécessaires aux notifications : sorties, places, duos, RDV,
 * conversations, pause, fiabilité. Aucun corps de message, aucun bulletin (seulement « en a-t-il un »
 * pour soi-même), aucune position, aucune intention.
 */
import type { Db } from '@blowy/database';
import { safeTz, zonedToUtc } from '../domain/time.js';
import type { ConversationFacts, DuoDateFacts, DuoFacts, NotificationFactsReader, OutingFacts, PersonFacts } from '../application/ports.js';

const VISIBLE = ['PUBLISHED', 'WARNED'] as const;
const PENDING = ['PENDING_MODERATION', 'HUMAN_REVIEW'] as const;

export class PrismaNotificationFactsReader implements NotificationFactsReader {
  constructor(private readonly db: Db) {}

  async outing(id: string): Promise<OutingFacts | null> {
    const o = await this.db.outing.findUnique({
      where: { id },
      include: { venue: { select: { name: true } }, neighborhood: { select: { timezone: true } }, seats: { select: { id: true, userId: true, status: true, acceptDeadline: true } } },
    });
    if (!o) return null;
    return {
      id: o.id,
      kind: o.kind,
      status: o.status,
      weekKey: o.weekKey,
      tz: safeTz(o.neighborhood.timezone),
      venueName: o.venue.name,
      startsAt: o.startsAt,
      acceptDeadline: o.acceptDeadline,
      lockAt: o.lockAt,
      photoRevealAt: o.photoRevealAt,
      checkinOpensAt: o.checkinOpensAt,
      checkinClosesAt: o.checkinClosesAt,
      votesCloseAt: o.votesCloseAt,
      votesClosedAt: o.votesClosedAt,
      seats: o.seats,
    };
  }

  async duo(id: string): Promise<DuoFacts | null> {
    const d = await this.db.duo.findUnique({ where: { id }, select: { id: true, status: true, userLowId: true, userHighId: true, exchangeEndsAt: true, dateDeadline: true } });
    return d ? { id: d.id, status: d.status, userIds: [d.userLowId, d.userHighId], exchangeEndsAt: d.exchangeEndsAt, dateDeadline: d.dateDeadline } : null;
  }

  async duoDate(id: string): Promise<DuoDateFacts | null> {
    const dd = await this.db.duoDate.findUnique({ where: { id }, include: { duo: { select: { userLowId: true, userHighId: true } }, venue: { select: { name: true, neighborhood: { select: { timezone: true } } } } } });
    if (!dd) return null;
    return {
      id: dd.id,
      duoId: dd.duoId,
      status: dd.status,
      startsAt: dd.startsAt,
      endsAt: dd.endsAt,
      votesCloseAt: dd.votesCloseAt,
      votesClosedAt: dd.votesClosedAt,
      tz: safeTz(dd.venue.neighborhood.timezone),
      venueName: dd.venue.name,
      proposedByUserId: dd.proposedByUserId,
      userIds: [dd.duo.userLowId, dd.duo.userHighId],
      checkedIn: [...(dd.checkinLowAt ? [dd.duo.userLowId] : []), ...(dd.checkinHighAt ? [dd.duo.userHighId] : [])],
    };
  }

  async people(ids: string[]): Promise<Map<string, PersonFacts>> {
    if (ids.length === 0) return new Map();
    const [users, pets] = await Promise.all([
      this.db.user.findMany({ where: { id: { in: ids } }, select: { id: true, timezone: true, profile: { select: { displayName: true } } } }),
      this.db.pet.findMany({ where: { primaryOwnerId: { in: ids } }, select: { primaryOwnerId: true, name: true } }),
    ]);
    const petOf = new Map(pets.map((p) => [p.primaryOwnerId!, p.name]));
    return new Map(users.map((u) => [u.id, { userId: u.id, firstName: u.profile?.displayName ?? '', petName: petOf.get(u.id) ?? null, tz: safeTz(u.timezone) }]));
  }

  async conversation(id: string): Promise<ConversationFacts | null> {
    const c = await this.db.conversation.findUnique({ where: { id }, select: { id: true, kind: true, outingId: true, closedAt: true, members: { select: { userId: true, revokedAt: true } } } });
    return c;
  }

  async messageAuthor(id: string) {
    return this.db.message.findUnique({ where: { id }, select: { conversationId: true, authorUserId: true, kind: true } });
  }

  async visibleMessageSince(conversationId: string, excludeUserId: string, since: Date): Promise<{ authorUserId: string } | 'PENDING' | null> {
    const base = { conversationId, kind: { not: 'SYSTEM' as const }, authorUserId: { not: excludeUserId }, createdAt: { gte: since } };
    const visible = await this.db.message.findFirst({ where: { ...base, status: { in: [...VISIBLE] } }, orderBy: { createdAt: 'desc' }, select: { authorUserId: true } });
    if (visible?.authorUserId) return { authorUserId: visible.authorUserId };
    const pending = await this.db.message.count({ where: { ...base, status: { in: [...PENDING] } } });
    return pending > 0 ? 'PENDING' : null;
  }

  async reveals(sourceKind: 'OUTING' | 'DUO_DATE', sourceId: string) {
    const rows = await this.db.connectionReveal.findMany({ where: { sourceKind, sourceId }, select: { userLowId: true, userHighId: true, result: true } });
    return rows.filter((r) => r.result === 'FRIEND' || r.result === 'PLUS').map((r) => ({ users: [r.userLowId, r.userHighId] as [string, string], result: r.result as 'FRIEND' | 'PLUS' }));
  }

  async hasBallot(outingId: string, userId: string): Promise<boolean> {
    return (await this.db.outingVote.count({ where: { outingId, voterUserId: userId } })) > 0;
  }

  async teamMembers(teamId: string): Promise<string[] | null> {
    const t = await this.db.team.findUnique({ where: { id: teamId }, select: { dissolvedAt: true, members: { where: { leftAt: null }, select: { userId: true } } } });
    return t && !t.dissolvedAt ? t.members.map((m) => m.userId) : null;
  }

  async reliabilityPausedUntil(userId: string): Promise<Date | null> {
    return (await this.db.reliabilityStat.findUnique({ where: { userId }, select: { pausedUntil: true } }))?.pausedUntil ?? null;
  }

  async seat(seatId: string) {
    return this.db.outingSeat.findUnique({ where: { id: seatId }, select: { outingId: true, userId: true } });
  }

  async hasOutingOnDay(userId: string, day: string, tz: string, _now: Date): Promise<boolean> {
    const [y, m, d] = day.split('-').map(Number) as [number, number, number];
    const from = zonedToUtc(y, m, d, 0, 0, tz);
    const to = new Date(from.getTime() + 24 * 3_600_000);
    const seats = await this.db.outingSeat.count({ where: { userId, status: { in: ['CONFIRMED', 'CHECKED_IN', 'ATTENDED'] }, outing: { startsAt: { gte: from, lt: to }, status: { not: 'CANCELLED' } } } });
    if (seats > 0) return true;
    const dates = await this.db.duoDate.count({ where: { status: { in: ['CONFIRMED', 'DONE'] }, startsAt: { gte: from, lt: to }, duo: { OR: [{ userLowId: userId }, { userHighId: userId }] } } });
    return dates > 0;
  }

  async pauseActive(userId: string, now: Date): Promise<boolean> {
    return (await this.db.pausePeriod.count({ where: { userId, contextId: null, endedAt: null, startsAt: { lte: now }, endsAt: { gt: now } } })) > 0;
  }

  async timezone(userId: string): Promise<string> {
    return safeTz((await this.db.user.findUnique({ where: { id: userId }, select: { timezone: true } }))?.timezone);
  }
}
