/**
 * Port de persistance du module `connections` (spec-v5 §2.11–2.12) : duos, rendez-vous, bulletins,
 * essais de check-in, liens de bande (`Friendship` V5), propositions voie Duo (branche DUO_LANE de
 * `MatchProposal`). Lectures seules ailleurs : messages publiés d'un chat DUO (compteurs), souvenirs
 * du pet (« Ta rue »), intentions (moteur seulement — jamais exposées).
 */
import type { ConnectionKind, DuoDateStatus, DuoOrigin, DuoStatus, Gender, KidsSomeday, LookingFor, MeetingMode, PetMemoryKind, StorySeriousness, VoteChoice } from '@blowy/domain';
import type { PersonFacts } from '../../../outings/domain/facts.js';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { LaneCandidate } from '../../domain/lane.js';

export interface DuoRow {
  id: string;
  userLowId: string;
  userHighId: string;
  origin: DuoOrigin;
  status: DuoStatus;
  exchangeEndsAt: Date | null;
  dateDeadline: Date | null;
  messagesLow: number;
  messagesHigh: number;
  datesAttended: number;
  together: boolean;
  eggOptInLow: boolean;
  eggOptInHigh: boolean;
  endedAt: Date | null;
  proposalId: string | null;
  createdAt: Date;
  conversationId: string | null;
}

export interface DuoDateRow {
  id: string;
  duoId: string;
  proposedByUserId: string;
  venueId: string;
  startsAt: Date;
  endsAt: Date;
  status: DuoDateStatus;
  checkinLowAt: Date | null;
  checkinHighAt: Date | null;
  votesCloseAt: Date | null;
  votesClosedAt: Date | null;
  cancelledByUserId: string | null;
  lateCancel: boolean;
}

export interface VenueRow {
  id: string;
  name: string;
  address: string;
  neighborhoodId: string;
  timezone: string;
  lat: number;
  lng: number;
  secretRef: string;
}

export interface LaneProposalRow {
  id: string;
  userLowId: string;
  userHighId: string;
  petLowId: string;
  petHighId: string;
  visionScore: number;
  status: 'OPEN' | 'ACCEPTED' | 'EXPIRED' | 'INVALIDATED';
  expiresAt: Date;
  acceptedBy: string[];
  passedBy: string[];
  duoId: string | null;
}

/** Intentions (moteur seulement, jamais sérialisées vers autrui). */
export interface SeeksFacts {
  gender: Gender;
  lookingFor: LookingFor;
  storySeriousness: StorySeriousness | null;
  kidsSomeday: KidsSomeday | null;
  meetingMode: MeetingMode | null;
  meetGenders: Gender[];
  romanceGenders: Gender[];
  age: number;
  groupAge: { min: number; max: number };
}

export interface BandLinkRow {
  id: string;
  userLowId: string;
  userHighId: string;
  status: 'PENDING' | 'ACTIVE' | 'WITHDRAWN';
  origin: string | null;
  conversationId: string | null;
}

export interface MemoryRow {
  id: string;
  kind: PetMemoryKind;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface LaneZone {
  zoneId: string;
  timezone: string;
}

export interface ConnectionsRepository {
  // ------------------------------------------------------------ duos
  duo(scope: TxScope | null, duoId: string): Promise<DuoRow | null>;
  /** Duos visibles par moi : non terminaux + expirés depuis moins de `readOnlySince`. */
  duosOf(userId: string, readOnlySince: Date): Promise<DuoRow[]>;
  activeDuoCount(scope: TxScope | null, userId: string): Promise<number>;
  activeLaneDuoCount(scope: TxScope | null, userId: string): Promise<number>;
  createDuo(scope: TxScope, d: { id: string; low: string; high: string; origin: DuoOrigin; status: DuoStatus; exchangeEndsAt: Date | null; dateDeadline: Date | null; proposalId: string | null }): Promise<boolean>;
  updateDuo(scope: TxScope, duoId: string, patch: Partial<Pick<DuoRow, 'status' | 'messagesLow' | 'messagesHigh' | 'datesAttended' | 'together' | 'eggOptInLow' | 'eggOptInHigh' | 'endedAt'>>): Promise<void>;
  conversationOfDuo(scope: TxScope | null, duoId: string): Promise<string | null>;
  /** Messages humains publiés (visibles) par auteur dans le chat du duo, avant `until` si fourni. */
  humanMessageCounts(scope: TxScope | null, conversationId: string, until: Date | null): Promise<Map<string, number>>;
  /** Duos dont une transition temporelle est due (échange, échéance, RDV, votes). */
  dueDuos(at: Date, limit: number): Promise<string[]>;
  /** Duos expirés dont la lecture seule (7 j) est finie et dont l'accès n'est pas encore retiré. */
  expiredToRevoke(before: Date, limit: number): Promise<{ duoId: string; conversationId: string | null; users: [string, string] }[]>;
  markRevoked(scope: TxScope, duoId: string): Promise<void>;
  /** Duos non terminaux entre deux personnes (blocage). */
  liveDuosBetween(scope: TxScope, a: string, b: string): Promise<DuoRow[]>;

  // ------------------------------------------------------------ rendez-vous
  date(scope: TxScope | null, dateId: string): Promise<DuoDateRow | null>;
  /** RDV vivant (PROPOSED/CONFIRMED) ou dernier RDV DONE aux votes ouverts. */
  currentDate(scope: TxScope | null, duoId: string): Promise<DuoDateRow | null>;
  liveDate(scope: TxScope | null, duoId: string): Promise<DuoDateRow | null>;
  createDate(scope: TxScope, d: { id: string; duoId: string; proposedByUserId: string; venueId: string; startsAt: Date; endsAt: Date }): Promise<void>;
  updateDate(scope: TxScope, dateId: string, patch: Partial<Pick<DuoDateRow, 'status' | 'checkinLowAt' | 'checkinHighAt' | 'votesCloseAt' | 'votesClosedAt' | 'cancelledByUserId' | 'lateCancel'>> & { ballotsPurgedAt?: Date }): Promise<void>;
  venue(venueId: string): Promise<VenueRow | null>;
  /** Lieux partenaires actifs des quartiers de ces personnes. */
  venuesFor(userIds: string[]): Promise<VenueRow[]>;
  checkInAttempts(scope: TxScope, dateId: string, userId: string, method: 'GEO' | 'VENUE_CODE'): Promise<number>;
  recordCheckInAttempt(scope: TxScope, a: { dateId: string; userId: string; method: 'GEO' | 'VENUE_CODE'; result: 'ACCEPTED' | 'TOO_FAR' | 'LOW_ACCURACY' | 'CODE_INVALID'; accuracyBucket: 'LE_50' | 'LE_150' | 'GT_150' | null }): Promise<void>;
  ballots(scope: TxScope | null, dateId: string): Promise<Map<string, VoteChoice>>;
  saveBallot(scope: TxScope, dateId: string, voterId: string, choice: VoteChoice): Promise<void>;
  datesToPurge(before: Date, limit: number): Promise<string[]>;
  purgeBallots(scope: TxScope, dateId: string): Promise<number>;
  createReveal(scope: TxScope, r: { id: string; dateId: string; low: string; high: string; kind: ConnectionKind; friendshipId: string | null; duoId: string | null }): Promise<boolean>;

  // ------------------------------------------------------------ bande (Friendship V5)
  bandLink(scope: TxScope | null, linkId: string): Promise<BandLinkRow | null>;
  activeBandLinksBetween(scope: TxScope, a: string, b: string): Promise<BandLinkRow[]>;
  withdrawBandLink(scope: TxScope, linkId: string, reason: 'LEFT' | 'BLOCKED'): Promise<void>;
  ensureBandLink(scope: TxScope, l: { id: string; low: string; high: string; duoId: string; invitedById: string }): Promise<{ id: string; created: boolean }>;
  memories(userId: string, limit: number): Promise<MemoryRow[]>;
  /** « Ta rue » (V5.3 F.24) : ordre choisi de mes souvenirs ; cadeaux reçus ; accessoires gagnés. */
  streetArrangement(userId: string): Promise<string[]>;
  setStreetArrangement(scope: TxScope, userId: string, memoryIds: string[]): Promise<void>;
  receivedGifts(userId: string, limit: number): Promise<{ fromUserId: string; linkId: string; accessoryId: string; createdAt: Date }[]>;
  createGift(scope: TxScope, g: { fromUserId: string; toUserId: string; linkId: string; accessoryId: string }): Promise<boolean>;
  hasAccessory(scope: TxScope | null, userId: string, accessoryId: string): Promise<boolean>;

  // ------------------------------------------------------------ personnes
  persons(userIds: string[], at: Date): Promise<Map<string, PersonFacts>>;
  seeks(userIds: string[], at: Date): Promise<Map<string, SeeksFacts>>;
  verified(scope: TxScope | null, userId: string, at: Date): Promise<boolean>;
  timezoneOf(userId: string): Promise<string>;

  // ------------------------------------------------------------ voie Duo (branche DUO_LANE)
  laneZones(): Promise<LaneZone[]>;
  /** Candidats d'une zone (voie activée, actifs, vérifiés, pet + vision) ; capacité calculée par l'appelant. */
  laneCandidates(zoneId: string, at: Date): Promise<Omit<LaneCandidate, 'capacity'>[]>;
  /** Paires exclues : bloquées/signalées, déjà vues (bande, duo, sortie), proposées depuis `since`. */
  laneExcludedPairs(userIds: string[], since: Date): Promise<Set<string>>;
  openLaneProposalCount(scope: TxScope | null, userId: string, at: Date): Promise<number>;
  startLaneBatch(scope: TxScope, b: { id: string; zoneId: string; localDate: string; algoVersion: string; tuningVersion: string }): Promise<boolean>;
  finishLaneBatch(scope: TxScope, id: string, stats: Record<string, unknown>): Promise<void>;
  createLaneProposal(scope: TxScope, p: { id: string; batchId: string; userA: string; petA: string; userB: string; petB: string; visionScore: number; expiresAt: Date }): Promise<boolean>;
  laneProposal(scope: TxScope | null, id: string): Promise<LaneProposalRow | null>;
  laneProposalsFor(userId: string, at: Date): Promise<LaneProposalRow[]>;
  acceptLaneProposal(scope: TxScope, proposalId: string, userId: string): Promise<void>;
  passLaneProposal(scope: TxScope, proposalId: string, userId: string): Promise<void>;
  setLaneProposalStatus(scope: TxScope, id: string, status: LaneProposalRow['status']): Promise<void>;
}
export const CONNECTIONS_REPOSITORY = Symbol('ConnectionsRepository');
