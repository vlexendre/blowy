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
    /** V5.6 (E13) : `DUO` = table de 2 (rendez-vous Duo), mêmes règles : effectif la veille 18 h, code, compensation. */
    kind: z.literal('DUO').optional(),
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
    /** V5.7 (E29) : semaine en cours + suivante, chaque jour de créneau (date locale), nombre de tables (0 = « aucune table »). */
    days: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), isoWeekday: z.number().int().min(1).max(7), tables: z.number().int().min(0) }).strict()).optional(),
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
  /** V5.6 (E15) : contre-signature Blowy (contrat bilatéral) ; en vigueur quand les deux signatures portent la version courante. */
  countersigned?: { at: string; signerName: string } | null;
  inForce?: boolean;
}
export const VenueContractSignRequestSchema = z.object({ version: z.string().min(1).max(40), signerName: z.string().trim().min(2).max(80) });

/** Relevé mensuel des compensations : agrégé par sortie, jamais de prénom ni de financement individuel. */
export interface VenueStatementView {
  venue: { id: string; name: string; neighborhood: string };
  onCall: z.infer<typeof VenueOnCallSchema>;
  period: string;
  totalCents: number;
  /** V5.5 (D-067) : montants HORS TAXE. */
  taxBasis?: 'HT';
  /**
   * V5.5 (D-067) : relevé détaillé PAR SOIRÉE — places réservées, présences, absences, imprévus, annulation par Blowy,
   * places compensées et compensation (HT). `cancelledByBlowy` = sortie confirmée annulée par Blowy (3 € HT par
   * place réservée). Agrégats seulement : aucun prénom, aucun financement individuel.
   */
  lines: { outingId: string; startsAt: string | null; reservedSeats?: number; attended?: number; absences?: number; emergencies?: number; /** V5.6 (E22) : sorties pour raison de sécurité après la confirmation (3 € HT chacune). */ safetyExits?: number; seats: number; amountCents: number; cancelledByBlowy?: true; /** V5.6 (E13) : table de 2 (Duo). */ duoTable?: true }[];
}

export const VenueIncidentRequestSchema = z.object({
  outingId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(40),
  motive: z.enum(['BEHAVIOR', 'REFUSED_TO_PAY', 'OTHER']),
  note: z.string().trim().min(5).max(500),
});
/** V5.4 (C.12) : `POST /v1/venue/outings/:outingId/participant-reports` — prénom seulement (aucune autre donnée). */
export const VenueParticipantReportRequestSchema = VenueIncidentRequestSchema.omit({ outingId: true }).strict();
export const VenuePhotoRequestSchema = z.object({ note: z.string().trim().min(5).max(300) });

/** V5.7 (E30, D-080) : message d'accueil du lieu (texte seul, sans lien ni téléphone, modéré). `null` = retirer. */
export const VenueWelcomeRequestSchema = z.object({ text: z.string().max(2000).nullable() }).strict();
export interface VenueWelcomeView {
  text: string | null;
  updatedAt: string | null;
  /** Modèle prérempli (`venue.welcome.template`). */
  template: string;
  maxChars: number;
  /** Montré aux places confirmées à partir de la confirmation (veille 18 h), fiche + chat. */
  visibleFrom: 'CONFIRMATION';
}
