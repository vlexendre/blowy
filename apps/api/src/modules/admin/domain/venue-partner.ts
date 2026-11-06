/**
 * Domaine pur de l'espace lieu partenaire (spec-v5 §2.3, §10.2, D-046) :
 *  - agrégat « lieu partenaire » reconstruit depuis ses événements (accès, contrat, jours, fermetures,
 *    signalements, demandes de photo) — aucun I/O ;
 *  - contrat d'une page (version + clauses) ;
 *  - planning hebdomadaire affiché au lieu et capacité effective d'un créneau ;
 *  - projection de l'effectif : **prénoms seulement**, à partir de la confirmation (veille 18 h).
 */
import { civilMonthOf } from '@blowy/domain';

/**
 * V5.7 (D-079, D-081) : le contrat nomme les quatre cas (raison de sécurité, imprévu, « Blowy annule », table Duo 0 €).
 * V5.6 (E15) : contrat BILATÉRAL d'une page — signé par le lieu puis contre-signé par Blowy (`blowySignedAt`),
 * clause de responsabilité, table de 2 (Duo), sortie pour raison de sécurité compensée 3 € HT (nouvelle version à signer).
 * V5.4 (C.12) : 3 € par place réservée si Blowy annule une sortie confirmée.
 */
export const VENUE_CONTRACT_VERSION = 'contrat-lieu-2026.12.3';
/** Préavis pour fermer un créneau (dans les deux sens), contrat clause 5. */
export const VENUE_NOTICE_HOURS = 72;
/** Plafond technique de tables simultanées (CHECK applicatif ; `VenueSlot.capacityOutings ≤ plafond`). */
export const VENUE_CAP_MAX = 6;
/** Horizon de matérialisation de la politique de créneaux (semaines). */
export const VENUE_POLICY_WEEKS = 3;
/** Réponse humaine promise au lieu pour un signalement (« l'équipe rappelle sous 1 h »). */
export const VENUE_INCIDENT_SLA_MINUTES = 60;

export const VENUE_CONTRACT_CLAUSES: readonly { n: number; title: string; body: string }[] = [
  { n: 1, title: 'Ce que fait le lieu', body: 'Réserve une table « Blowy » avec le chevalet orange sur les créneaux choisis, y compris les tables de 2 (Duo) annoncées dans l’effectif. Aucune animation. Chacun commande et paie ce qu’il consomme.' },
  { n: 2, title: 'Ce que fait Blowy', body: 'Compose les groupes, vérifie l’âge et l’identité de chaque participant, envoie l’effectif la veille à 18 h (prénoms seulement), tient une astreinte joignable pendant toute la sortie ou le rendez-vous.' },
  { n: 3, title: 'Argent', body: 'Blowy ne prend aucune commission sur vos ventes. Montants hors taxe, relevé mensuel détaillé par soirée (mois civil). Raison de sécurité : 3 € HT versés par Blowy. Imprévu : la place vous est reversée (4,16 € HT si payée, sinon 3 € HT). Blowy annule une sortie confirmée, à toute heure après la confirmation : 3 € HT par place réservée. Table Duo : 0 €, sans garantie.' },
  { n: 4, title: 'Responsabilités', body: 'Blowy répond de la sélection et de la vérification des participants et de l’astreinte. Le lieu répond du service et de la sécurité de son établissement. Le personnel n’intervient pas à la place de Blowy ; il appelle l’astreinte ou le 17. Charte anti-discrimination signée.' },
  { n: 5, title: 'Durée', body: 'Sans engagement. Préavis de 72 h pour un créneau, 30 jours pour le contrat. Le contrat est en vigueur une fois signé par le lieu et par Blowy.' },
];

export type IncidentMotive = 'BEHAVIOR' | 'REFUSED_TO_PAY' | 'OTHER';

export type VenuePartnerEvent =
  | { type: 'ACCESS_GRANTED'; userId: string }
  | { type: 'ACCESS_REVOKED'; userId: string }
  | { type: 'CONTRACT_SIGNED'; version: string; signerName: string; userId: string }
  | { type: 'DAY_SET'; isoWeekday: number; open: boolean; tables: number | null; note: string | null }
  | { type: 'CLOSURE_ADDED'; date: string; note: string }
  | { type: 'INCIDENT_REPORTED'; id: string; outingId: string; firstName: string; motive: IncidentMotive; note: string; seatId?: string; userId?: string }
  | { type: 'PHOTO_CHANGE_REQUESTED'; note: string };

export interface StoredVenueEvent {
  seq: number;
  at: Date;
  event: VenuePartnerEvent;
}

export interface VenuePartnerState {
  partners: Set<string>;
  contract: { version: string; signerName: string; signedAt: Date } | null;
  days: Map<number, { open: boolean; tables: number | null; note: string | null }>;
  closures: { date: string; note: string; at: Date }[];
  incidents: { id: string; outingId: string; firstName: string; motive: IncidentMotive; note: string; at: Date }[];
  photoRequests: { note: string; at: Date }[];
  seq: number;
}

export const EMPTY_VENUE_PARTNER: VenuePartnerState = { partners: new Set(), contract: null, days: new Map(), closures: [], incidents: [], photoRequests: [], seq: 0 };

export function reduceVenuePartner(events: readonly StoredVenueEvent[]): VenuePartnerState {
  const s: VenuePartnerState = { partners: new Set(), contract: null, days: new Map(), closures: [], incidents: [], photoRequests: [], seq: 0 };
  for (const { seq, at, event: e } of [...events].sort((a, b) => a.seq - b.seq)) {
    s.seq = seq;
    switch (e.type) {
      case 'ACCESS_GRANTED':
        s.partners.add(e.userId);
        break;
      case 'ACCESS_REVOKED':
        s.partners.delete(e.userId);
        break;
      case 'CONTRACT_SIGNED':
        s.contract = { version: e.version, signerName: e.signerName, signedAt: at };
        break;
      case 'DAY_SET':
        s.days.set(e.isoWeekday, { open: e.open, tables: e.tables, note: e.note });
        break;
      case 'CLOSURE_ADDED':
        if (!s.closures.some((c) => c.date === e.date)) s.closures.push({ date: e.date, note: e.note, at });
        break;
      case 'INCIDENT_REPORTED':
        s.incidents.push({ id: e.id, outingId: e.outingId, firstName: e.firstName, motive: e.motive, note: e.note, at });
        break;
      case 'PHOTO_CHANGE_REQUESTED':
        s.photoRequests.push({ note: e.note, at });
        break;
    }
  }
  return s;
}

// ------------------------------------------------------------------ planning hebdomadaire
export const WEEKDAY_FR = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;

/** « 19 h 30 », « 15 h » (minutes depuis minuit, heure locale). */
export function frClock(minuteOfDay: number): string {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h} h` : `${h} h ${String(mm).padStart(2, '0')}`;
}
export const frRange = (startMinute: number, durationMinutes: number) => `${frClock(startMinute)} – ${frClock(startMinute + durationMinutes)}`;

export interface TemplateLite {
  isoWeekday: number;
  localMinute: number;
  activity: string;
  active: boolean;
}

export interface ScheduleDay {
  isoWeekday: number;
  label: string;
  times: string | null;
  open: boolean;
  tables: number;
  note: string | null;
  /** Un créneau type de la ville existe ce jour-là pour les activités du lieu. */
  bookable: boolean;
}

/** Tables d'un jour (≤ plafond) ; un jour sans réglage explicite suit le plafond. */
export function dayTables(state: VenuePartnerState, isoWeekday: number, cap: number): number {
  const d = state.days.get(isoWeekday);
  return Math.max(1, Math.min(cap, d?.tables ?? cap));
}

/**
 * Planning affiché au lieu : mardi → dimanche toujours (lundi seulement s'il porte un créneau type) ;
 * un jour sans créneau type de la ville pour les activités du lieu n'est jamais « ouvert ».
 */
export function weeklySchedule(templates: readonly TemplateLite[], venueActivities: readonly string[], state: VenuePartnerState, cap: number, durationMinutes: number): ScheduleDay[] {
  const usable = templates.filter((t) => t.active && venueActivities.includes(t.activity)).sort((a, b) => a.localMinute - b.localMinute);
  const days: ScheduleDay[] = [];
  for (let wd = 1; wd <= 7; wd += 1) {
    const ts = usable.filter((t) => t.isoWeekday === wd);
    if (wd === 1 && ts.length === 0) continue;
    const set = state.days.get(wd);
    const open = ts.length > 0 && (set?.open ?? true);
    days.push({
      isoWeekday: wd,
      label: WEEKDAY_FR[wd]!,
      times: open && ts[0] ? frRange(ts[0].localMinute, durationMinutes) : null,
      open,
      tables: dayTables(state, wd, cap),
      note: set?.note ?? null,
      bookable: ts.length > 0,
    });
  }
  return days;
}

/**
 * Capacité cible d'un créneau (tables Blowy simultanées) : 0 si jour fermé ou fermeture
 * exceptionnelle à cette date (date locale `YYYY-MM-DD`), sinon tables du jour (≤ plafond).
 */
export function targetCapacity(state: VenuePartnerState, isoWeekday: number, localDate: string, cap: number): number {
  if (state.closures.some((c) => c.date === localDate)) return 0;
  const d = state.days.get(isoWeekday);
  if (d && !d.open) return 0;
  return dayTables(state, isoWeekday, cap);
}

/**
 * Nouvelle capacité d'un créneau existant : jamais sous les tables déjà réservées (contrainte
 * `reserved ≤ capacity`) ; une baisse ne s'applique qu'au-delà du préavis (72 h) — sauf fermeture
 * exceptionnelle, qui est traitée à part (annulation `VENUE_UNAVAILABLE`).
 */
export function nextCapacity(slot: { startsAt: Date; capacity: number; reserved: number }, target: number, now: Date, opts: { exceptional: boolean } = { exceptional: false }): number {
  const withinNotice = slot.startsAt.getTime() - now.getTime() < VENUE_NOTICE_HOURS * 3_600_000;
  if (target < slot.capacity && withinNotice && !opts.exceptional) return slot.capacity;
  return Math.max(slot.reserved, target);
}

// ------------------------------------------------------------------ effectif (prénoms seulement)
export type VenueTableStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';

export interface RosterOutingFacts {
  outingId: string;
  /** V5.6 (E13) : `DUO` = table de 2 (RDV Duo) ; absent = table Blowy d'un groupe. */
  kind?: 'GROUP' | 'DUO';
  status: string;
  startsAt: Date;
  endsAt: Date;
  lockAt: Date;
  activity: string;
  /** `teamKey` (interne, jamais projeté) : regroupe les personnes venues ensemble. */
  seats: { status: string; firstName: string | null; teamKey?: string | null }[];
}

const CONFIRMED_SEATS = new Set(['CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW']);

export function venueTableStatus(status: string): VenueTableStatus {
  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'DONE') return 'DONE';
  if (status === 'CONFIRMED' || status === 'CHECKIN_OPEN') return 'CONFIRMED';
  return 'PENDING';
}

/** Prénom seul : premier mot du nom affiché, jamais d'initiale de nom ni d'autre donnée. */
export function firstNameOnly(displayName: string | null | undefined): string {
  const w = (displayName ?? '').trim().split(/\s+/)[0] ?? '';
  return w.replace(/[^\p{L}'’-]/gu, '').slice(0, 40) || 'Participant·e';
}

/**
 * Projection de l'effectif pour le lieu : nombre + prénoms (dès `lockAt`, statut confirmé), rien
 * d'autre — ni identifiant de personne, ni âge, ni pet, ni financement, ni absence.
 */
export function projectVenueTable(o: RosterOutingFacts, now: Date, code: (startsAt: Date) => string) {
  const status = venueTableStatus(o.status);
  // Ordre d'accueil : venu·e·s ensemble d'abord (groupés), puis ordre alphabétique des prénoms.
  const confirmed = o.seats
    .filter((s) => CONFIRMED_SEATS.has(s.status))
    .map((s) => ({ ...s, name: firstNameOnly(s.firstName) }))
    .sort((a, b) => Number(!a.teamKey) - Number(!b.teamKey) || (a.teamKey ?? '').localeCompare(b.teamKey ?? '') || a.name.localeCompare(b.name, 'fr'));
  const revealed = (status === 'CONFIRMED' || status === 'DONE') && now >= o.lockAt;
  return {
    outingId: o.outingId,
    ...(o.kind === 'DUO' ? { kind: 'DUO' as const } : {}),
    startsAt: o.startsAt.toISOString(),
    endsAt: o.endsAt.toISOString(),
    lockAt: o.lockAt.toISOString(),
    activity: o.activity,
    status,
    confirmedCount: status === 'CANCELLED' ? 0 : confirmed.length,
    firstNames: revealed ? confirmed.map((s) => s.name) : [],
    code: revealed && status === 'CONFIRMED' ? code(o.startsAt) : null,
  };
}

/** Période comptable `YYYY-MM` — V5.7 (E28) : mois civil dans le fuseau du lieu (UTC par défaut). */
export const periodOf = (d: Date, timeZone = 'UTC') => civilMonthOf(d, timeZone);

/**
 * V5.7 (E30, D-080) : message d'accueil du lieu — texte seul, ≤ `[T] venues.welcomeMessageMaxChars`, sans lien ni
 * numéro de téléphone (règles déterministes, avant la modération). `null`/vide = retirer le message.
 */
export type WelcomeMessageIssue = 'TOO_LONG' | 'CONTAINS_LINK' | 'CONTAINS_PHONE';
export function welcomeMessageIssue(text: string, maxChars: number): WelcomeMessageIssue | null {
  if ([...text].length > maxChars) return 'TOO_LONG';
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(fr|com|net|org|io|be|ch|eu|app|co)\b|@)/i.test(text)) return 'CONTAINS_LINK';
  if (/(\+?\d[\s.\-()]?){8,}/.test(text)) return 'CONTAINS_PHONE';
  return null;
}
