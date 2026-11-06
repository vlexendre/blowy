/**
 * Cas d'usage du back-office V5 (spec-v5 §10.1, T6) : villes et quartiers, lieux et créneaux,
 * sorties (état, effectif, annulation avec remboursement), présences / pauses / contestations,
 * « je connais quelqu'un », sécurité (besoin d'aide), signalements V5, compensations lieu.
 *
 * Chaque mutation : `AdminCommandRunner.run` → permission serveur → step-up si sensible →
 * CommandBus (idempotence, transaction) → AuditLog dans la MÊME transaction. Les décisions de E
 * (« je connais quelqu'un », alertes) passent par ses ports (`delegate`, audit après succès).
 * Aucune vue ne contient de vote, de préférence, d'intention, de `friendsOnly` individuel ni de
 * montant de paiement pour `ops` ; la position (besoin d'aide) n'est lisible que par trust_lead,
 * avec une justification écrite, auditée.
 */
import type {
  AdminAttendanceView,
  AdminKnowsSomeoneRow,
  AdminNeighborhoodRow,
  AdminOutingDetail,
  AdminOutingRow,
  AdminReportsV5View,
  AdminSafetyAlertDetail,
  AdminSafetyAlertRow,
  AdminVenueCompensationView,
  AdminVenueDetail,
  AdminVenueIncident,
  AdminVenueRow,
} from '@blowy/api-contract';
import { REPORT_CATEGORIES_V5_ADMIN } from '@blowy/api-contract';
import type { Tuning } from '@blowy/tuning';
import type { Clock, RandomSource } from '../../../../shared/application/clock.js';
import type { OutingAdminPort } from '../../../../shared/application/ports/outing-admin.port.js';
import type { UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../../shared/domain/errors.js';
import { can } from '../../domain/permissions.js';
import { firstNameOnly, periodOf, reduceVenuePartner, VENUE_INCIDENT_SLA_MINUTES, weeklySchedule } from '../../domain/venue-partner.js';
import { authorize, type AdminActor, type AdminCommandRunner } from '../admin-command.js';
import type { AdminTrustPort } from '../ports/admin.ports.js';
import type { OpsConfigWriter, OpsReadModel, VenueCompensationLedger, VenueFacts, VenuePartnerStore, VenueSessionRepository } from '../ports/ops.ports.js';
import { toStaffActor } from './backoffice.use-cases.js';
import { applyVenuePolicy } from './venue-partner.use-cases.js';

const notWired = (what: string) => new AppError('NOT_CONFIGURED', `${what} : service non branché`, { detailsSafe: { reason: 'SERVICE_NOT_WIRED', service: what } });
const MIN = 60_000;
const DAY = 86_400_000;

/** Agrégats numériques du rapport de composition (jamais de détail par personne). */
export function compositionAggregates(stats: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return out;
  for (const [k, v] of Object.entries(stats as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v ? 1 : 0;
  }
  return out;
}

export class OpsV5UseCases {
  constructor(
    private readonly reads: OpsReadModel,
    private readonly writer: OpsConfigWriter,
    private readonly store: VenuePartnerStore,
    private readonly sessions: VenueSessionRepository,
    private readonly ledger: VenueCompensationLedger | null,
    private readonly outingPort: OutingAdminPort | null,
    private readonly trust: AdminTrustPort | null,
    private readonly runner: AdminCommandRunner,
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly tuning: Tuning,
  ) {}

  private port(): OutingAdminPort {
    if (!this.outingPort) throw notWired('Sorties');
    return this.outingPort;
  }
  private tr(): AdminTrustPort {
    if (!this.trust) throw notWired('Confiance / sécurité');
    return this.trust;
  }

  // ------------------------------------------------------------------ villes et quartiers
  neighborhoods(a: AdminActor): Promise<AdminNeighborhoodRow[]> {
    authorize(a, 'neighborhoods.read');
    return this.reads.neighborhoods(this.tuning.outings.composition.targetSize, this.clock.now());
  }

  async setNeighborhoodStatus(a: AdminActor, id: string, b: { status: 'LIVE' | 'WAITLIST' | 'PAUSED' | 'CLOSED'; estimatedLaunchAt?: string | null; reason: string }, commandId: string) {
    if (!(await this.reads.neighborhoodExists(id))) throw Errors.notFound('Quartier');
    return this.runner.run(a, {
      permission: 'neighborhoods.write',
      operation: 'neighborhood.status',
      commandId,
      payload: { id, status: b.status, estimatedLaunchAt: b.estimatedLaunchAt ?? null },
      reason: b.reason,
      target: { type: 'Neighborhood', id },
      handle: async (scope) => {
        await scope.lock.neighborhoods([id]);
        await this.writer.setNeighborhoodStatus(scope, id, b.status, b.estimatedLaunchAt === undefined ? undefined : b.estimatedLaunchAt ? new Date(b.estimatedLaunchAt) : null);
        return { result: { id, status: b.status }, auditData: { status: b.status } };
      },
    });
  }

  async upsertTemplate(a: AdminActor, neighborhoodId: string, b: { isoWeekday: number; localMinute: number; activity: string; active: boolean; reason: string }, commandId: string) {
    if (!(await this.reads.neighborhoodExists(neighborhoodId))) throw Errors.notFound('Quartier');
    const { reason, ...t } = b;
    return this.runner.run(a, {
      permission: 'neighborhoods.write',
      operation: 'neighborhood.slot_template',
      commandId,
      payload: { neighborhoodId, ...t },
      reason,
      target: { type: 'Neighborhood', id: neighborhoodId },
      handle: async (scope) => {
        await scope.lock.neighborhoods([neighborhoodId]);
        const id = await this.writer.upsertTemplate(scope, neighborhoodId, t);
        return { result: { id }, auditData: t };
      },
    });
  }

  // ------------------------------------------------------------------ lieux
  private async venueRow(v: VenueFacts): Promise<AdminVenueRow & { state: ReturnType<typeof reduceVenuePartner> }> {
    const state = reduceVenuePartner(await this.store.load(null, v.id));
    return {
      id: v.id,
      name: v.name,
      neighborhood: { id: v.neighborhoodId, name: v.neighborhoodName, city: v.city },
      status: v.status,
      activities: v.activities as AdminVenueRow['activities'],
      tablesPerSlot: v.tablesPerSlot,
      address: `${v.addressLine}, ${v.postalCode} ${v.venueCity}`,
      contract: state.contract ? { version: state.contract.version, signedAt: state.contract.signedAt.toISOString(), signerName: state.contract.signerName } : null,
      partners: state.partners.size,
      state,
    };
  }

  async venues(a: AdminActor): Promise<AdminVenueRow[]> {
    authorize(a, 'venues.read');
    const rows = await Promise.all((await this.reads.venues()).map((v) => this.venueRow(v)));
    return rows.map(({ state: _s, ...r }) => r);
  }

  private incidentView(venueId: string, venueName: string, i: { id: string; outingId: string; firstName: string; motive: AdminVenueIncident['motive']; note: string; at: Date }, now: Date): AdminVenueIncident {
    const due = new Date(i.at.getTime() + VENUE_INCIDENT_SLA_MINUTES * MIN);
    return { id: i.id, venueId, venueName, outingId: i.outingId, firstName: i.firstName, motive: i.motive, note: i.note, createdAt: i.at.toISOString(), dueAt: due.toISOString(), overdue: due < now };
  }

  async venue(a: AdminActor, id: string): Promise<AdminVenueDetail> {
    authorize(a, 'venues.read');
    const v = await this.reads.venue(id);
    if (!v) throw Errors.notFound('Lieu');
    const { state, ...row } = await this.venueRow(v);
    const now = this.clock.now();
    const [templates, slots, names] = await Promise.all([this.reads.templatesOf(v.neighborhoodId), this.reads.upcomingSlots(v.id, now, new Date(now.getTime() + 21 * DAY)), this.reads.displayNames([...state.partners])]);
    return {
      ...row,
      addressLine: v.addressLine,
      postalCode: v.postalCode,
      city: v.venueCity,
      photoUrl: v.photoUrl,
      staffContact: v.staffContact,
      partnerAccounts: [...state.partners].map((userId) => ({ userId, displayName: names.get(userId) ?? '—' })),
      schedule: weeklySchedule(templates, v.activities, state, v.tablesPerSlot, this.tuning.outings.durationMinutes),
      closures: state.closures.map((c) => ({ date: c.date, note: c.note, at: c.at.toISOString() })),
      upcomingSlots: slots.map((s) => ({ id: s.id, startsAt: s.startsAt.toISOString(), activity: s.activity, capacity: s.capacity, reserved: s.reserved })),
      incidents: state.incidents.map((i) => this.incidentView(v.id, v.name, i, now)).reverse(),
      photoRequests: state.photoRequests.map((p) => ({ at: p.at.toISOString(), note: p.note })),
    };
  }

  async createVenue(a: AdminActor, b: { neighborhoodId: string; name: string; addressLine: string; postalCode: string; city: string; lat: number; lng: number; activities: string[]; tablesPerSlot: number; reason: string }, commandId: string) {
    if (!(await this.reads.neighborhoodExists(b.neighborhoodId))) throw Errors.notFound('Quartier');
    const { reason, ...data } = b;
    const id = this.random.uuid();
    return this.runner.run(a, {
      permission: 'venues.write',
      operation: 'venue.create',
      commandId,
      // Coordonnées hors du payload mémorisé / de l'audit : seules les données de fiche y figurent.
      payload: { name: data.name, neighborhoodId: data.neighborhoodId, activities: data.activities, tablesPerSlot: data.tablesPerSlot },
      reason,
      target: { type: 'Venue', id },
      handle: async (scope) => {
        await this.writer.createVenue(scope, { id, ...data, checkinSecretRef: `venue-${this.random.hex(16)}` });
        return { result: { id }, auditData: { name: data.name } };
      },
    });
  }

  async updateVenue(a: AdminActor, id: string, b: Record<string, unknown> & { reason: string }, commandId: string) {
    const v = await this.reads.venue(id);
    if (!v) throw Errors.notFound('Lieu');
    const { reason, ...patch } = b;
    return this.runner.run(a, {
      permission: 'venues.write',
      operation: 'venue.update',
      commandId,
      payload: { id, ...patch },
      reason,
      target: { type: 'Venue', id },
      handle: async (scope) => {
        await this.writer.updateVenue(scope, id, patch);
        if (typeof patch.tablesPerSlot === 'number') await applyVenuePolicy(this.writer, scope, id, reduceVenuePartner(await this.store.load(scope, id)), patch.tablesPerSlot);
        return { result: { id }, auditData: { fields: Object.keys(patch) } };
      },
    });
  }

  async rotateSecret(a: AdminActor, id: string, reason: string, commandId: string) {
    if (!(await this.reads.venue(id))) throw Errors.notFound('Lieu');
    return this.runner.run(a, {
      permission: 'venues.secret_rotate',
      operation: 'venue.secret_rotate',
      commandId,
      payload: { id },
      reason,
      target: { type: 'Venue', id },
      handle: async (scope) => {
        // Nouvelle référence : le secret (HMAC serveur) change, l'ancien code du chevalet ne vaut plus rien.
        await this.writer.updateVenue(scope, id, { checkinSecretRef: `venue-${this.random.hex(16)}` });
        return { result: { id, rotated: true } };
      },
    });
  }

  async partnerAccess(a: AdminActor, venueId: string, b: { provider: 'firebase' | 'local'; subject: string; grant: boolean; reason: string }, commandId: string) {
    if (!(await this.reads.venue(venueId))) throw Errors.notFound('Lieu');
    const userId = await this.reads.userIdByIdentity(b.provider === 'firebase' ? 'FIREBASE' : 'LOCAL', b.subject);
    // Le compte doit exister (première connexion faite) ; aucune création implicite.
    if (!userId) throw Errors.precondition('PARTNER_ACCOUNT_NOT_FOUND');
    return this.runner.run(a, {
      permission: 'venues.partner_access',
      operation: b.grant ? 'venue.partner_granted' : 'venue.partner_revoked',
      commandId,
      payload: { venueId, userId, grant: b.grant },
      reason: b.reason,
      target: { type: 'Venue', id: venueId },
      handle: async (scope) => {
        const state = reduceVenuePartner(await this.store.load(scope, venueId));
        let changed = false;
        if (b.grant && !state.partners.has(userId)) {
          await this.store.append(scope, venueId, { type: 'ACCESS_GRANTED', userId }, a.userId);
          changed = true;
        }
        if (!b.grant && state.partners.has(userId)) {
          await this.store.append(scope, venueId, { type: 'ACCESS_REVOKED', userId }, a.userId);
          // Sessions du lieu révoquées immédiatement (l'accès est relu à chaque requête de toute façon).
          await this.sessions.revokeAllFor(scope, userId, scope.now);
          changed = true;
        }
        return { result: { userId, granted: b.grant, changed }, auditData: { partnerUserId: userId } };
      },
    });
  }

  // ------------------------------------------------------------------ sorties
  outings(a: AdminActor, q: { status?: string; weekKey?: string; limit: number }): Promise<AdminOutingRow[]> {
    authorize(a, 'outings.read');
    return this.reads.outings(q);
  }

  async outing(a: AdminActor, id: string): Promise<AdminOutingDetail> {
    authorize(a, 'outings.read');
    const o = await this.reads.outing(id);
    if (!o) throw Errors.notFound('Sortie');
    const money = can(a.roles, 'economy.read');
    const { seats, composition, composedAt, acceptDeadline, photoRevealAt, checkinOpensAt, checkinClosesAt, votesCloseAt, cancelledAt, ...row } = o;
    const timeline = [
      { key: 'composed', at: composedAt, label: 'Composée' },
      { key: 'accept', at: acceptDeadline, label: 'Fin de l’invitation' },
      { key: 'lock', at: row.lockAt, label: 'Confirmation (effectif envoyé au lieu)' },
      { key: 'faces', at: photoRevealAt, label: 'Visages' },
      { key: 'checkin', at: checkinOpensAt, label: 'Check-in ouvert' },
      { key: 'start', at: row.startsAt, label: 'Début' },
      { key: 'checkinEnd', at: checkinClosesAt, label: 'Fin du check-in' },
      { key: 'votes', at: votesCloseAt, label: 'Clôture du vote' },
      ...(cancelledAt ? [{ key: 'cancelled', at: cancelledAt, label: `Annulée (${row.cancelReason ?? '—'})` }] : []),
    ].sort((x, y) => x.at.localeCompare(y.at));
    return {
      ...row,
      timeline,
      seats: seats.map((s) => ({
        seatId: s.seatId,
        userId: s.userId,
        firstName: firstNameOnly(s.displayName),
        status: s.status,
        cancelKind: s.cancelKind,
        checkedIn: s.checkedIn,
        reliability: s.reliability ? (s.reliability.attended + s.reliability.absences === 0 ? 'Nouvelle·au' : `venu·e à ${s.reliability.attended} sur ${s.reliability.attended + s.reliability.absences}`) : 'Nouvelle·au',
        knowsSomeone: s.knowsSomeone,
        dispute: s.dispute,
        ...(money ? { refundState: s.refundState } : {}),
      })),
      composition: composition ? { runId: composition.runId, kind: composition.kind, algoVersion: composition.algoVersion, tuningVersion: composition.tuningVersion, aggregates: compositionAggregates(composition.stats) } : null,
    };
  }

  cancelOuting(a: AdminActor, id: string, b: { kind: 'STAFF' | 'VENUE_UNAVAILABLE'; reason: string }, commandId: string) {
    return this.runner.run(a, {
      permission: 'outings.cancel',
      operation: 'outing.cancel',
      commandId,
      payload: { id, kind: b.kind },
      reason: b.reason,
      target: { type: 'Outing', id },
      handle: async (scope) => {
        const r = await this.port().cancelOuting(scope, { outingId: id, reason: b.kind });
        if (!r) throw Errors.precondition('OUTING_NOT_CANCELLABLE');
        return { result: { id, status: 'CANCELLED', affectedSeats: r.affectedSeats }, auditData: { kind: b.kind, affectedSeats: r.affectedSeats } };
      },
    });
  }

  removeSeat(a: AdminActor, seatId: string, reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'outings.seat_remove',
      operation: 'outing.seat_remove',
      commandId,
      payload: { seatId },
      reason,
      target: { type: 'OutingSeat', id: seatId },
      handle: async (scope) => {
        const r = await this.port().removeSeat(scope, { seatId });
        if (!r) throw Errors.precondition('SEAT_NOT_ACTIVE');
        return { result: { seatId, outingId: r.outingId, status: 'CANCELLED' }, auditData: { outingId: r.outingId } };
      },
    });
  }

  // ------------------------------------------------------------------ « je connais quelqu'un »
  async knowsSomeone(a: AdminActor): Promise<AdminKnowsSomeoneRow[]> {
    authorize(a, 'knows_someone.read');
    const now = this.clock.now();
    return (await this.reads.knowsSomeoneQueue()).map((r) => {
      const due = new Date(new Date(r.createdAt).getTime() + 60 * MIN);
      return { ...r, firstName: firstNameOnly(r.firstName), targetFirstName: firstNameOnly(r.targetFirstName), dueAt: due.toISOString(), overdue: due < now };
    });
  }

  decideKnowsSomeone(a: AdminActor, seatId: string, b: { accept: boolean; reason: string }, commandId: string) {
    return this.runner.delegate(a, {
      permission: 'knows_someone.decide',
      operation: `knows_someone.${b.accept ? 'accept' : 'reject'}`,
      reason: b.reason,
      target: { type: 'OutingSeat', id: seatId },
      commandId,
      call: () => this.tr().resolveKnowsSomeone(toStaffActor(a), seatId, { accept: b.accept, reason: b.reason, commandId }),
      auditData: (r) => ({ status: r.status }),
    });
  }

  // ------------------------------------------------------------------ présences, absences, pauses
  attendance(a: AdminActor): Promise<AdminAttendanceView> {
    authorize(a, 'attendance.read');
    return this.reads.attendance(this.clock.now(), 100);
  }

  resolveDispute(a: AdminActor, disputeId: string, b: { accept: boolean; reason: string }, commandId: string) {
    return this.runner.run(a, {
      permission: 'attendance.correct',
      operation: `attendance.dispute_${b.accept ? 'accept' : 'reject'}`,
      commandId,
      payload: { disputeId, accept: b.accept },
      reason: b.reason,
      target: { type: 'AttendanceDispute', id: disputeId },
      handle: async (scope) => {
        const r = await this.port().resolveDispute(scope, { disputeId, accept: b.accept, staffUserId: a.userId });
        if (!r) throw Errors.precondition('DISPUTE_NOT_OPEN');
        // Absence retirée → la compensation versée au lieu est contre-passée (une seule fois, même transaction).
        const reversed = r.corrected && this.ledger ? await this.ledger.reverse(scope, r.seatId) : false;
        return { result: { ...r, compensationReversed: reversed }, auditData: { seatId: r.seatId, corrected: r.corrected, compensationReversed: reversed } };
      },
    });
  }

  liftPause(a: AdminActor, userId: string, reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'reliability.pause_lift',
      operation: 'reliability.pause_lift',
      commandId,
      payload: { userId },
      reason,
      target: { type: 'User', id: userId },
      handle: async (scope) => {
        if (!(await this.port().liftPause(scope, { userId }))) throw Errors.precondition('NOT_PAUSED');
        return { result: { userId, paused: false } };
      },
    });
  }

  // ------------------------------------------------------------------ sécurité (besoin d'aide)
  async safetyAlerts(a: AdminActor, q: { status?: 'OPEN' | 'SAFE' | 'HANDLED'; limit: number }): Promise<{ items: AdminSafetyAlertRow[]; nextCursor: string | null }> {
    authorize(a, 'safety.read');
    const page = await this.tr().listSafetyAlerts(toStaffActor(a), q);
    // File prioritaire : ouvertes d'abord, échéance la plus proche en tête.
    const items = page.items.map((i) => ({ ...i, priority: 1 as const })).sort((x, y) => Number(y.status === 'OPEN') - Number(x.status === 'OPEN') || x.slaDueAt.localeCompare(y.slaDueAt));
    return { items, nextCursor: page.nextCursor };
  }

  /** Lecture du détail (position jointe éventuelle) : trust_lead seulement, justification écrite, auditée par E. */
  async safetyAlert(a: AdminActor, id: string, justification: string): Promise<AdminSafetyAlertDetail> {
    authorize(a, 'safety.position');
    const d = await this.tr().getSafetyAlert(toStaffActor(a), id, { justification });
    return { ...d, priority: 1 };
  }

  handleAlert(a: AdminActor, id: string, reason: string, commandId: string) {
    return this.runner.delegate(a, {
      permission: 'safety.handle',
      operation: 'safety.alert_handle',
      reason,
      target: { type: 'SafetyAlert', id },
      commandId,
      call: () => this.tr().handleSafetyAlert(toStaffActor(a), id, { reason, commandId }),
      auditData: (r) => ({ status: r.status }),
    });
  }

  // ------------------------------------------------------------------ signalements V5
  async reportsV5(a: AdminActor): Promise<AdminReportsV5View> {
    authorize(a, 'reports_v5.read');
    const now = this.clock.now();
    let members: AdminReportsV5View['members'] = [];
    let membersAvailable = false;
    if (this.trust) {
      const pages = await Promise.all(REPORT_CATEGORIES_V5_ADMIN.map((category) => this.trust!.listReports(toStaffActor(a), { category, limit: 50 })));
      members = pages.flatMap((p) => p.items).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
      membersAvailable = true;
    }
    const venues = await this.reads.venues();
    const names = new Map(venues.map((v) => [v.id, v.name]));
    const incidents = (await this.store.incidents()).map((i) => this.incidentView(i.venueId, names.get(i.venueId) ?? '—', { ...i.event, at: i.at }, now));
    return { members, membersAvailable, venues: incidents };
  }

  // ------------------------------------------------------------------ compensations lieu (§6.5)
  async compensations(a: AdminActor, q: { period?: string; venueId?: string }): Promise<AdminVenueCompensationView> {
    authorize(a, 'venue_compensations.read');
    if (!this.ledger) throw notWired('Journal économique');
    const period = q.period ?? periodOf(this.clock.now());
    const venues = (await this.reads.venues()).filter((v) => !q.venueId || v.id === q.venueId);
    const entries: AdminVenueCompensationView['entries'] = [];
    for (const v of venues) {
      const rows = await this.ledger.forVenue(v.id);
      const reversedSeats = new Set(rows.filter((r) => r.cause === 'REVERSAL').map((r) => r.seatId));
      for (const r of rows.filter((x) => periodOf(x.at) === period)) {
        entries.push({ seatId: r.seatId, outingId: r.outingId, venueId: v.id, venueName: v.name, amountCents: r.amountCents, currency: 'EUR', cause: r.cause, basis: r.basis, at: r.at.toISOString(), period, reversed: r.cause !== 'REVERSAL' && reversedSeats.has(r.seatId) });
      }
    }
    const totals = venues
      .map((v) => {
        const mine = entries.filter((e) => e.venueId === v.id);
        return { venueId: v.id, venueName: v.name, totalCents: mine.reduce((s, e) => s + e.amountCents, 0), entries: mine.length };
      })
      .filter((t) => t.entries > 0);
    return { period, totals, entries: entries.sort((x, y) => y.at.localeCompare(x.at)) };
  }

  reverseCompensation(a: AdminActor, seatId: string, reason: string, commandId: string) {
    return this.runner.run(a, {
      permission: 'venue_compensations.reverse',
      operation: 'venue_compensation.reverse',
      commandId,
      payload: { seatId },
      reason,
      target: { type: 'OutingSeat', id: seatId },
      handle: async (scope) => {
        if (!this.ledger) throw notWired('Journal économique');
        const ok = await this.ledger.reverse(scope, seatId);
        if (!ok) throw Errors.precondition('NOTHING_TO_REVERSE');
        return { result: { seatId, reversed: true } };
      },
    });
  }

  // ------------------------------------------------------------------ job : politique des créneaux
  /** Re-matérialise la politique de créneaux de chaque lieu actif (jours fermés, tables, fermetures). */
  async applyAllVenuePolicies(): Promise<number> {
    let changed = 0;
    for (const v of await this.reads.venues()) {
      if (v.status !== 'ACTIVE') continue;
      changed += await this.uow.run(async (scope) => (await applyVenuePolicy(this.writer, scope, v.id, reduceVenuePartner(await this.store.load(scope, v.id)), v.tablesPerSlot)).changed);
    }
    return changed;
  }
}
