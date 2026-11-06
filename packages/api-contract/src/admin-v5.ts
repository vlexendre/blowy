/**
 * Contrats du back-office V5 (spec-v5 §10.1, T6, agent F) : villes et quartiers, lieux et créneaux,
 * sorties (état, effectif, annulation avec remboursement), présences / pauses / contestations,
 * « je connais quelqu'un », sécurité (besoin d'aide), signalements V5, compensations lieu.
 * Vues staff explicites : jamais de vote, de préférence, d'intention, de `friendsOnly` individuel,
 * de position (sauf lecture motivée trust_lead), ni de montant de paiement pour `ops`.
 */
import { z } from 'zod';
import { ReasonSchema } from './admin.js';

export const NEIGHBORHOOD_STATUSES_V5 = ['LIVE', 'WAITLIST', 'PAUSED', 'CLOSED'] as const;
export const ACTIVITY_KINDS_V5 = ['DRINK_COFFEE', 'BRUNCH', 'CLIMBING', 'WORKSHOP', 'GAMES', 'EXHIBITION', 'SPORT'] as const;
export const AdminActivitySchema = z.enum(ACTIVITY_KINDS_V5);

// ---------------------------------------------------------------- Villes et quartiers
export interface AdminSlotTemplate {
  id: string;
  isoWeekday: number;
  localMinute: number;
  activity: (typeof ACTIVITY_KINDS_V5)[number];
  active: boolean;
  /** Personnes vérifiées de la ville ayant coché ce créneau (agrégat). */
  available: number;
  /** « il manque N » pour une sortie de la taille cible (jamais négatif). */
  missing: number;
}
export interface AdminNeighborhoodRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  timezone: string;
  status: (typeof NEIGHBORHOOD_STATUSES_V5)[number];
  estimatedLaunchAt: string | null;
  /** Personnes vérifiées dans la ville (agrégat). */
  verifiedInCity: number;
  venues: number;
  slotTemplates: AdminSlotTemplate[];
}
export const NeighborhoodStatusRequestSchema = z.object({
  status: z.enum(NEIGHBORHOOD_STATUSES_V5),
  estimatedLaunchAt: z.string().datetime({ offset: true }).nullable().optional(),
  reason: ReasonSchema,
});
export const SlotTemplateRequestSchema = z.object({
  isoWeekday: z.number().int().min(1).max(7),
  localMinute: z.number().int().min(0).max(1439),
  activity: AdminActivitySchema,
  active: z.boolean(),
  reason: ReasonSchema,
});

// ---------------------------------------------------------------- Lieux
export interface AdminVenueRow {
  id: string;
  name: string;
  neighborhood: { id: string; name: string; city: string };
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  activities: (typeof ACTIVITY_KINDS_V5)[number][];
  tablesPerSlot: number;
  address: string;
  contract: { version: string; signedAt: string; signerName: string; /** V5.6 (E15) */ countersignedAt?: string | null; countersignerName?: string | null; inForce?: boolean } | null;
  /** V5.6 (E11) : ambiance du lieu (null = convient à tous). */
  ambiance?: 'CALM' | 'LIVELY' | null;
  /** V5.7 (E30) : message d'accueil (lecture staff, modération). */
  welcomeMessage?: string | null;
  partners: number;
}
export interface AdminVenueSchedule {
  isoWeekday: number;
  label: string;
  times: string | null;
  open: boolean;
  tables: number;
  note: string | null;
  bookable: boolean;
}
export interface AdminVenueDetail extends AdminVenueRow {
  addressLine: string;
  postalCode: string;
  city: string;
  photoUrl: string | null;
  staffContact: string | null;
  /** V5.10 : prix TTC (centimes) de l'activité prépayée fixé par le lieu ; null = prix du catalogue. */
  activityPriceCents?: number | null;
  /** V5.10 : régime du reversement de l'activité au lieu (TTC par défaut). */
  activityTaxBasis?: 'TTC' | 'HT';
  partnerAccounts: { userId: string; displayName: string }[];
  schedule: AdminVenueSchedule[];
  closures: { date: string; note: string; at: string }[];
  upcomingSlots: { id: string; startsAt: string; activity: string; capacity: number; reserved: number }[];
  incidents: AdminVenueIncident[];
  photoRequests: { at: string; note: string }[];
}
export interface AdminVenueIncident {
  id: string;
  venueId: string;
  venueName: string;
  outingId: string;
  firstName: string;
  motive: 'BEHAVIOR' | 'REFUSED_TO_PAY' | 'OTHER';
  note: string;
  createdAt: string;
  dueAt: string;
  overdue: boolean;
}
export const VenueCreateRequestSchema = z.object({
  neighborhoodId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  addressLine: z.string().trim().min(3).max(120),
  postalCode: z.string().trim().min(4).max(10),
  city: z.string().trim().min(2).max(60),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  activities: z.array(AdminActivitySchema).min(1).max(6),
  tablesPerSlot: z.number().int().min(1).max(6),
  reason: ReasonSchema,
});
export const VenueUpdateRequestSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  addressLine: z.string().trim().min(3).max(120).optional(),
  postalCode: z.string().trim().min(4).max(10).optional(),
  city: z.string().trim().min(2).max(60).optional(),
  photoUrl: z.string().url().max(500).nullable().optional(),
  activities: z.array(AdminActivitySchema).min(1).max(6).optional(),
  tablesPerSlot: z.number().int().min(1).max(6).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  staffContact: z.string().trim().max(200).nullable().optional(),
  /** V5.6 (E11, §10.1) : ambiance du lieu (null = convient à tous). */
  ambiance: z.enum(['CALM', 'LIVELY']).nullable().optional(),
  /** V5.9 : activité précise du lieu (`ACTIVITY_DETAILS`) ; null = libellé générique. */
  activityDetailKey: z.string().regex(/^[a-z0-9_]{2,40}$/).nullable().optional(),
  /** V5.10 : prix TTC (centimes) de l'activité, prépayé avec la place ; null = prix du catalogue ; 0 = rien à prépayer. */
  activityPriceCents: z.number().int().min(0).max(50_000).nullable().optional(),
  /** V5.10 : régime du reversement de l'activité (TTC par défaut ; HT = reversé hors taxe). */
  activityTaxBasis: z.enum(['TTC', 'HT']).optional(),
  reason: ReasonSchema,
});
export const VenuePartnerAccessRequestSchema = z.object({
  provider: z.enum(['firebase', 'local']),
  subject: z.string().trim().min(1).max(200),
  grant: z.boolean(),
  reason: ReasonSchema,
});

// ---------------------------------------------------------------- Sorties
export interface AdminOutingRow {
  id: string;
  status: 'PROPOSED' | 'FORMING' | 'CONFIRMED' | 'CHECKIN_OPEN' | 'DONE' | 'CANCELLED';
  weekKey: string;
  startsAt: string;
  lockAt: string;
  activity: string;
  neighborhood: string;
  venue: { id: string; name: string };
  capacity: number;
  confirmed: number;
  invited: number;
  cancelReason: string | null;
}
export interface AdminOutingSeat {
  seatId: string;
  userId: string;
  firstName: string;
  status: string;
  cancelKind: string | null;
  checkedIn: boolean;
  reliability: string;
  knowsSomeone: string | null;
  dispute: string | null;
  /** Présent seulement pour un lecteur `economy.read` (finance, admin) : jamais pour ops. */
  refundState?: string;
}
export interface AdminOutingDetail extends AdminOutingRow {
  timeline: { key: string; at: string; label: string }[];
  seats: AdminOutingSeat[];
  /** Rapport de composition : codes et agrégats seulement (jamais de `friendsOnly` individuel). */
  composition: { runId: string; kind: string; algoVersion: string; tuningVersion: string; aggregates: Record<string, number> } | null;
}
export const OutingListQuerySchema = z.object({
  status: z.enum(['PROPOSED', 'FORMING', 'CONFIRMED', 'CHECKIN_OPEN', 'DONE', 'CANCELLED']).optional(),
  weekKey: z.string().regex(/^\d{4}-W\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const OutingCancelRequestSchema = z.object({ kind: z.enum(['STAFF', 'VENUE_UNAVAILABLE']), reason: ReasonSchema });
export const ReasonOnlyRequestSchema = z.object({ reason: ReasonSchema });

// ---------------------------------------------------------------- V5.6 (E12, E15, E11) : astreinte, contrat, trajets
/** Planning d'astreinte (trust_lead + ops) : un tour par fuseau, jamais un numéro en clair (`phoneRef`). */
export const OnCallShiftCreateRequestSchema = z
  .object({
    timezone: z.string().trim().min(3).max(64),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    teamLabel: z.string().trim().min(2).max(60),
    phoneRef: z.string().trim().max(120).nullable().optional(),
    reason: ReasonSchema,
  })
  .strict();
export const OnCallShiftListQuerySchema = z.object({ timezone: z.string().trim().min(3).max(64).optional(), from: z.string().datetime({ offset: true }).optional(), days: z.coerce.number().int().min(1).max(62).default(14) });
export interface AdminOnCallShiftRow {
  id: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  teamLabel: string;
  hasPhoneRef: boolean;
}
export interface AdminOnCallPlanning {
  shifts: AdminOnCallShiftRow[];
  /** Trous de couverture sur la fenêtre demandée (créneaux publiés non couverts). */
  uncoveredSlots: { venueSlotId: string; startsAt: string; timezone: string }[];
}
/** Contre-signature Blowy du contrat bilatéral (admin, step-up). */
export const VenueCountersignRequestSchema = z.object({ signerName: z.string().trim().min(2).max(80), reason: ReasonSchema }).strict();
/** V5.6 (E11) : centre du quartier (sert à estimer un trajet sans valeur ops ; jamais la position d'une personne). */
export const NeighborhoodCenterRequestSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), reason: ReasonSchema }).strict();
/** Temps de trajet typique entre quartiers (ops), dans les deux sens si `symmetric`. */
export const TravelTimeUpsertRequestSchema = z
  .object({ fromNeighborhoodId: z.string().uuid(), toNeighborhoodId: z.string().uuid(), minutes: z.number().int().min(1).max(240), symmetric: z.boolean().default(true), reason: ReasonSchema })
  .strict();
export interface AdminTravelTimeRow {
  fromNeighborhoodId: string;
  toNeighborhoodId: string;
  minutes: number;
}

// ---------------------------------------------------------------- « Je connais quelqu'un »
export interface AdminKnowsSomeoneRow {
  seatId: string;
  outingId: string;
  startsAt: string;
  firstName: string;
  targetFirstName: string;
  status: string;
  createdAt: string;
  dueAt: string;
  overdue: boolean;
}
export const DecisionRequestSchema = z.object({ accept: z.boolean(), reason: ReasonSchema });

// ---------------------------------------------------------------- Présences, absences, pauses
export interface AdminAbsenceRow {
  seatId: string;
  outingId: string;
  userId: string;
  firstName: string;
  startsAt: string;
  kind: 'NO_SHOW' | 'LATE_CANCEL';
  dispute: { id: string; status: 'OPEN' | 'ACCEPTED' | 'REJECTED'; note: string; createdAt: string } | null;
}
export interface AdminPauseRow {
  userId: string;
  firstName: string;
  pausedUntil: string;
  attended: number;
  absences: number;
}
export interface AdminAttendanceView {
  absences: AdminAbsenceRow[];
  pauses: AdminPauseRow[];
}

// ---------------------------------------------------------------- Sécurité (besoin d'aide)
export interface AdminSafetyAlertRow {
  id: string;
  userId: string;
  subjectKind: 'OUTING' | 'DUO_DATE';
  subjectId: string;
  status: 'OPEN' | 'SAFE' | 'HANDLED';
  createdAt: string;
  resolvedAt: string | null;
  acknowledged: boolean;
  caseId: string | null;
  slaDueAt: string;
  overdue: boolean;
  positionAttached: boolean;
  positionPurgeAfter: string | null;
  /** Toujours 1 : file prioritaire (échéance de réponse humaine 1 h). */
  priority: 1;
}
export interface AdminSafetyAlertDetail extends AdminSafetyAlertRow {
  position: { lat: number; lng: number; accuracyM: number } | null;
}
export const SafetyAlertReadQuerySchema = z.object({ justification: z.string().trim().min(10).max(500) });
export const SafetyListQuerySchema = z.object({ status: z.enum(['OPEN', 'SAFE', 'HANDLED']).optional(), limit: z.coerce.number().int().min(1).max(100).default(50) });

// ---------------------------------------------------------------- Signalements V5
export const REPORT_CATEGORIES_V5_ADMIN = ['OUTING_THREAT', 'IRL_BEHAVIOR', 'ON_SITE_INCIDENT', 'REPEATED_NO_SHOW'] as const;
export interface AdminReportsV5View {
  /** Signalements des membres (motifs V5), via le port de E (jamais l'identité du signaleur). */
  members: { id: string; reportedUserId: string; category: string; safetyExit: boolean; status: string; createdAt: string }[];
  membersAvailable: boolean;
  /** Signalements des lieux partenaires (« l'équipe rappelle sous 1 h »). */
  venues: AdminVenueIncident[];
}

// ---------------------------------------------------------------- Compensations lieu (§6.5)
export interface AdminVenueCompensationRow {
  seatId: string;
  outingId: string;
  venueId: string;
  venueName: string;
  amountCents: number;
  currency: 'EUR';
  cause: 'NO_SHOW' | 'LATE_CANCEL' | 'EMERGENCY' | 'SAFETY' | 'BLOWY_CANCELLED' | 'REVERSAL';
  basis: 'SEAT_PRICE' | 'FREE_SEAT' | 'BLOWY_CANCELLED' | 'SAFETY';
  at: string;
  period: string;
  reversed: boolean;
}
export interface AdminVenueCompensationView {
  period: string;
  totals: { venueId: string; venueName: string; totalCents: number; entries: number }[];
  entries: AdminVenueCompensationRow[];
}
export const CompensationQuerySchema = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/).optional(), venueId: z.string().uuid().optional() });
