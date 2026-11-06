/**
 * Adapters Prisma V5 du module admin (T6).
 *  - `PrismaOpsReadModel` : lectures d'exploitation (agrégats, prénoms ; jamais de vote, d'intention,
 *    de préférence, de position ni de montant) ;
 *  - `PrismaOpsConfigWriter` : configuration quartiers / lieux / créneaux (données de configuration
 *    sans invariant de jeu ; CONTOURNEMENT documenté en attendant un port `neighborhoods` de C) ;
 *  - `PrismaVenuePartnerStore` : événements du lieu partenaire sur la table append-only `DomainEvent`
 *    (`aggregateType = 'venue.partner'`, séquence par lieu, verrou du quartier tenu par l'appelant) —
 *    CONTOURNEMENT documenté : tables `VenuePartnerAccess` & co. proposées à C (spec §8.2) ;
 *  - `JournalVenueCompensationLedger` : compensations lieu lues dans le journal de G (lecture seule)
 *    et contre-écriture par la fonction exportée par G (`reverseVenueCompensation`).
 */
import { uuidv7, type Db } from '@blowy/database';
import { mondayOfWeek, wallToUtc, weekKeyOf } from '@blowy/pet-engine';
import type { AdminAttendanceView, AdminNeighborhoodRow, AdminOutingRow } from '@blowy/api-contract';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import { reverseVenueCompensation, venueCompensationView } from '../../economy/application/payments/payments.use-cases.js';
import type { EconomyJournal } from '../../economy/application/payments/ports.js';
import type { RosterOutingFacts, StoredVenueEvent, VenuePartnerEvent } from '../domain/venue-partner.js';
import type { OpsConfigWriter, OpsReadModel, OutingDetailFacts, VenueCompensationLedger, VenueFacts, VenuePartnerStore } from '../application/ports/ops.ports.js';

const DAY = 86_400_000;
const LIVE_SEAT = ['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN'] as const;
const CONFIRMED_LIKE = ['CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW'] as const;

type VenueRow = {
  id: string;
  name: string;
  neighborhoodId: string;
  status: VenueFacts['status'];
  activities: string[];
  tablesPerSlot: number;
  addressLine: string;
  postalCode: string;
  city: string;
  photoUrl: string | null;
  staffContact: string | null;
  checkinSecretRef: string;
  activityPriceCents: number | null;
  activityTaxBasis: 'TTC' | 'HT';
  neighborhood: { name: string; city: string; timezone: string };
};
const venueSelect = { id: true, name: true, neighborhoodId: true, status: true, activities: true, tablesPerSlot: true, addressLine: true, postalCode: true, city: true, photoUrl: true, staffContact: true, checkinSecretRef: true, activityPriceCents: true, activityTaxBasis: true, neighborhood: { select: { name: true, city: true, timezone: true } } } as const;
const venueFacts = (v: VenueRow): VenueFacts => ({
  id: v.id,
  name: v.name,
  neighborhoodId: v.neighborhoodId,
  neighborhoodName: v.neighborhood.name,
  city: v.neighborhood.city,
  timezone: v.neighborhood.timezone,
  status: v.status,
  activities: v.activities,
  tablesPerSlot: v.tablesPerSlot,
  addressLine: v.addressLine,
  postalCode: v.postalCode,
  venueCity: v.city,
  photoUrl: v.photoUrl,
  staffContact: v.staffContact,
  checkinSecretRef: v.checkinSecretRef,
  activityPriceCents: v.activityPriceCents,
  activityTaxBasis: v.activityTaxBasis,
});

const verifiedWhere = (at: Date) => ({ status: 'ACTIVE' as const, deletedAt: null, verificationSessions: { some: { status: 'VERIFIED' as const, OR: [{ expiresAt: null }, { expiresAt: { gt: at } }] } } });

export class PrismaOpsReadModel implements OpsReadModel {
  constructor(private readonly db: Db) {}

  async neighborhoods(targetSize: number, now: Date): Promise<AdminNeighborhoodRow[]> {
    const rows = await this.db.neighborhood.findMany({ orderBy: [{ city: 'asc' }, { name: 'asc' }], include: { slotTemplates: { orderBy: [{ isoWeekday: 'asc' }, { localMinute: 'asc' }] }, _count: { select: { venues: true } } } });
    const zones = [...new Set(rows.map((r) => r.cityZoneId))];
    const verifiedByZone = new Map<string, number>();
    for (const z of zones) verifiedByZone.set(z, await this.db.user.count({ where: { ...verifiedWhere(now), onboardedAt: { not: null }, neighborhood: { cityZoneId: z } } }));
    const templateIds = rows.flatMap((r) => r.slotTemplates.map((t) => t.id));
    const avail = templateIds.length
      ? await this.db.userSlotAvailability.groupBy({ by: ['slotTemplateId'], where: { slotTemplateId: { in: templateIds }, user: verifiedWhere(now) }, _count: { _all: true } })
      : [];
    const availBy = new Map(avail.map((a) => [a.slotTemplateId, a._count._all]));
    return rows.map((n) => ({
      id: n.id,
      slug: n.slug,
      name: n.name,
      city: n.city,
      timezone: n.timezone,
      status: n.status,
      estimatedLaunchAt: n.estimatedLaunchAt?.toISOString() ?? null,
      verifiedInCity: verifiedByZone.get(n.cityZoneId) ?? 0,
      venues: n._count.venues,
      slotTemplates: n.slotTemplates.map((t) => {
        const available = availBy.get(t.id) ?? 0;
        return { id: t.id, isoWeekday: t.isoWeekday, localMinute: t.localMinute, activity: t.activity, active: t.active, available, missing: Math.max(0, targetSize - available) };
      }),
    }));
  }

  async neighborhoodExists(id: string) {
    return this.db.neighborhood.findUnique({ where: { id }, select: { id: true, timezone: true } });
  }

  async venues() {
    const rows = await this.db.venue.findMany({ select: venueSelect, orderBy: [{ name: 'asc' }] });
    return rows.map((v) => venueFacts(v as VenueRow));
  }

  async venue(id: string) {
    const v = await this.db.venue.findUnique({ where: { id }, select: venueSelect });
    return v ? venueFacts(v as VenueRow) : null;
  }

  async templatesOf(neighborhoodId: string) {
    const ts = await this.db.neighborhoodSlotTemplate.findMany({ where: { neighborhoodId }, select: { isoWeekday: true, localMinute: true, activity: true, active: true } });
    return ts.map((t) => ({ ...t, activity: String(t.activity) }));
  }

  async upcomingSlots(venueId: string, from: Date, to: Date) {
    const rows = await this.db.venueSlot.findMany({ where: { venueId, startsAt: { gte: from, lt: to } }, orderBy: { startsAt: 'asc' } });
    return rows.map((r) => ({ id: r.id, startsAt: r.startsAt, activity: String(r.activity), capacity: r.capacityOutings, reserved: r.reservedOutings }));
  }

  private outingRow(o: { id: string; status: AdminOutingRow['status']; weekKey: string; startsAt: Date; lockAt: Date; activity: string; capacity: number; cancelReason: string | null; neighborhood: { name: string }; venue: { id: string; name: string }; seats: { status: string }[] }): AdminOutingRow {
    return {
      id: o.id,
      status: o.status,
      weekKey: o.weekKey,
      startsAt: o.startsAt.toISOString(),
      lockAt: o.lockAt.toISOString(),
      activity: o.activity,
      neighborhood: o.neighborhood.name,
      venue: o.venue,
      capacity: o.capacity,
      confirmed: o.seats.filter((s) => (CONFIRMED_LIKE as readonly string[]).includes(s.status)).length,
      invited: o.seats.filter((s) => s.status === 'INVITED' || s.status === 'HELD').length,
      cancelReason: o.cancelReason,
    };
  }

  async outings(q: { status?: string; weekKey?: string; limit: number }) {
    const rows = await this.db.outing.findMany({
      where: { ...(q.status ? { status: q.status as AdminOutingRow['status'] } : {}), ...(q.weekKey ? { weekKey: q.weekKey } : {}) },
      orderBy: [{ startsAt: 'desc' }, { id: 'asc' }],
      take: q.limit,
      select: { id: true, status: true, weekKey: true, startsAt: true, lockAt: true, activity: true, capacity: true, cancelReason: true, neighborhood: { select: { name: true } }, venue: { select: { id: true, name: true } }, seats: { select: { status: true } } },
    });
    return rows.map((o) => this.outingRow({ ...o, activity: String(o.activity), cancelReason: o.cancelReason ?? null }));
  }

  async outing(id: string): Promise<OutingDetailFacts | null> {
    const o = await this.db.outing.findUnique({
      where: { id },
      include: {
        neighborhood: { select: { name: true } },
        venue: { select: { id: true, name: true } },
        compositionRun: true,
        seats: { orderBy: { id: 'asc' }, include: { checkIn: { select: { seatId: true } }, knowsSomeone: { select: { status: true } }, dispute: { select: { status: true } }, user: { select: { profile: { select: { displayName: true } } } } } },
      },
    });
    if (!o) return null;
    const rel = await this.db.reliabilityStat.findMany({ where: { userId: { in: o.seats.map((s) => s.userId) } } });
    const relBy = new Map(rel.map((r) => [r.userId, { attended: r.attended, absences: r.noShows + r.lateCancels }]));
    const row = this.outingRow({ ...o, activity: String(o.activity), cancelReason: o.cancelReason ?? null, seats: o.seats });
    return {
      ...row,
      composedAt: o.composedAt.toISOString(),
      acceptDeadline: o.acceptDeadline.toISOString(),
      photoRevealAt: o.photoRevealAt.toISOString(),
      checkinOpensAt: o.checkinOpensAt.toISOString(),
      checkinClosesAt: o.checkinClosesAt.toISOString(),
      votesCloseAt: o.votesCloseAt.toISOString(),
      cancelledAt: o.cancelledAt?.toISOString() ?? null,
      seats: o.seats.map((s) => ({
        seatId: s.id,
        userId: s.userId,
        displayName: s.user.profile?.displayName ?? null,
        status: s.status,
        cancelKind: s.cancelKind,
        refundState: s.refundState,
        checkedIn: !!s.checkIn,
        reliability: relBy.get(s.userId) ?? null,
        knowsSomeone: s.knowsSomeone?.status ?? null,
        dispute: s.dispute?.status ?? null,
      })),
      composition: o.compositionRun ? { runId: o.compositionRun.id, kind: o.compositionRun.kind, algoVersion: o.compositionRun.algoVersion, tuningVersion: o.compositionRun.tuningVersion, stats: o.compositionRun.stats } : null,
    };
  }

  async knowsSomeoneQueue() {
    const rows = await this.db.knowsSomeoneRequest.findMany({ where: { status: { in: ['IN_REVIEW', 'SAFETY_REVIEW'] } }, orderBy: { createdAt: 'asc' }, take: 100, include: { seat: { select: { outingId: true, outing: { select: { startsAt: true } }, user: { select: { profile: { select: { displayName: true } } } } } } } });
    const targets = await this.displayNames(rows.map((r) => r.targetUserId));
    return rows.map((r) => ({
      seatId: r.seatId,
      outingId: r.seat.outingId,
      startsAt: r.seat.outing.startsAt.toISOString(),
      firstName: r.seat.user.profile?.displayName ?? '—',
      targetFirstName: targets.get(r.targetUserId) ?? '—',
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async attendance(now: Date, limit: number): Promise<AdminAttendanceView> {
    const since = new Date(now.getTime() - 90 * DAY);
    const seats = await this.db.outingSeat.findMany({
      where: { OR: [{ status: 'NO_SHOW' }, { status: 'CANCELLED', cancelKind: 'LATE' }], outing: { startsAt: { gte: since } } },
      orderBy: { id: 'desc' },
      take: limit,
      include: { outing: { select: { startsAt: true } }, dispute: true, user: { select: { profile: { select: { displayName: true } } } } },
    });
    const pauses = await this.db.reliabilityStat.findMany({ where: { pausedUntil: { gt: now } }, orderBy: { pausedUntil: 'asc' }, take: limit, include: { user: { select: { profile: { select: { displayName: true } } } } } });
    return {
      absences: seats.map((s) => ({
        seatId: s.id,
        outingId: s.outingId,
        userId: s.userId,
        firstName: s.user.profile?.displayName ?? '—',
        startsAt: s.outing.startsAt.toISOString(),
        kind: s.status === 'NO_SHOW' ? ('NO_SHOW' as const) : ('LATE_CANCEL' as const),
        dispute: s.dispute ? { id: s.dispute.id, status: s.dispute.status, note: s.dispute.note, createdAt: s.dispute.createdAt.toISOString() } : null,
      })),
      pauses: pauses.map((p) => ({ userId: p.userId, firstName: p.user.profile?.displayName ?? '—', pausedUntil: p.pausedUntil!.toISOString(), attended: p.attended, absences: p.noShows + p.lateCancels })),
    };
  }

  async venueOutings(venueId: string, from: Date, to: Date): Promise<RosterOutingFacts[]> {
    const rows = await this.db.outing.findMany({
      where: { venueId, startsAt: { gte: from, lt: to } },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: { id: true, status: true, startsAt: true, endsAt: true, lockAt: true, activity: true, seats: { orderBy: [{ id: 'asc' }], select: { status: true, teamId: true, user: { select: { profile: { select: { displayName: true } } } } } } },
    });
    const groups: RosterOutingFacts[] = rows.map((o) => ({ outingId: o.id, status: o.status, startsAt: o.startsAt, endsAt: o.endsAt, lockAt: o.lockAt, activity: String(o.activity), seats: o.seats.map((s) => ({ status: s.status, firstName: s.user.profile?.displayName ?? null, teamKey: s.teamId })) }));
    // V5.6 (E13) : tables de 2 (Duo) — dans l'effectif dès leur entrée (veille 18 h), prénoms seulement.
    const dates = await this.db.duoDate.findMany({
      where: { venueId, startsAt: { gte: from, lt: to }, status: { in: ['CONFIRMED', 'DONE', 'CANCELLED'] }, reservationLockedAt: { not: null } },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: { id: true, status: true, startsAt: true, endsAt: true, reservationLockedAt: true, checkinLowAt: true, checkinHighAt: true, duo: { select: { userLowId: true, userHighId: true } } },
    });
    const names = await this.displayNames(dates.flatMap((d) => [d.duo.userLowId, d.duo.userHighId]));
    const duoTables: RosterOutingFacts[] = dates.map((d) => ({
      outingId: d.id,
      kind: 'DUO' as const,
      status: d.status === 'CONFIRMED' ? 'CONFIRMED' : d.status === 'DONE' ? 'DONE' : 'CANCELLED',
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      lockAt: d.reservationLockedAt!,
      activity: 'DUO_TABLE',
      seats: [d.duo.userLowId, d.duo.userHighId].map((u) => ({ status: 'CONFIRMED', firstName: names.get(u) ?? null, teamKey: d.id })),
    }));
    return [...groups, ...duoTables].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.outingId.localeCompare(b.outingId));
  }

  async outingSummaries(venueId: string, period: string, timeZone = 'UTC') {
    const [y, m] = period.split('-').map(Number) as [number, number];
    // V5.7 (E28) : bornes du mois civil dans le fuseau du lieu.
    const from = new Date(wallToUtc(Date.UTC(y, m - 1, 1) / 86_400_000, 0, timeZone));
    const to = new Date(wallToUtc(Date.UTC(y, m, 1) / 86_400_000, 0, timeZone));
    const rows = await this.db.outing.findMany({
      where: { venueId, startsAt: { gte: from, lt: to }, OR: [{ status: { in: ['CONFIRMED', 'CHECKIN_OPEN', 'DONE'] } }, { status: 'CANCELLED', seats: { some: { confirmedAt: { not: null } } } }] },
      select: { id: true, startsAt: true, lockAt: true, status: true, seats: { select: { status: true, confirmedAt: true, cancelledAt: true } } },
    });
    const out = new Map<string, { startsAt: Date; reserved: number; attended: number; cancelled: boolean; duoTable?: boolean }>();
    for (const o of rows) {
      // Places de l'effectif envoyé au lieu à la confirmation : confirmées, et pas annulées avant la veille 18 h.
      const reserved = o.seats.filter((s) => s.confirmedAt && (!s.cancelledAt || s.cancelledAt >= o.lockAt)).length;
      out.set(o.id, { startsAt: o.startsAt, reserved, attended: o.seats.filter((s) => s.status === 'ATTENDED').length, cancelled: o.status === 'CANCELLED' });
    }
    // V5.6 (E13) : tables de 2 (Duo) entrées dans l'effectif — 2 places réservées.
    const dates = await this.db.duoDate.findMany({ where: { venueId, startsAt: { gte: from, lt: to }, reservationLockedAt: { not: null } }, select: { id: true, startsAt: true, status: true, checkinLowAt: true, checkinHighAt: true } });
    for (const d of dates) out.set(d.id, { startsAt: d.startsAt, reserved: 2, attended: Number(!!d.checkinLowAt) + Number(!!d.checkinHighAt), cancelled: false, duoTable: true });
    return out;
  }

  async outingsStart(ids: string[]) {
    const rows = ids.length ? await this.db.outing.findMany({ where: { id: { in: ids } }, select: { id: true, startsAt: true } }) : [];
    return new Map(rows.map((r) => [r.id, r.startsAt]));
  }

  async displayNames(userIds: string[]) {
    const rows = userIds.length ? await this.db.profile.findMany({ where: { userId: { in: [...new Set(userIds)] } }, select: { userId: true, displayName: true } }) : [];
    return new Map(rows.map((r) => [r.userId, r.displayName]));
  }

  async userIdByIdentity(provider: 'FIREBASE' | 'LOCAL', subject: string) {
    const i = await this.db.authIdentity.findUnique({ where: { provider_subject: { provider, subject } }, select: { userId: true } });
    return i?.userId ?? null;
  }

  async userStatus(userId: string) {
    const u = await this.db.user.findUnique({ where: { id: userId }, select: { status: true, profile: { select: { displayName: true } } } });
    return u ? { status: u.status, displayName: u.profile?.displayName ?? 'Partenaire' } : null;
  }

  async seatOfFirstName(venueId: string, outingId: string, firstName: string, at?: Date) {
    // V5.4 (C.12) : le lieu ne connaît les prénoms qu'à partir de la confirmation (veille 18 h) — avant, rien.
    const o = await this.db.outing.findFirst({ where: { id: outingId, venueId, ...(at ? { lockAt: { lte: at }, status: { not: 'CANCELLED' } } : {}) }, select: { seats: { where: { status: { in: [...CONFIRMED_LIKE] } }, select: { id: true, userId: true, user: { select: { profile: { select: { displayName: true } } } } } } } });
    const want = firstName.trim().toLocaleLowerCase('fr');
    const s = o?.seats.find((x) => (x.user.profile?.displayName ?? '').trim().split(/\s+/)[0]?.toLocaleLowerCase('fr') === want);
    return s ? { seatId: s.id, userId: s.userId } : null;
  }
}

// ------------------------------------------------------------------ configuration (quartiers, lieux, créneaux)
const localDateOfDay = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);

export class PrismaOpsConfigWriter implements OpsConfigWriter {
  constructor(private readonly db?: Db) {}

  private reader(): Db {
    if (!this.db) throw new Error('PrismaOpsConfigWriter : lecture sans base');
    return this.db;
  }

  async onCallShifts(q: { timezone?: string; from: Date; to: Date }) {
    return this.reader().safetyOnCallShift.findMany({ where: { ...(q.timezone ? { timezone: q.timezone } : {}), endsAt: { gt: q.from }, startsAt: { lt: q.to } }, orderBy: [{ timezone: 'asc' }, { startsAt: 'asc' }], select: { id: true, timezone: true, startsAt: true, endsAt: true, teamLabel: true, phoneRef: true } });
  }

  async createOnCallShift(scope: TxScope, s: { id: string; timezone: string; startsAt: Date; endsAt: Date; teamLabel: string; phoneRef: string | null }) {
    await txOf(scope).safetyOnCallShift.create({ data: { ...s, createdAt: scope.now } });
  }

  async deleteOnCallShift(scope: TxScope, id: string) {
    return (await txOf(scope).safetyOnCallShift.deleteMany({ where: { id } })).count > 0;
  }

  async publishedSlots(from: Date, to: Date, timezone?: string) {
    const rows = await this.reader().venueSlot.findMany({ where: { startsAt: { gte: from, lt: to }, ...(timezone ? { venue: { neighborhood: { timezone } } } : {}) }, orderBy: { startsAt: 'asc' }, take: 2000, select: { id: true, startsAt: true, venue: { select: { neighborhood: { select: { timezone: true } } } } } });
    return rows.map((r) => ({ venueSlotId: r.id, startsAt: r.startsAt, timezone: r.venue.neighborhood.timezone }));
  }

  async travelTimes(neighborhoodId: string) {
    return this.reader().neighborhoodTravelTime.findMany({ where: { OR: [{ fromNeighborhoodId: neighborhoodId }, { toNeighborhoodId: neighborhoodId }] }, orderBy: [{ fromNeighborhoodId: 'asc' }, { toNeighborhoodId: 'asc' }], select: { fromNeighborhoodId: true, toNeighborhoodId: true, minutes: true } });
  }

  async upsertTravelTime(scope: TxScope, t: { fromNeighborhoodId: string; toNeighborhoodId: string; minutes: number }) {
    await txOf(scope).neighborhoodTravelTime.upsert({ where: { fromNeighborhoodId_toNeighborhoodId: { fromNeighborhoodId: t.fromNeighborhoodId, toNeighborhoodId: t.toNeighborhoodId } }, create: { id: uuidv7(scope.now.getTime()), ...t, updatedAt: scope.now }, update: { minutes: t.minutes, updatedAt: scope.now } });
  }

  async welcomeOf(venueId: string) {
    const v = await this.reader().venue.findUnique({ where: { id: venueId }, select: { welcomeMessage: true, welcomeMessageUpdatedAt: true } });
    return { text: v?.welcomeMessage ?? null, updatedAt: v?.welcomeMessageUpdatedAt ?? null };
  }

  async setWelcome(scope: TxScope, venueId: string, text: string | null) {
    await txOf(scope).venue.update({ where: { id: venueId }, data: { welcomeMessage: text, welcomeMessageUpdatedAt: scope.now } });
  }

  async setNeighborhoodCenter(scope: TxScope, id: string, c: { lat: number; lng: number }) {
    await txOf(scope).neighborhood.update({ where: { id }, data: { centerLat: c.lat, centerLng: c.lng } });
  }

  async neighborhoodExists(id: string) {
    return (await this.reader().neighborhood.count({ where: { id } })) > 0;
  }

  async setNeighborhoodStatus(scope: TxScope, id: string, status: 'LIVE' | 'WAITLIST' | 'PAUSED' | 'CLOSED', estimatedLaunchAt: Date | null | undefined) {
    const tx = txOf(scope);
    const cur = await tx.neighborhood.findUniqueOrThrow({ where: { id }, select: { status: true, launchedAt: true } });
    await tx.neighborhood.update({
      where: { id },
      data: {
        status,
        ...(estimatedLaunchAt !== undefined ? { estimatedLaunchAt } : {}),
        ...(status === 'LIVE' && !cur.launchedAt ? { launchedAt: scope.now } : {}),
        ...(status === 'PAUSED' ? { pausedAt: scope.now } : {}),
        version: { increment: 1 },
      },
    });
  }

  async upsertTemplate(scope: TxScope, neighborhoodId: string, t: { isoWeekday: number; localMinute: number; activity: string; active: boolean }) {
    const tx = txOf(scope);
    const r = await tx.neighborhoodSlotTemplate.upsert({
      where: { neighborhoodId_isoWeekday_localMinute: { neighborhoodId, isoWeekday: t.isoWeekday, localMinute: t.localMinute } },
      create: { neighborhoodId, isoWeekday: t.isoWeekday, localMinute: t.localMinute, activity: t.activity as never, active: t.active, createdAt: scope.now },
      update: { activity: t.activity as never, active: t.active },
    });
    return r.id;
  }

  async createVenue(scope: TxScope, v: { id: string; neighborhoodId: string; name: string; addressLine: string; postalCode: string; city: string; lat: number; lng: number; activities: string[]; tablesPerSlot: number; checkinSecretRef: string }) {
    await txOf(scope).venue.create({ data: { ...v, activities: v.activities as never, offerKey: 'venue.offer.table_reserved', accessibilityTags: [], createdAt: scope.now } });
  }

  async updateVenue(scope: TxScope, id: string, patch: Record<string, unknown>) {
    await txOf(scope).venue.update({ where: { id }, data: patch as never });
  }

  async applySlotPolicy(scope: TxScope, venueId: string, from: Date, to: Date, capacityFor: Parameters<OpsConfigWriter['applySlotPolicy']>[4]) {
    const tx = txOf(scope);
    const v = await tx.venue.findUniqueOrThrow({ where: { id: venueId }, select: { id: true, activities: true, status: true, neighborhood: { select: { id: true, timezone: true, slotTemplates: { where: { active: true } } } } } });
    const tz = v.neighborhood.timezone;
    const existing = await tx.venueSlot.findMany({ where: { venueId, startsAt: { gte: from, lt: to } } });
    const byStart = new Map(existing.map((s) => [s.startsAt.getTime(), s]));
    let changed = 0;
    const firstMonday = mondayOfWeek(weekKeyOf(from.getTime(), tz));
    const lastMonday = mondayOfWeek(weekKeyOf(to.getTime(), tz));
    for (let monday = firstMonday; monday <= lastMonday; monday += 7) {
      for (const t of v.neighborhood.slotTemplates) {
        if (!v.activities.includes(t.activity)) continue;
        const day = monday + t.isoWeekday - 1;
        const startsAt = new Date(wallToUtc(day, t.localMinute, tz));
        if (startsAt < from || startsAt >= to) continue;
        const cur = byStart.get(startsAt.getTime());
        const next = capacityFor({ startsAt, isoWeekday: t.isoWeekday, localDate: localDateOfDay(day), capacity: cur?.capacityOutings ?? 0, reserved: cur?.reservedOutings ?? 0, exists: !!cur });
        if (next === null) continue;
        if (cur) {
          if (cur.capacityOutings !== next) {
            await tx.venueSlot.update({ where: { id: cur.id }, data: { capacityOutings: Math.max(cur.reservedOutings, next) } });
            changed += 1;
          }
        } else if (v.status === 'ACTIVE') {
          await tx.venueSlot.create({ data: { id: uuidv7(scope.now.getTime()), venueId, startsAt, activity: t.activity, capacityOutings: next, reservedOutings: 0, createdAt: scope.now } });
          changed += 1;
        }
      }
    }
    return { changed };
  }

  async activeOutingsOn(scope: TxScope, venueId: string, localDate: string) {
    const tx = txOf(scope);
    const v = await tx.venue.findUniqueOrThrow({ where: { id: venueId }, select: { neighborhood: { select: { timezone: true } } } });
    const [y, m, d] = localDate.split('-').map(Number) as [number, number, number];
    const day = Math.floor(Date.UTC(y, m - 1, d) / DAY);
    const from = new Date(wallToUtc(day, 0, v.neighborhood.timezone));
    const to = new Date(wallToUtc(day + 1, 0, v.neighborhood.timezone));
    const rows = await tx.outing.findMany({ where: { venueId, startsAt: { gte: from, lt: to }, status: { in: ['PROPOSED', 'FORMING', 'CONFIRMED', 'CHECKIN_OPEN'] } }, select: { id: true, status: true, startsAt: true } });
    return rows;
  }
}

// ------------------------------------------------------------------ magasin d'événements du lieu
/**
 * V5.6 (E19) : journal append-only dédié `VenuePartnerEvent` + projections relationnelles écrites dans la
 * MÊME transaction (`VenuePartnerAccess`, `VenueWeekday`, `VenueClosure`, `VenueIncident`, contrat sur `Venue`,
 * `VenuePartnerMfa`). Les anciens événements `DomainEvent` (aggregateType `venue.partner*`) ont été recopiés
 * par la migration `20261107120100_v5_6` et ne sont plus lus.
 */
/** @deprecated V5.6 (E19) : ancien stockage provisoire, recopié par la migration. */
export const VENUE_PARTNER_AGGREGATE = 'venue.partner';
/** @deprecated V5.6 (E19). */
export const VENUE_PARTNER_USER_AGGREGATE = 'venue.partner_user';

type EvRow = { seq: number; occurredAt: Date; type: string; payload: unknown };
const toStored = (r: EvRow): StoredVenueEvent => ({ seq: r.seq, at: r.occurredAt, event: { ...(r.payload as object), type: r.type } as VenuePartnerEvent });

export class PrismaVenuePartnerStore implements VenuePartnerStore {
  constructor(private readonly db: Db) {}

  async load(scope: TxScope | null, venueId: string) {
    const c = scope ? txOf(scope) : this.db;
    const rows = await c.venuePartnerEvent.findMany({ where: { venueId }, orderBy: { seq: 'asc' }, select: { seq: true, occurredAt: true, type: true, payload: true } });
    return rows.map(toStored);
  }

  /** L'appelant tient le verrou du quartier du lieu : la séquence est sérialisée ; l'unicité (venueId, seq) la garantit. */
  async append(scope: TxScope, venueId: string, event: VenuePartnerEvent, actorUserId: string | null) {
    const tx = txOf(scope);
    const last = await tx.venuePartnerEvent.findFirst({ where: { venueId }, orderBy: { seq: 'desc' }, select: { seq: true } });
    const seq = (last?.seq ?? 0) + 1;
    const { type, ...payload } = event;
    await tx.venuePartnerEvent.create({ data: { id: uuidv7(scope.now.getTime()), venueId, seq, type, actorUserId, payload: payload as never, occurredAt: scope.now } });
    await this.project(scope, venueId, event);
    return seq;
  }

  /** Projections (même transaction que l'événement). */
  private async project(scope: TxScope, venueId: string, e: VenuePartnerEvent) {
    const tx = txOf(scope);
    const now = scope.now;
    switch (e.type) {
      case 'ACCESS_GRANTED':
        await tx.venuePartnerAccess.upsert({ where: { venueId_userId: { venueId, userId: e.userId } }, create: { venueId, userId: e.userId, grantedAt: now }, update: { grantedAt: now, revokedAt: null } });
        break;
      case 'ACCESS_REVOKED':
        await tx.venuePartnerAccess.updateMany({ where: { venueId, userId: e.userId }, data: { revokedAt: now } });
        break;
      case 'CONTRACT_SIGNED':
        await tx.venue.update({ where: { id: venueId }, data: { contractVersion: e.version, contractSignedAt: now, contractSignerName: e.signerName, blowySignedAt: null, blowySignerName: null } });
        break;
      case 'DAY_SET':
        await tx.venueWeekday.upsert({ where: { venueId_isoWeekday: { venueId, isoWeekday: e.isoWeekday } }, create: { venueId, isoWeekday: e.isoWeekday, open: e.open, tables: e.tables, note: e.note, updatedAt: now }, update: { open: e.open, tables: e.tables, note: e.note, updatedAt: now } });
        break;
      case 'CLOSURE_ADDED':
        await tx.venueClosure.create({ data: { id: uuidv7(now.getTime()), venueId, date: e.date, note: e.note, createdAt: now } });
        break;
      case 'INCIDENT_REPORTED':
        await tx.venueIncident.create({ data: { id: e.id, venueId, outingId: e.outingId, firstName: e.firstName, motive: e.motive, note: e.note, seatId: e.seatId ?? null, userId: e.userId ?? null, createdAt: now } });
        break;
      case 'PHOTO_CHANGE_REQUESTED':
        break;
    }
  }

  async venuesOf(userId: string) {
    const rows = await this.db.venuePartnerAccess.findMany({ where: { userId, revokedAt: null }, orderBy: { venueId: 'asc' }, select: { venueId: true } });
    return rows.map((r) => r.venueId);
  }

  async incidents() {
    const rows = await this.db.venueIncident.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return rows.map((r) => ({
      venueId: r.venueId,
      at: r.createdAt,
      event: { type: 'INCIDENT_REPORTED' as const, id: r.id, outingId: r.outingId, firstName: r.firstName, motive: r.motive as Extract<VenuePartnerEvent, { type: 'INCIDENT_REPORTED' }>['motive'], note: r.note, ...(r.seatId ? { seatId: r.seatId } : {}), ...(r.userId ? { userId: r.userId } : {}) },
    }));
  }

  async partnerMfa(userId: string) {
    const r = await this.db.venuePartnerMfa.findUnique({ where: { userId } });
    return { generation: r?.generation ?? 0, enrolled: !!r?.enrolledAt };
  }

  async startPartnerEnrollment(scope: TxScope, userId: string) {
    await scope.lock.users([userId]);
    const r = await txOf(scope).venuePartnerMfa.upsert({ where: { userId }, create: { userId, generation: 1, enrolledAt: null, updatedAt: scope.now }, update: { generation: { increment: 1 }, enrolledAt: null, updatedAt: scope.now } });
    return r.generation;
  }

  async confirmPartnerEnrollment(scope: TxScope, userId: string) {
    await txOf(scope).venuePartnerMfa.update({ where: { userId }, data: { enrolledAt: scope.now, updatedAt: scope.now } });
  }

  /** V5.6 (E15) : contre-signature Blowy du contrat bilatéral (staff). */
  async countersign(scope: TxScope, venueId: string, signerName: string) {
    const v = await txOf(scope).venue.findUnique({ where: { id: venueId }, select: { contractVersion: true, contractSignedAt: true } });
    if (!v?.contractSignedAt || !v.contractVersion) return null;
    await txOf(scope).venue.update({ where: { id: venueId }, data: { blowySignedAt: scope.now, blowySignerName: signerName } });
    return { version: v.contractVersion, venueSignedAt: v.contractSignedAt, blowySignedAt: scope.now };
  }

  async contractOf(venueId: string) {
    const v = await this.db.venue.findUnique({ where: { id: venueId }, select: { contractVersion: true, contractSignedAt: true, contractSignerName: true, blowySignedAt: true, blowySignerName: true, ambiance: true } });
    return v ?? null;
  }
}

// ------------------------------------------------------------------ compensations (journal de G)
export class JournalVenueCompensationLedger implements VenueCompensationLedger {
  constructor(private readonly journal: EconomyJournal) {}

  async forVenue(venueId: string) {
    const rows = await this.journal.forAccount(`venue:${venueId}`, ['VENUE_COMPENSATION', 'VENUE_COMPENSATION_REVERSAL'], 2000);
    return rows.map((e) => {
      const v = venueCompensationView(e);
      return { seatId: v.seatId, outingId: v.outingId, venueId: v.venueId, amountCents: v.amountCents, cause: v.cause, basis: v.basis, at: e.at };
    });
  }

  reverse(scope: TxScope, seatId: string) {
    return reverseVenueCompensation(this.journal, scope, seatId);
  }

  async activitiesForVenue(venueId: string) {
    const rows = await this.journal.forAccount(`venue:${venueId}`, ['VENUE_ACTIVITY_PAYOUT'], 2000);
    return rows.map((e) => ({ seatId: String(e.refs.seatId), outingId: String(e.refs.outingId), amountCents: e.amount, taxBasis: e.refs.taxBasis === 'HT' ? ('HT' as const) : ('TTC' as const), at: e.at }));
  }
}

export { LIVE_SEAT };
