/**
 * Ports V5 du module admin (T6) : lectures d'exploitation (quartiers, lieux, sorties, présences),
 * écritures de configuration (quartiers, lieux, créneaux) et magasin d'événements du lieu partenaire.
 * Les mutations d'état des sorties passent par `OUTING_ADMIN_PORT` (module outings, seul écrivain).
 */
import type { AdminAttendanceView, AdminKnowsSomeoneRow, AdminNeighborhoodRow, AdminOutingRow } from '@blowy/api-contract';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { RosterOutingFacts, StoredVenueEvent, TemplateLite, VenuePartnerEvent } from '../../domain/venue-partner.js';

export interface VenueFacts {
  id: string;
  name: string;
  neighborhoodId: string;
  neighborhoodName: string;
  city: string;
  timezone: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  activities: string[];
  tablesPerSlot: number;
  addressLine: string;
  postalCode: string;
  venueCity: string;
  photoUrl: string | null;
  staffContact: string | null;
  checkinSecretRef: string;
}

export interface OutingDetailFacts extends AdminOutingRow {
  composedAt: string;
  acceptDeadline: string;
  photoRevealAt: string;
  checkinOpensAt: string;
  checkinClosesAt: string;
  votesCloseAt: string;
  cancelledAt: string | null;
  seats: {
    seatId: string;
    userId: string;
    displayName: string | null;
    status: string;
    cancelKind: string | null;
    refundState: string;
    checkedIn: boolean;
    reliability: { attended: number; absences: number } | null;
    knowsSomeone: string | null;
    dispute: string | null;
  }[];
  composition: { runId: string; kind: string; algoVersion: string; tuningVersion: string; stats: unknown } | null;
}

export interface OpsReadModel {
  neighborhoods(targetSize: number, now: Date): Promise<AdminNeighborhoodRow[]>;
  neighborhoodExists(id: string): Promise<{ id: string; timezone: string } | null>;
  venues(): Promise<VenueFacts[]>;
  venue(id: string): Promise<VenueFacts | null>;
  templatesOf(neighborhoodId: string): Promise<TemplateLite[]>;
  upcomingSlots(venueId: string, from: Date, to: Date): Promise<{ id: string; startsAt: Date; activity: string; capacity: number; reserved: number }[]>;
  outings(q: { status?: string; weekKey?: string; limit: number }): Promise<AdminOutingRow[]>;
  outing(id: string): Promise<OutingDetailFacts | null>;
  knowsSomeoneQueue(): Promise<Omit<AdminKnowsSomeoneRow, 'dueAt' | 'overdue'>[]>;
  attendance(now: Date, limit: number): Promise<AdminAttendanceView>;
  /** Sorties d'un lieu sur une fenêtre (effectif) : statuts et prénoms bruts, rien d'autre. */
  venueOutings(venueId: string, from: Date, to: Date): Promise<RosterOutingFacts[]>;
  outingsStart(ids: string[]): Promise<Map<string, Date>>;
  displayNames(userIds: string[]): Promise<Map<string, string>>;
  userIdByIdentity(provider: 'FIREBASE' | 'LOCAL', subject: string): Promise<string | null>;
  userStatus(userId: string): Promise<{ status: string; displayName: string } | null>;
  /** Place confirmée d'une sortie d'un lieu, retrouvée par prénom (signalement du lieu). */
  seatOfFirstName(venueId: string, outingId: string, firstName: string): Promise<{ seatId: string; userId: string } | null>;
}
export const OPS_READ_MODEL = Symbol('OpsReadModel');

export interface OpsConfigWriter {
  setNeighborhoodStatus(scope: TxScope, id: string, status: 'LIVE' | 'WAITLIST' | 'PAUSED' | 'CLOSED', estimatedLaunchAt: Date | null | undefined): Promise<void>;
  upsertTemplate(scope: TxScope, neighborhoodId: string, t: { isoWeekday: number; localMinute: number; activity: string; active: boolean }): Promise<string>;
  createVenue(scope: TxScope, v: { id: string; neighborhoodId: string; name: string; addressLine: string; postalCode: string; city: string; lat: number; lng: number; activities: string[]; tablesPerSlot: number; checkinSecretRef: string }): Promise<void>;
  updateVenue(scope: TxScope, id: string, patch: Record<string, unknown>): Promise<void>;
  /**
   * Matérialise la politique de créneaux d'un lieu (fenêtre `[from, to)`) : crée les créneaux absents
   * et ajuste la capacité des existants via `capacityFor` (null = inchangé). Renvoie les créneaux modifiés.
   */
  applySlotPolicy(scope: TxScope, venueId: string, from: Date, to: Date, capacityFor: (slot: { startsAt: Date; isoWeekday: number; localDate: string; capacity: number; reserved: number; exists: boolean }) => number | null): Promise<{ changed: number }>;
  /** Sorties actives d'un lieu à une date locale (fermeture exceptionnelle). */
  activeOutingsOn(scope: TxScope, venueId: string, localDate: string): Promise<{ id: string; status: string; startsAt: Date }[]>;
}
export const OPS_CONFIG_WRITER = Symbol('OpsConfigWriter');

/**
 * Magasin d'événements du lieu partenaire (append-only, séquence par lieu). Adapter actuel : table
 * `DomainEvent` (aggregateType `venue.partner`) faute de table `VenuePartnerAccess` (proposée à C).
 */
export interface VenuePartnerStore {
  load(scope: TxScope | null, venueId: string): Promise<StoredVenueEvent[]>;
  append(scope: TxScope, venueId: string, event: VenuePartnerEvent, actorUserId: string | null): Promise<number>;
  /** Lieux dont `userId` est partenaire actif. */
  venuesOf(userId: string): Promise<string[]>;
  /** Tous les signalements de lieux (file ops). */
  incidents(): Promise<{ venueId: string; at: Date; event: Extract<VenuePartnerEvent, { type: 'INCIDENT_REPORTED' }> }[]>;
  partnerMfa(userId: string): Promise<{ generation: number; enrolled: boolean }>;
  startPartnerEnrollment(scope: TxScope, userId: string): Promise<number>;
  confirmPartnerEnrollment(scope: TxScope, userId: string): Promise<void>;
}
export const VENUE_PARTNER_STORE = Symbol('VenuePartnerStore');

/** Compensations lieu (journal économique de G, lecture + contre-écriture). */
export interface VenueCompensationLedger {
  forVenue(venueId: string): Promise<{ seatId: string; outingId: string; venueId: string; amountCents: number; cause: 'NO_SHOW' | 'LATE_CANCEL' | 'REVERSAL'; basis: 'SEAT_PRICE' | 'FREE_SEAT'; at: Date }[]>;
  reverse(scope: TxScope, seatId: string): Promise<boolean>;
}
export const VENUE_COMPENSATION_LEDGER = Symbol('VenueCompensationLedger');

/** Sessions du lieu partenaire (lignes `DeviceSession` `platform = 'venue-partner'`, empreinte à séparation de domaine). */
export interface VenueSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}
export interface VenueSessionRepository {
  create(scope: TxScope, s: { id: string; userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  find(id: string): Promise<VenueSessionRecord | null>;
  touch(id: string, at: Date): Promise<void>;
  revoke(scope: TxScope, userId: string, id: string, at: Date): Promise<boolean>;
  revokeAllFor(scope: TxScope, userId: string, at: Date): Promise<number>;
  /** Anti-rejeu TOTP propre au lieu (un pas ne sert qu'une fois). */
  consumeTotpStep(scope: TxScope, userId: string, step: number): Promise<boolean>;
}
export const VENUE_SESSION_REPOSITORY = Symbol('VenueSessionRepository');
