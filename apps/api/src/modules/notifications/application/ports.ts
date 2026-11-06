/**
 * Ports du module `notifications` (T8). Le module écrit ses tables (`Notification`,
 * `NotificationPreference`) ; deux ajouts minimaux hors module, listés au handoff :
 * `DeviceSession.pushToken` (jeton de l'appareil) et `PrivacySettings.discreetMode`.
 * Tout le reste est LU (sorties, duos, conversations, pause) par `NotificationFactsReader`.
 */
import type { NotificationCategoryV5 } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import type { PushKey } from '../domain/catalog.js';
import type { SuppressReason } from '../domain/policy.js';
import type { RenderedPush } from '../domain/render.js';

/** Références (identifiants seulement — jamais de texte, de vote, de position). */
export interface NotificationRefs {
  outingId?: string;
  seatId?: string;
  duoId?: string;
  duoDateId?: string;
  conversationId?: string;
  /** Messages : instant à partir duquel un message publié d'autrui déclenche l'envoi. */
  since?: string;
  teamId?: string;
  otherUserId?: string;
  weekKey?: string;
  pausedUntil?: string;
  /** Messages regroupés depuis la création (statistique, jamais affichée). */
  count?: number;
}

export interface NewNotification {
  id: string;
  userId: string;
  key: PushKey;
  dedupKey: string;
  groupKey?: string | null;
  deliverAt: Date;
  expiresAt: Date | null;
  refs: NotificationRefs;
  localDay: string;
  /** Trace sans envoi (ex. plafond hebdo des propositions). */
  suppressed?: SuppressReason;
}

export interface StoredNotification {
  id: string;
  userId: string;
  key: PushKey;
  dedupKey: string;
  groupKey: string | null;
  deliverAt: Date;
  expiresAt: Date | null;
  refs: NotificationRefs;
  attempts: number;
  createdAt: Date;
}

export interface DeviceToken {
  sessionId: string;
  token: string;
}

export interface NotificationRepository {
  insert(scope: TxScope, rows: NewNotification[]): Promise<number>;
  countByDedupPrefix(scope: TxScope, userId: string, prefix: string): Promise<number>;
  pendingInGroup(scope: TxScope, userId: string, groupKey: string): Promise<{ id: string; refs: NotificationRefs } | null>;
  lastSentInGroup(scope: TxScope, userId: string, groupKey: string): Promise<Date | null>;
  updateRefs(scope: TxScope, id: string, refs: NotificationRefs): Promise<void>;
  /** Une notification (envoyée ou en file) existe déjà pour l'une de ces clés. */
  anyActive(userId: string, dedupKeys: string[]): Promise<boolean>;
  /** Réserve les notifications dues (FOR UPDATE SKIP LOCKED + bail court). */
  claimDue(now: Date, limit: number, leaseMs: number): Promise<StoredNotification[]>;
  markSent(id: string, at: Date, localDay: string): Promise<void>;
  markSuppressed(id: string, reason: SuppressReason, at: Date): Promise<void>;
  defer(id: string, until: Date, localDay: string, attempts?: number): Promise<void>;
  markFailed(id: string, at: Date): Promise<void>;
  sentToday(userId: string, localDay: string): Promise<number>;
  suppressQueuedOf(scope: TxScope, userId: string, reason: SuppressReason): Promise<number>;
  preferences(userId: string): Promise<Map<NotificationCategoryV5, boolean>>;
  setPreferences(scope: TxScope, userId: string, toggles: Partial<Record<NotificationCategoryV5, boolean>>): Promise<void>;
  activeTokens(userId: string, now: Date): Promise<DeviceToken[]>;
  sessionHasToken(sessionId: string): Promise<boolean>;
  /** Rattache le jeton à la session ; le retire de toute autre session (appareil passé à un autre compte). */
  setToken(scope: TxScope, i: { sessionId: string; userId: string; token: string; platform: string }): Promise<void>;
  clearSessionToken(scope: TxScope, sessionId: string, userId: string): Promise<void>;
  /** Jeton refusé par le fournisseur (`DeviceNotRegistered`). */
  forgetToken(token: string): Promise<void>;
  clearAllTokens(scope: TxScope, userId: string): Promise<void>;
  discreetMode(userId: string): Promise<boolean>;
  setDiscreetMode(scope: TxScope, userId: string, on: boolean): Promise<void>;
}
export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');

export interface SeatFacts {
  id: string;
  userId: string;
  status: string;
  acceptDeadline: Date;
}
export interface OutingFacts {
  id: string;
  kind: string;
  status: string;
  weekKey: string;
  tz: string;
  venueName: string;
  startsAt: Date;
  acceptDeadline: Date;
  lockAt: Date;
  photoRevealAt: Date;
  checkinOpensAt: Date;
  checkinClosesAt: Date;
  votesCloseAt: Date;
  votesClosedAt: Date | null;
  seats: SeatFacts[];
}
export interface DuoFacts {
  id: string;
  status: string;
  userIds: [string, string];
  exchangeEndsAt: Date | null;
  dateDeadline: Date | null;
}
export interface DuoDateFacts {
  id: string;
  duoId: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  votesCloseAt: Date | null;
  votesClosedAt: Date | null;
  tz: string;
  venueName: string;
  proposedByUserId: string;
  userIds: [string, string];
  checkedIn: string[];
}
export interface PersonFacts {
  userId: string;
  firstName: string;
  petName: string | null;
  tz: string;
}
export interface ConversationFacts {
  id: string;
  kind: string;
  outingId: string | null;
  closedAt: Date | null;
  members: { userId: string; revokedAt: Date | null }[];
}

export interface NotificationFactsReader {
  outing(id: string): Promise<OutingFacts | null>;
  duo(id: string): Promise<DuoFacts | null>;
  duoDate(id: string): Promise<DuoDateFacts | null>;
  people(ids: string[]): Promise<Map<string, PersonFacts>>;
  conversation(id: string): Promise<ConversationFacts | null>;
  messageAuthor(id: string): Promise<{ conversationId: string; authorUserId: string | null; kind: string } | null>;
  /** Dernier message humain VISIBLE (publié/averti) d'autrui depuis `since` ; sinon s'il en reste en modération. */
  visibleMessageSince(conversationId: string, excludeUserId: string, since: Date): Promise<{ authorUserId: string } | 'PENDING' | null>;
  reveals(sourceKind: 'OUTING' | 'DUO_DATE', sourceId: string): Promise<{ users: [string, string]; result: 'FRIEND' | 'PLUS' }[]>;
  hasBallot(outingId: string, userId: string): Promise<boolean>;
  teamMembers(teamId: string): Promise<string[] | null>;
  reliabilityPausedUntil(userId: string): Promise<Date | null>;
  seat(seatId: string): Promise<{ outingId: string; userId: string } | null>;
  /** Place confirmée (ou RDV duo confirmé) qui commence le jour local `day`. */
  hasOutingOnDay(userId: string, day: string, tz: string, now: Date): Promise<boolean>;
  pauseActive(userId: string, now: Date): Promise<boolean>;
  timezone(userId: string): Promise<string>;
}
export const NOTIFICATION_FACTS = Symbol('NotificationFactsReader');

/** Message prêt pour le fournisseur (un par jeton). */
export interface PushMessage {
  to: string;
  userId: string;
  push: RenderedPush;
  /** Durée de vie côté fournisseur (s). */
  ttlSeconds: number;
}
export type PushTicket = { ok: true } | { ok: false; permanent: boolean; deviceGone: boolean };

/** Port d'envoi (Strategy) : Expo réel, boîte locale (dev), désactivé (prod sans clé). */
export interface PushSender {
  readonly kind: 'expo' | 'local' | 'disabled';
  send(messages: PushMessage[]): Promise<PushTicket[]>;
}
export const PUSH_SENDER = Symbol('PushSender');
