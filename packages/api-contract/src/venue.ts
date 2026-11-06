/**
 * Contrats de l'espace lieu partenaire (spec-v5 §10.2, D-046, T6, agent F) — `/v1/venue/*`.
 * Authentification DISTINCTE du staff et du mobile (rôle `venue_partner`, MFA TOTP identique,
 * sessions courtes). Données personnelles : **prénoms seulement**, à partir de la confirmation
 * (veille 18 h). Les vues de l'effectif sont `.strict()` : un champ imprévu = échec.
 */
import { z } from 'zod';
import { TotpCodeSchema } from './admin.js';

export const VENUE_SESSION_COOKIE = 'blowy_venue';
export const VENUE_CSRF_COOKIE = 'blowy_venue_csrf';
export const VENUE_PENDING_COOKIE = 'blowy_venue_pending';
export const VENUE_SESSION_HEADER = 'x-blowy-venue-session';
export const VENUE_PENDING_HEADER = 'x-blowy-venue-pending';
export const VENUE_CSRF_HEADER = 'x-blowy-venue-csrf';

export const VenueLoginRequestSchema = z.object({ provider: z.enum(['firebase', 'local']), credential: z.string().min(1).max(4096) });
export const VenueMfaRequestSchema = z.object({ code: TotpCodeSchema });

export interface VenueMe {
  userId: string;
  displayName: string;
  venues: { id: string; name: string; neighborhood: string }[];
  sessionExpiresAt: string;
}

/** Astreinte Blowy affichée au lieu (numéro de configuration, jamais inventé en production). */
export const VenueOnCallSchema = z.object({ phone: z.string().nullable(), hours: z.string() }).strict();

/** Une table « Blowy » d'un créneau : nombre, statut et prénoms (dès la confirmation) — rien d'autre. */
export const VenueTableSchema = z
  .object({
    outingId: z.string().uuid(),
    startsAt: z.string(),
    endsAt: z.string(),
    lockAt: z.string(),
    activity: z.string(),
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE']),
    confirmedCount: z.number().int().min(0),
    /** Prénoms seulement, présents à partir de la confirmation (veille 18 h), sinon tableau vide. */
    firstNames: z.array(z.string()),
    /** Code du chevalet (repli du check-in), à partir de la confirmation. */
    code: z.string().regex(/^\d{4}$/).nullable(),
  })
  .strict();
export type VenueTable = z.infer<typeof VenueTableSchema>;

export const VenueRosterViewSchema = z
  .object({
    venue: z.object({ id: z.string().uuid(), name: z.string(), neighborhood: z.string(), timezone: z.string() }).strict(),
    onCall: VenueOnCallSchema,
    /** Tables Blowy par plafond de créneau (affiché : « 1 table · chevalet orange »). */
    tablesPerSlot: z.number().int(),
    tables: z.array(VenueTableSchema),
  })
  .strict();
export type VenueRosterView = z.infer<typeof VenueRosterViewSchema>;

export interface VenueScheduleDay {
  isoWeekday: number;
  label: string;
  /** « 19 h 30 – 21 h 30 » ; null si aucun créneau type ce jour-là. */
  times: string | null;
  open: boolean;
  tables: number;
  /** Mention libre du lieu (« coup de feu, fermé »). */
  note: string | null;
  /** Un créneau type de la ville existe ce jour-là (sinon l'interrupteur est inactif). */
  bookable: boolean;
}
export interface VenueScheduleView {
  venue: { id: string; name: string; neighborhood: string };
  onCall: z.infer<typeof VenueOnCallSchema>;
  cap: number;
  capMax: number;
  noticeHours: number;
  days: VenueScheduleDay[];
  closures: { date: string; note: string }[];
}
export const VenueDayRequestSchema = z.object({
  isoWeekday: z.number().int().min(1).max(7),
  open: z.boolean(),
  tables: z.number().int().min(1).max(6).optional(),
  note: z.string().trim().max(60).nullable().optional(),
});
export const VenueCapRequestSchema = z.object({ tables: z.number().int().min(1).max(6) });
export const VenueClosureRequestSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: z.string().trim().min(3).max(200) });

export interface VenueContractView {
  venue: { id: string; name: string; neighborhood: string; address: string };
  onCall: z.infer<typeof VenueOnCallSchema>;
  version: string;
  clauses: { n: number; title: string; body: string }[];
  signed: { at: string; signerName: string; version: string } | null;
}
export const VenueContractSignRequestSchema = z.object({ version: z.string().min(1).max(40), signerName: z.string().trim().min(2).max(80) });

/** Relevé mensuel des compensations : agrégé par sortie, jamais de prénom ni de financement individuel. */
export interface VenueStatementView {
  venue: { id: string; name: string; neighborhood: string };
  onCall: z.infer<typeof VenueOnCallSchema>;
  period: string;
  totalCents: number;
  lines: { outingId: string; startsAt: string | null; seats: number; amountCents: number }[];
}

export const VenueIncidentRequestSchema = z.object({
  outingId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(40),
  motive: z.enum(['BEHAVIOR', 'REFUSED_TO_PAY', 'OTHER']),
  note: z.string().trim().min(5).max(500),
});
export const VenuePhotoRequestSchema = z.object({ note: z.string().trim().min(5).max(300) });
