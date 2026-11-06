/**
 * Port de persistance du module `outings` (implémenté en Prisma). Le module est le seul écrivain de
 * ses tables (demandes, teams, sorties, places, check-ins, bulletins, accords, duos issus d'un vote,
 * liens de bande issus d'une sortie, fiabilité, contestations). Les conversations et souvenirs passent
 * par des ports d'autres modules.
 */
import type { ActivityKind, ConnectionKind, OutingCancelReason, OutingRequestStatus, OutingStatus, RefundState, SeatCancelKind, SeatFunding, SeatStatus, UnplacedReason, VoteChoice } from '@blowy/domain';
import type { CompositionFacts, OutingCandidate, SlotOffer } from '@blowy/matching/groups';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { OutingFacts, PersonFacts } from '../../domain/facts.js';
import type { ReliabilityState } from '../../domain/reliability.js';
import type { Attendee } from '../../domain/votes.js';

export interface NeighborhoodRef {
  id: string;
  name: string;
  status: 'WAITLIST' | 'LIVE' | 'PAUSED' | 'CLOSED';
  timezone: string;
  cityZoneId: string;
}

/** Ce qu'il faut savoir d'une personne pour ses préconditions de sortie. */
export interface RequesterFacts {
  userId: string;
  onboarded: boolean;
  intentionsSet: boolean;
  verified: boolean;
  hasPhoto: boolean;
  neighborhood: NeighborhoodRef | null;
  acceptableNeighborhoodIds: string[];
  availableSlotTemplateIds: string[];
  weeksOff: string[];
  /** V5.4 (B.9) : « une semaine sur deux » à partir de cette semaine ISO ; null = non. */
  everyOtherWeekOffFrom: string | null;
  /** V5.6 (B.13) : « un week-end sur deux » à partir de cette semaine ISO. */
  everyOtherWeekendOffFrom?: string | null;
  /** V5.6 (E11) : trajet max déclaré (20 / 30 / 45 min). */
  maxTravelMinutes?: number;
  activeTeamId: string | null;
  reliability: ReliabilityState | null;
}

export interface WeekSlot {
  startsAt: Date;
  isoWeekday: number;
  localMinute: number;
  neighborhoodId: string;
  templateId: string;
}

export interface RequestRow {
  id: string;
  userId: string;
  weekKey: string;
  status: OutingRequestStatus;
  slotStartsAt: Date[];
  teamId: string | null;
  missedWeeks: number;
  /** V5.5 (D-061). */
  mode?: 'NORMAL' | 'FRIENDS_THIS_WEEK';
  createdAt: Date;
}

export interface SeatRow {
  id: string;
  outingId: string;
  userId: string;
  weekKey: string;
  teamId: string | null;
  status: SeatStatus;
  funding: SeatFunding | null;
  acceptDeadline: Date;
  holdExpiresAt: Date | null;
  confirmedAt: Date | null;
  cancelKind: SeatCancelKind | null;
  refundState: RefundState;
  /** V5.6 (E22) : date d'annulation (compensation lieu d'une sortie de sécurité après la confirmation). */
  cancelledAt?: Date | null;
}

export interface OutingRow {
  id: string;
  status: OutingStatus;
  neighborhoodId: string;
  venueId: string;
  weekKey: string;
  startsAt: Date;
  capacity: number;
  acceptDeadline: Date;
  lockAt: Date;
  photoRevealAt: Date;
  checkinOpensAt: Date;
  checkinClosesAt: Date;
  votesCloseAt: Date;
  votesClosedAt: Date | null;
  ballotsPurgedAt: Date | null;
  activity: ActivityKind;
}

export interface NewOuting {
  id: string;
  neighborhoodId: string;
  weekKey: string;
  kind: 'WEEKLY' | 'SEEDING';
  venueSlotId: string;
  venueId: string;
  activity: ActivityKind;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  composedAt: Date;
  acceptDeadline: Date;
  lockAt: Date;
  photoRevealAt: Date;
  checkinOpensAt: Date;
  checkinClosesAt: Date;
  votesCloseAt: Date;
  compositionRunId: string;
  tuningVersion: string;
  algoVersion: string;
}

export interface CompositionScope {
  zoneId: string;
  timezone: string;
  /** Quartiers (LIVE pour l'hebdo ; ceux de la ville pour l'amorçage). */
  neighborhoodIds: string[];
}

export interface CandidateMeta {
  userId: string;
  requestId: string | null;
  teamId: string | null;
}

export interface TeamRow {
  id: string;
  cityZoneId: string;
  status: 'FORMING' | 'ACTIVE' | 'DISSOLVED';
  inviteCode: string;
  createdAt: Date;
  members: { userId: string; firstName: string; pet: PersonFacts['pet']; verified: boolean }[];
}

export interface BandLinkRow {
  linkId: string;
  otherUserId: string;
  origin: 'OUTING_VOTE' | 'DUO_VOTE' | 'PLUS_ONE' | 'LEGACY_V4';
  since: Date;
  conversationId: string | null;
  person: PersonFacts;
}

export interface OutingsRepository {
  // ------------------------------------------------------------ lecture
  requester(scope: TxScope | null, userId: string, at: Date): Promise<RequesterFacts | null>;
  weekSlots(neighborhoodIds: string[], weekKey: string, timezone: string): Promise<WeekSlot[]>;
  request(scope: TxScope | null, userId: string, weekKey: string): Promise<RequestRow | null>;
  /**
   * D-052 (§2.4) : personnes actives et onboardées, avec un quartier ouvert (LIVE/WAITLIST) et au moins un
   * créneau coché, sans demande pour `weekKey` (une demande retirée n'est jamais recréée). Triées par id.
   */
  autoRequestCandidates(weekKey: string, limit: number): Promise<string[]>;
  /** Place active (ou la plus récente) d'une personne pour une semaine. */
  seatOfWeek(scope: TxScope | null, userId: string, weekKey: string): Promise<SeatRow | null>;
  /** Faits complets d'une sortie (toutes les places, personnes, pets, lieu). */
  outingFacts(scope: TxScope | null, outingId: string, at: Date): Promise<OutingFacts | null>;
  outing(scope: TxScope | null, outingId: string): Promise<OutingRow | null>;
  seat(scope: TxScope | null, outingId: string, userId: string): Promise<SeatRow | null>;
  seats(scope: TxScope | null, outingId: string): Promise<SeatRow[]>;
  /** Personnes bloquées dans un sens ou l'autre avec `userId`, parmi `others`. */
  blockedAmong(userId: string, others: string[]): Promise<Set<string>>;
  /** Liens actifs (bande ACTIVE, duo non terminal) de `userId` parmi `others`. */
  linkedAmong(userId: string, others: string[]): Promise<Set<string>>;
  /** Une sortie a déjà été financée FREE_FIRST (non recréditée) pour cette personne. */
  usedFreeFirst(scope: TxScope, userId: string): Promise<boolean>;
  history(userId: string, before: { startsAt: Date; id: string } | null, limit: number): Promise<{ id: string; weekKey: string; startsAt: Date; venueName: string; attended: boolean; memoryId: string | null }[]>;
  reliability(scope: TxScope | null, userId: string): Promise<ReliabilityState | null>;
  /** Le lecteur peut-il voir la photo de `ownerId` maintenant (sortie révélée ou lien actif) ? */
  photoRevealAllowed(viewerId: string, ownerId: string, at: Date): Promise<boolean>;
  /** Appartenance pour la salle WS `outing:<id>` / `duo:<id>`. */
  outingRoomMember(userId: string, outingId: string, at: Date): Promise<boolean>;
  duoRoomMember(userId: string, duoId: string): Promise<boolean>;

  // ------------------------------------------------------------ demandes
  upsertRequest(scope: TxScope, r: { id: string; userId: string; neighborhoodId: string; weekKey: string; slotStartsAt: Date[]; teamId: string | null; missedWeeks: number; mode?: 'NORMAL' | 'FRIENDS_THIS_WEEK' }): Promise<RequestRow>;
  setRequestStatus(scope: TxScope, id: string, status: OutingRequestStatus, unplacedReason?: UnplacedReason | null): Promise<void>;
  /** Semaines manquées consécutives (non placé·e, sortie annulée par Blowy) avant `weekKey`. */
  missedWeeksBefore(scope: TxScope, userId: string, weekKey: string): Promise<number>;

  // ------------------------------------------------------------ composition
  liveScopes(): Promise<CompositionScope[]>;
  /** Villes sans quartier LIVE ayant au moins une team ACTIVE (amorçage). */
  seedingScopes(): Promise<CompositionScope[]>;
  runExists(scopeKey: string, weekKey: string, kind: 'WEEKLY' | 'SEEDING' | 'ROLLING'): Promise<boolean>;
  /** Génère (idempotent) les créneaux des lieux actifs pour une semaine. */
  ensureVenueSlots(neighborhoodIds: string[], weekKey: string, timezone: string): Promise<number>;
  slotOffers(neighborhoodIds: string[], from: Date, to: Date): Promise<SlotOffer[]>;
  weeklyCandidates(scope: CompositionScope, weekKey: string, at: Date): Promise<{ candidates: OutingCandidate[]; meta: CandidateMeta[] }>;
  seedingCandidates(scope: CompositionScope, offers: SlotOffer[], at: Date): Promise<{ candidates: OutingCandidate[]; meta: CandidateMeta[] }>;
  compositionFacts(userIds: string[]): Promise<CompositionFacts>;
  createRun(scope: TxScope, r: { id: string; scopeKey: string; weekKey: string; kind: 'WEEKLY' | 'SEEDING' | 'ROLLING'; algoVersion: string; tuningVersion: string; seed: string; slotDate?: string | null }): Promise<boolean>;
  finishRun(scope: TxScope, id: string, stats: Record<string, unknown>): Promise<void>;
  /** Réserve une table sur le créneau (garde de capacité) ; false si plein. */
  reserveVenueSlot(scope: TxScope, venueSlotId: string): Promise<boolean>;
  releaseVenueSlot(scope: TxScope, outingId: string): Promise<void>;
  createOuting(scope: TxScope, o: NewOuting): Promise<void>;
  /** Crée une place INVITED ; false si la personne a déjà une place active cette semaine. */
  createSeat(scope: TxScope, s: { id: string; outingId: string; userId: string; weekKey: string; teamId: string | null; acceptDeadline: Date }): Promise<boolean>;

  // ------------------------------------------------------------ places et sortie
  updateSeat(scope: TxScope, seatId: string, data: Partial<Pick<SeatRow, 'status' | 'funding' | 'holdExpiresAt' | 'cancelKind' | 'refundState'>> & { paymentRef?: string | null; creditRef?: string | null; confirmedAt?: Date; respondedAt?: Date; cancelledAt?: Date; checkedInAt?: Date; refundRef?: string | null }): Promise<void>;
  setOutingStatus(scope: TxScope, outingId: string, status: OutingStatus, extra?: { cancelReason?: OutingCancelReason; votesClosedAt?: Date; ballotsPurgedAt?: Date }): Promise<void>;
  /** Sorties dont une transition temporelle est due. */
  dueOutings(at: Date, limit: number): Promise<string[]>;
  /** Invitations dont l'échéance est passée. */
  expiredInvitations(at: Date, limit: number): Promise<{ outingId: string; seatId: string; userId: string }[]>;
  /** Demandes non placées disponibles pour un créneau (backfill §4.6). */
  backfillPool(outingId: string, at: Date): Promise<{ members: OutingCandidate[]; pool: OutingCandidate[]; meta: CandidateMeta[]; slot: Pick<SlotOffer, 'startsAtMs' | 'neighborhoodId' | 'activity'> } | null>;
  outingsWithFreePlaces(at: Date, limit: number): Promise<string[]>;

  // ------------------------------------------------------------ check-in
  venueSecretRef(outingId: string): Promise<{ ref: string; lat: number; lng: number } | null>;
  checkInAttempts(scope: TxScope, seatId: string, method: 'GEO' | 'VENUE_CODE'): Promise<number>;
  recordCheckInAttempt(scope: TxScope, a: { seatId: string; method: 'GEO' | 'VENUE_CODE'; result: 'ACCEPTED' | 'TOO_FAR' | 'LOW_ACCURACY' | 'CODE_INVALID'; accuracyBucket: 'LE_50' | 'LE_150' | 'GT_150' | null }): Promise<void>;
  recordCheckIn(scope: TxScope, seatId: string, method: 'GEO' | 'VENUE_CODE' | 'STAFF'): Promise<boolean>;

  // ------------------------------------------------------------ votes
  attendees(scope: TxScope | null, outingId: string, at: Date): Promise<Attendee[]>;
  myBallots(scope: TxScope | null, outingId: string, voterId: string): Promise<Map<string, VoteChoice>>;
  saveBallots(scope: TxScope, outingId: string, voterId: string, choices: Map<string, VoteChoice>): Promise<void>;
  allBallots(scope: TxScope, outingId: string): Promise<Map<string, VoteChoice>>;
  purgeBallots(scope: TxScope, outingId: string): Promise<number>;
  /** Accords mutuels révélés pour ce lecteur sur cette sortie. */
  myReveals(outingId: string, userId: string): Promise<Map<string, ConnectionKind>>;
  createReveal(scope: TxScope, r: { id: string; outingId: string; low: string; high: string; kind: ConnectionKind; friendshipId: string | null; duoId: string | null }): Promise<boolean>;
  /** Lien de bande (Friendship) : crée ou réactive ; renvoie l'id et s'il est nouveau. */
  ensureBandLink(scope: TxScope, l: { id: string; low: string; high: string; origin: 'OUTING_VOTE' | 'PLUS_ONE'; outingId: string; invitedById: string }): Promise<{ id: string; created: boolean }>;
  createDuo(scope: TxScope, d: { id: string; low: string; high: string; outingId: string }): Promise<{ id: string; created: boolean }>;
  outingsToClose(at: Date, limit: number): Promise<string[]>;
  outingsToPurge(at: Date, retentionDays: number, limit: number): Promise<string[]>;
  chatsToRevoke(at: Date, readOnlyDays: number, limit: number): Promise<{ outingId: string; members: string[] }[]>;
  chatsToPurge(at: Date, purgeDays: number, limit: number): Promise<string[]>;

  // ------------------------------------------------------------ fiabilité
  saveReliability(scope: TxScope, userId: string, s: ReliabilityState): Promise<void>;
  reliabilityEvent(scope: TxScope, e: { userId: string; reason: 'OUTING_ATTENDED' | 'OUTING_NO_SHOW' | 'OUTING_LATE_CANCEL' | 'DUO_NO_SHOW' | 'RELIABILITY_PAUSE'; episodeKey: string }): Promise<boolean>;
  createDispute(scope: TxScope, d: { id: string; seatId: string; userId: string; note: string }): Promise<boolean>;

  // ------------------------------------------------------------ V5.2
  /** Intentions (moteur seulement) des places actives : compatibilité « histoire » du lecteur. */
  seeksOfActiveSeats(outingId: string, at: Date): Promise<Attendee[]>;
  knowsSomeoneSince(scope: TxScope, userId: string, since: Date): Promise<number>;
  /** V5.4 (B.8) : « imprévus » (places `CANCELLED/EMERGENCY`) de la personne depuis `since`. */
  emergencyCancelsSince(scope: TxScope | null, userId: string, since: Date): Promise<number>;
  /** Fuseau IANA du quartier d'une sortie. */
  outingTimezone(scope: TxScope | null, outingId: string): Promise<string>;
  createKnowsSomeone(scope: TxScope, r: { id: string; seatId: string; userId: string; targetUserId: string; status: 'AUTO_ACCEPTED' | 'IN_REVIEW' | 'SAFETY_REVIEW' }): Promise<void>;
  /** Lien réel déjà connu dans l'app : amitié/bande (même V4 ou retirée), duo, blocage. */
  knownRelation(a: string, b: string): Promise<boolean>;
  /** V5.6 (E11) : quartiers atteignables depuis `home` en ≤ `maxMinutes` (table `NeighborhoodTravelTime`). */
  reachableNeighborhoods(home: string, maxMinutes: number): Promise<string[]>;
  /** V5.7 (E30) : message d'accueil du lieu (null = aucun). */
  venueWelcomeMessage(venueId: string): Promise<string | null>;
  /** V5.6 (§7.5) : contexte de la vue sortie (ambiance et quartier du lieu ; quartier et activités du lecteur). */
  outingViewExtras(outingId: string, viewerId: string): Promise<{ venueId: string; venueAmbiance: 'CALM' | 'LIVELY' | null; neighborhoodId: string; activity: string; viewerHome: string | null; viewerActivities: string[] } | null>;
  /** V5.6 (E11) : temps de trajet typique de `from` vers `to` (null si inconnu). */
  travelMinutes(from: string, to: string): Promise<number | null>;
  /** Idem, en disant s'il s'agit d'une estimation (pas de ligne ops). */
  travelEstimate(from: string, to: string): Promise<{ minutes: number; estimated: boolean } | null>;
  /**
   * V5.6 (E18) : autres groupes CONFIRMÉS du même créneau (même heure, même ville) — pour déplacer une
   * personne qui connaît quelqu'un. Membres vivants avec leur genre (contrainte ≤ 3 du même genre).
   */
  siblingOutings(scope: TxScope, outing: OutingRow): Promise<{ outingId: string; venueId: string; capacity: number; acceptDeadline: Date; members: { userId: string; gender: string | null }[] }[]>;
  genderOf(scope: TxScope, userId: string): Promise<string | null>;
  /**
   * V5.6 (E18) : déplace une place confirmée vers un autre groupe (même financement, mêmes références de
   * paiement/crédit) : l'ancienne place passe `CANCELLED` / `SAFETY_EXIT` sans remboursement (rien n'est perdu),
   * la nouvelle est `CONFIRMED`. Renvoie l'identifiant de la nouvelle place.
   */
  relocateSeat(scope: TxScope, i: { seatId: string; toOutingId: string; newSeatId: string; acceptDeadline: Date }): Promise<string>;

  // ------------------------------------------------------------ T4 (safety, ajout minimal)
  /** Places non terminales d'une personne dans des sorties non terminées (retrait système). */
  activeSeatsOf(scope: TxScope, userId: string): Promise<SeatRow[]>;
  knowsSomeoneBySeat(scope: TxScope | null, seatId: string): Promise<{ id: string; seatId: string; outingId: string; userId: string; targetUserId: string; status: string } | null>;
  setKnowsSomeoneStatus(scope: TxScope, id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<void>;

  // ------------------------------------------------------------ T6 (admin ops, ajout minimal par port)
  seatById(scope: TxScope | null, seatId: string): Promise<SeatRow | null>;
  dispute(scope: TxScope | null, id: string): Promise<{ id: string; seatId: string; userId: string; status: 'OPEN' | 'ACCEPTED' | 'REJECTED' } | null>;
  setDisputeStatus(scope: TxScope, id: string, status: 'ACCEPTED' | 'REJECTED', staffUserId: string): Promise<void>;

  // ------------------------------------------------------------ teams
  teamOf(scope: TxScope | null, userId: string): Promise<TeamRow | null>;
  teamByCode(scope: TxScope | null, code: string): Promise<TeamRow | null>;
  teamById(scope: TxScope | null, id: string): Promise<TeamRow | null>;
  createTeam(scope: TxScope, t: { id: string; cityZoneId: string; createdById: string; inviteCode: string }): Promise<void>;
  addTeamMember(scope: TxScope, teamId: string, userId: string): Promise<boolean>;
  leaveTeam(scope: TxScope, teamId: string, userId: string): Promise<void>;
  setTeamStatus(scope: TxScope, teamId: string, status: 'FORMING' | 'ACTIVE' | 'DISSOLVED'): Promise<void>;
  teamHasActiveSeat(scope: TxScope, teamId: string, at: Date): Promise<boolean>;
  cityClosed(zoneId: string): Promise<boolean>;

  // ------------------------------------------------------------ bande
  band(userId: string, at: Date): Promise<BandLinkRow[]>;
}
export const OUTINGS_REPOSITORY = Symbol('OutingsRepository');
