/**
 * Sorties V5 : demande hebdo, sortie, place, check-in, vote d'après (spec-v5 §2.4–2.10, D-012, D-015).
 * Types purs et tables de transitions ; la vérité des transitions temporelles est au backend (`outings`).
 */

// ---------------------------------------------------------------- demande hebdo (§2.4)
export const OUTING_REQUEST_STATUSES = ['OPEN', 'PLACED', 'UNPLACED', 'WITHDRAWN'] as const;
export type OutingRequestStatus = (typeof OUTING_REQUEST_STATUSES)[number];

/** Phase de la semaine vue par la personne (`GET /v1/outings/week`, §7.2). */
export const OUTING_WEEK_PHASES = ['NOT_LAUNCHED', 'REQUEST_OPEN', 'COMPOSING', 'INVITED', 'IN_OUTING', 'UNPLACED', 'PAUSED', 'QUOTA_USED'] as const;
export type OutingWeekPhase = (typeof OUTING_WEEK_PHASES)[number];

// ---------------------------------------------------------------- sortie (§2.5)
export const OUTING_STATUSES = ['PROPOSED', 'FORMING', 'CONFIRMED', 'CHECKIN_OPEN', 'DONE', 'CANCELLED'] as const;
export type OutingStatus = (typeof OUTING_STATUSES)[number];

/** Machine d'états de la sortie (§2.5). `* → CANCELLED` sauf depuis `DONE`. */
export const OUTING_TRANSITIONS: Readonly<Record<OutingStatus, readonly OutingStatus[]>> = {
  PROPOSED: ['FORMING', 'CANCELLED'],
  FORMING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKIN_OPEN', 'CANCELLED'],
  CHECKIN_OPEN: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};
export const canTransitionOuting = (from: OutingStatus, to: OutingStatus): boolean => OUTING_TRANSITIONS[from].includes(to);

export const OUTING_CANCEL_REASONS = ['UNDERSIZED', 'VENUE_UNAVAILABLE', 'STAFF', 'NEIGHBORHOOD_CLOSED', 'SAFETY'] as const;
export type OutingCancelReason = (typeof OUTING_CANCEL_REASONS)[number];

/** Motif d'annulation montré aux participants (§7.5) : jamais le détail staff/sécurité. */
export const OUTING_PUBLIC_CANCEL_REASONS = ['UNDERSIZED', 'VENUE', 'OTHER'] as const;
export type OutingPublicCancelReason = (typeof OUTING_PUBLIC_CANCEL_REASONS)[number];
export const publicCancelReason = (r: OutingCancelReason): OutingPublicCancelReason => (r === 'UNDERSIZED' ? 'UNDERSIZED' : r === 'VENUE_UNAVAILABLE' ? 'VENUE' : 'OTHER');

/** Instants figés à la création de la sortie (§2.5, valeurs `[T] outings.cycle`). */
export interface OutingTimeline {
  acceptDeadline: number;
  lockAt: number;
  photoRevealAt: number;
  checkinOpensAt: number;
  checkinClosesAt: number;
  votesCloseAt: number;
}

// ---------------------------------------------------------------- place (§2.6)
export const SEAT_STATUSES = ['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW', 'DECLINED', 'EXPIRED', 'CANCELLED'] as const;
export type SeatStatus = (typeof SEAT_STATUSES)[number];

/** I-O2 : statuts « actifs » (au plus une place active par personne et par semaine). */
export const ACTIVE_SEAT_STATUSES: readonly SeatStatus[] = ['INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW'];
/** I-O1 : places occupant la capacité (une invitation réserve une place : pas de surréservation). */
export const CAPACITY_SEAT_STATUSES: readonly SeatStatus[] = ACTIVE_SEAT_STATUSES;
/** Places « confirmées » au sens du comptage `confirmed` (§2.5). */
export const CONFIRMED_SEAT_STATUSES: readonly SeatStatus[] = ['CONFIRMED', 'CHECKED_IN', 'ATTENDED'];
export const isActiveSeat = (s: SeatStatus): boolean => ACTIVE_SEAT_STATUSES.includes(s);

export const SEAT_TRANSITIONS: Readonly<Record<SeatStatus, readonly SeatStatus[]>> = {
  INVITED: ['HELD', 'CONFIRMED', 'DECLINED', 'EXPIRED', 'CANCELLED'],
  HELD: ['CONFIRMED', 'INVITED', 'EXPIRED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'NO_SHOW', 'CANCELLED'],
  CHECKED_IN: ['ATTENDED', 'CANCELLED'],
  ATTENDED: [],
  /** Correction staff d'une absence (contestation acceptée, §2.14). */
  NO_SHOW: ['ATTENDED'],
  DECLINED: [],
  EXPIRED: [],
  CANCELLED: [],
};
export const canTransitionSeat = (from: SeatStatus, to: SeatStatus): boolean => SEAT_TRANSITIONS[from].includes(to);

export const SEAT_FUNDINGS = ['FREE_FIRST', 'PLUS_INCLUDED', 'CREDIT', 'PAID', 'STAFF_COMP'] as const;
export type SeatFunding = (typeof SEAT_FUNDINGS)[number];

/**
 * V5.1 (E.16) : `EARLY` = avant le verrouillage (veille 18 h) → recrédit ; `LATE` = après le
 * verrouillage → comptée comme une ABSENCE, sans remboursement (sauf `SAFETY_EXIT`).
 */
export const SEAT_CANCEL_KINDS = ['EARLY', 'LATE', 'SAFETY_EXIT', 'SYSTEM_REMOVAL', 'ACCOUNT_DELETED'] as const;
export type SeatCancelKind = (typeof SEAT_CANCEL_KINDS)[number];

export const REFUND_STATES = ['NONE', 'PENDING', 'REFUNDED', 'RECREDITED', 'NOT_ELIGIBLE'] as const;
export type RefundState = (typeof REFUND_STATES)[number];

/**
 * Mode de remboursement annoncé à l'utilisateur (§7.2 `seat.cancel`, D-042) : `CARD` = remboursement carte
 * intégral (place payée) ; `STAYS_FREE` = la 1ʳᵉ sortie « reste offerte » (jamais « remboursé·e ») ;
 * `NONE` = rien à rendre (Blowy+, absence). `CREDIT` = déprécié : seulement une place financée par un
 * ancien lot de crédit (le lot est rendu) ; plus jamais émis pour une place payée.
 */
export const REFUND_MODES = ['CARD', 'STAYS_FREE', 'CREDIT', 'NONE'] as const;
export type RefundMode = (typeof REFUND_MODES)[number];

/** Annulation demandée par l'utilisateur (§7.2). */
export const SEAT_CANCEL_REQUEST_KINDS = ['CANT_MAKE_IT', 'SAFETY'] as const;
export type SeatCancelRequestKind = (typeof SEAT_CANCEL_REQUEST_KINDS)[number];

// ---------------------------------------------------------------- check-in (§2.8, D-023)
export const CHECKIN_METHODS = ['GEO', 'VENUE_CODE', 'STAFF'] as const;
export type CheckInMethod = (typeof CHECKIN_METHODS)[number];

export const CHECKIN_RESULTS = ['ACCEPTED', 'TOO_FAR', 'LOW_ACCURACY', 'CODE_INVALID'] as const;
export type CheckInResult = (typeof CHECKIN_RESULTS)[number];

/** Seule trace de précision conservée (jamais la position). */
export const ACCURACY_BUCKETS = ['LE_50', 'LE_150', 'GT_150'] as const;
export type AccuracyBucket = (typeof ACCURACY_BUCKETS)[number];
export const accuracyBucket = (accuracyM: number): AccuracyBucket => (accuracyM <= 50 ? 'LE_50' : accuracyM <= 150 ? 'LE_150' : 'GT_150');

// ---------------------------------------------------------------- vote d'après (§2.10, D-015)
export const VOTE_CHOICES = ['FRIEND', 'PLUS', 'NO'] as const;
export type VoteChoice = (typeof VOTE_CHOICES)[number];

/** Ordre total `NO < FRIEND < PLUS` (résolution par `min`). */
export const VOTE_RANK: Readonly<Record<VoteChoice, number>> = { NO: 0, FRIEND: 1, PLUS: 2 };

export const CONNECTION_KINDS = ['FRIEND', 'PLUS'] as const;
export type ConnectionKind = (typeof CONNECTION_KINDS)[number];

/**
 * Résolution d'une paire : `r = min(a→b, b→a)` ; un bulletin manquant vaut NO ;
 * `PLUS` sans compatibilité romance réciproque devient `FRIEND`. `null` = rien (jamais révélé).
 */
export function resolvePairVotes(aToB: VoteChoice | null, bToA: VoteChoice | null, romanceCompatible: boolean): ConnectionKind | null {
  if (aToB === null || bToA === null) return null;
  const r = VOTE_RANK[aToB] <= VOTE_RANK[bToA] ? aToB : bToA;
  if (r === 'NO') return null;
  if (r === 'PLUS' && !romanceCompatible) return 'FRIEND';
  return r;
}

/**
 * Choix proposés au votant : V5.1 (A.1) — Ami·e / Plus / Non toujours affichés pour TOUT le monde ;
 * la compatibilité est appliquée en silence au dépouillement (`resolvePairVotes`). « Non » par défaut (A.3).
 */
export const availableVoteChoices = (): readonly VoteChoice[] => VOTE_CHOICES;
export const DEFAULT_VOTE_CHOICE: VoteChoice = 'NO';

// ---------------------------------------------------------------- composition (§4)
/** `SEEDING` : sortie d'amorçage team + team dans une ville / un quartier fermé (V5.1 B.7). */
export const COMPOSITION_RUN_KINDS = ['WEEKLY', 'RERUN', 'SEEDING'] as const;
export type CompositionRunKind = (typeof COMPOSITION_RUN_KINDS)[number];

export const COMPOSITION_RUN_STATUSES = ['RUNNING', 'SUCCEEDED', 'FAILED'] as const;
export type CompositionRunStatus = (typeof COMPOSITION_RUN_STATUSES)[number];

/** Motifs codés de non-placement (diagnostic staff ; jamais montrés tels quels à l'utilisateur). */
export const UNPLACED_REASONS = ['POOL_TOO_SMALL', 'NO_COMPATIBLE_GROUP', 'NO_SLOT_CAPACITY', 'TEAM_INCOMPATIBLE'] as const;
export type UnplacedReason = (typeof UNPLACED_REASONS)[number];

// ---------------------------------------------------------------- fiabilité (§2.14, D-022)
export const RELIABILITY_REASONS_V5 = ['OUTING_ATTENDED', 'OUTING_NO_SHOW', 'DUO_NO_SHOW', 'RELIABILITY_PAUSE', 'STAFF_CORRECTION'] as const;
export type ReliabilityReasonV5 = (typeof RELIABILITY_REASONS_V5)[number];

/**
 * « venu·e à N sorties sur M » ; M = présences + absences. V5.1 (E.16) : une annulation après le
 * verrouillage compte comme une absence (`lateCancels`).
 */
export type ReliabilityDisplay = { attended: number; total: number } | 'NEWCOMER';
export function reliabilityDisplay(attended: number, noShows: number, lateCancels = 0): ReliabilityDisplay {
  const total = attended + noShows + lateCancels;
  return total === 0 ? 'NEWCOMER' : { attended, total };
}

export const ATTENDANCE_DISPUTE_STATUSES = ['OPEN', 'ACCEPTED', 'REJECTED'] as const;
export type AttendanceDisputeStatus = (typeof ATTENDANCE_DISPUTE_STATUSES)[number];

// ---------------------------------------------------------------- tranche d'âge affichée (§3.1)
/** Jamais l'âge exact dans une sortie : une tranche. */
export const AGE_RANGES = ['18_24', '25_29', '30_34', '35_39', '40_49', '50_PLUS'] as const;
export type AgeRange = (typeof AGE_RANGES)[number];
export function ageRangeOf(age: number): AgeRange {
  if (age < 25) return '18_24';
  if (age < 30) return '25_29';
  if (age < 35) return '30_34';
  if (age < 40) return '35_39';
  if (age < 50) return '40_49';
  return '50_PLUS';
}

// ---------------------------------------------------------------- team (V5.1 B.7)
/** Une team = 1 à 3 personnes qui viennent ensemble, composées comme une unité indivisible. */
export const TEAM_STATUSES = ['FORMING', 'ACTIVE', 'DISSOLVED'] as const;
export type TeamStatus = (typeof TEAM_STATUSES)[number];
export const TEAM_SIZE_CAP = 3;

/** Aperçu anonyme du groupe avant « Je viens » (C.10) : ni prénoms ni photos. */
export interface OutingCompositionPreview {
  size: number;
  ageMin: number;
  ageMax: number;
  /** Répartition des genres déclarés (comptes agrégés). */
  genders: Partial<Record<'WOMAN' | 'MAN' | 'NON_BINARY' | 'UNDISCLOSED', number>>;
  /** Nombre de teams (≥ 2 personnes venant ensemble). */
  teams: number;
}

// ---------------------------------------------------------------- V5.2 (C.9) : grille d'âge fixe
/**
 * Grille d'âge FIXE (jamais centrée sur la personne, jamais d'âge exact) : 18–21, 22–25, 26–29,
 * 30–34, 35–39, 40–44, 45–49, 50+. Remplace `AGE_RANGES` pour l'affichage V5.2 (ajout rétrocompatible).
 */
export const AGE_BRACKETS_V52 = ['18_21', '22_25', '26_29', '30_34', '35_39', '40_44', '45_49', '50_PLUS'] as const;
export type AgeBracketV52 = (typeof AGE_BRACKETS_V52)[number];
const BRACKET_BOUNDS: Readonly<Record<AgeBracketV52, readonly [number, number]>> = {
  '18_21': [18, 21],
  '22_25': [22, 25],
  '26_29': [26, 29],
  '30_34': [30, 34],
  '35_39': [35, 39],
  '40_44': [40, 44],
  '45_49': [45, 49],
  '50_PLUS': [50, 99],
};
export function ageBracketOf(age: number): AgeBracketV52 {
  return AGE_BRACKETS_V52.find((b) => age <= BRACKET_BOUNDS[b][1]) ?? '50_PLUS';
}
/** Bornes d'une tranche (aperçu du groupe = union des tranches, jamais les âges exacts). */
export const ageBracketBounds = (b: AgeBracketV52): readonly [number, number] => BRACKET_BOUNDS[b];
