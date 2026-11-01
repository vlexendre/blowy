import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export interface SideRow {
  id: string;
  userId: string;
  petId: string;
  active: boolean;
  exclusive: boolean;
  desire: number;
  replyOwedSince: Date | null;
  replyOwedEpisode: string | null;
}

export interface ContextRow {
  id: string;
  pairId: string;
  type: 'DATE' | 'NEIGHBORHOOD' | 'GROUP' | 'COPARENT';
  status: 'ACTIVE' | 'MOVED_IN' | 'PAUSED' | 'LEGACY' | 'ENDED';
  branch: 'UNDECIDED' | 'FRIEND' | 'PLUS';
  affinity: number;
  xpMilli: number;
  eligibleLevel: number;
  reachedLevel: number;
  complicity: number;
  tension: number;
  dateSpotKey: string | null;
  timezone: string;
  legacy: boolean;
  startedAt: Date;
  endedAt: Date | null;
  version: number;
  sides: SideRow[];
  conversationId: string | null;
}

export interface OfferRow {
  id: string;
  scope: 'MOVE_IN' | 'BRANCH_VOTE' | 'PHOTO_REVEAL' | 'PHOTO_ORIGINAL' | 'IRL_DATE' | 'EGG' | 'TRANSFER_TO_NEIGHBORHOOD';
  version: number;
  proposedBy: string;
  status: 'OPEN' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'SUPERSEDED' | 'CANCELLED';
  expiresAt: Date;
  responses: { userId: string; decision: 'ACCEPT' | 'DECLINE' }[];
}

export interface RoundRow {
  id: string;
  roundNo: number;
  status: 'OPEN' | 'RESOLVED' | 'EXPIRED';
  deadlineAt: Date;
  result: 'UNDECIDED' | 'FRIEND' | 'PLUS' | null;
}

export interface NewContext {
  id: string;
  pairId: string;
  affinity: number;
  dateSpotKey: string | null;
  timezone: string;
  engineVersion: string;
  tuningVersion: string;
  complicity: number;
  tension: number;
  desire: number;
  sides: { userId: string; petId: string }[];
  conversationId: string;
}

export interface RelationshipRepository {
  load(scope: TxScope | null, contextId: string): Promise<ContextRow | null>;
  listForUser(userId: string, includeEnded: boolean): Promise<ContextRow[]>;
  /** Contextes DATE non terminés d'un utilisateur (capacité, exclusivité). */
  liveDateContextsOf(scope: TxScope, userId: string): Promise<ContextRow[]>;
  hasExclusive(scope: TxScope, userId: string): Promise<boolean>;
  ensurePair(scope: TxScope, petA: string, petB: string): Promise<string>;
  existingLiveContext(scope: TxScope, pairId: string): Promise<string | null>;
  create(scope: TxScope, c: NewContext): Promise<void>;
  /** Ajoute un événement séquencé au journal (append-only). */
  appendEvent(scope: TxScope, contextId: string, e: { type: string; actorUserId: string | null; visibility?: 'PARTICIPANTS' | 'ACTOR_ONLY' | 'SYSTEM'; payload: Record<string, unknown>; engineVersion?: string; tuningVersion?: string }): Promise<{ id: string; seq: number }>;
  update(scope: TxScope, contextId: string, patch: Partial<Pick<ContextRow, 'status' | 'branch' | 'xpMilli' | 'eligibleLevel' | 'reachedLevel' | 'complicity' | 'tension' | 'legacy'>> & { endedAt?: Date; endReason?: string; movedInAt?: Date }): Promise<void>;
  deactivateSides(scope: TxScope, contextId: string): Promise<void>;
  setExclusive(scope: TxScope, contextId: string): Promise<void>;
  setReplyOwed(scope: TxScope, contextId: string, userId: string, since: Date | null, episode: string | null): Promise<void>;
  // Consentements (offres versionnées)
  openOffers(scope: TxScope | null, contextId: string, at: Date): Promise<OfferRow[]>;
  nextOfferVersion(scope: TxScope, contextId: string, offerScope: OfferRow['scope']): Promise<number>;
  createOffer(scope: TxScope, o: { id: string; contextId: string; scope: OfferRow['scope']; version: number; proposedBy: string; expiresAt: Date }): Promise<void>;
  respondOffer(scope: TxScope, offerId: string, userId: string, decision: 'ACCEPT' | 'DECLINE'): Promise<void>;
  setOfferStatus(scope: TxScope, offerId: string, status: OfferRow['status']): Promise<void>;
  supersedeOffersOf(scope: TxScope, contextIds: string[], offerScope: OfferRow['scope']): Promise<void>;
  // Votes (table séparée, jamais sérialisée vers l'autre)
  openRound(scope: TxScope | null, contextId: string): Promise<RoundRow | null>;
  createRound(scope: TxScope, r: { id: string; contextId: string; roundNo: number; deadlineAt: Date }): Promise<void>;
  lastRoundNo(scope: TxScope, contextId: string): Promise<number>;
  castBallot(scope: TxScope, roundId: string, userId: string, choice: 'FRIEND' | 'PLUS'): Promise<void>;
  /** Choix collectés (usage serveur uniquement : résolution). */
  ballotsOf(scope: TxScope, roundId: string): Promise<{ userId: string; choice: 'FRIEND' | 'PLUS' }[]>;
  myBallot(roundId: string, userId: string): Promise<'FRIEND' | 'PLUS' | null>;
  resolveRound(scope: TxScope, roundId: string, result: 'FRIEND' | 'PLUS', at: Date): Promise<void>;
  dueRounds(at: Date, limit: number): Promise<{ id: string; contextId: string }[]>;
  // Compteurs et contributions
  todayCounters(scope: TxScope, contextId: string, relDay: string): Promise<Record<string, { count: number; xpMilli: number }>>;
  addCounters(scope: TxScope, contextId: string, relDay: string, counters: Readonly<Record<string, { count: number; xpMilli: number }>>): Promise<void>;
  contributions(scope: TxScope, contextId: string, since: Date): Promise<Record<string, number>>;
  addContribution(scope: TxScope, c: { contextId: string; userId: string; kind: string; weight: number; dedupKey: string; occurredAt: Date }): Promise<boolean>;
  isPausedFor(scope: TxScope | null, contextId: string, userIds: string[], at: Date): Promise<{ any: boolean; byUser: Set<string> }>;
  photoPreferences(userIds: string[]): Promise<Map<string, 'FROM_LEVEL_4_WITH_CONSENT' | 'NEVER'>>;
  petLocations(petIds: string[]): Promise<Map<string, { kind: string; contextId: string | null }>>;
  /** Côtés devant une réponse depuis avant `before` (job ghosting). */
  replyDebtors(before: Date, limit: number): Promise<{ contextId: string; userId: string; since: Date; episode: string }[]>;
  silentContexts(lastActivityBefore: Date, limit: number): Promise<string[]>;
}
export const RELATIONSHIP_REPOSITORY = Symbol('RelationshipRepository');
