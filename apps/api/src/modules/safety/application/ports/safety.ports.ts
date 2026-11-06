/**
 * Ports du module `safety` (implémentés en infrastructure). Le module écrit SES tables
 * (GuardianLink, GuardianPushSubscription, SafetyAlert, SafetyOkSignal, SafetySystemRemoval) ;
 * il LIT les sorties via `SubjectReader` (lecture seule) et ouvre les dossiers staff via
 * `SafetyCaseSink` (module trust). Aucun appel réseau sous transaction (Web Push = effet outbox).
 */
import type { GuardianSubjectKind } from '@blowy/domain';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { AlertFacts, SubjectFacts } from '../../domain/guardian.js';

export interface GuardianLinkRow {
  id: string;
  ownerUserId: string;
  subjectKind: GuardianSubjectKind;
  subjectId: string;
  label: string | null;
  activeFrom: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  lastViewedAt: Date | null;
  viewCount: number;
  createdAt: Date;
}

export interface AlertRow extends AlertFacts {
  userId: string;
  subjectKind: GuardianSubjectKind;
  subjectId: string;
  moderationCaseId: string | null;
  ackAt: Date | null;
  positionPurgeAfter: Date | null;
  positionPurgedAt: Date | null;
  handledById: string | null;
}

export interface SafetyRepository {
  // ---- liens
  createLink(scope: TxScope, l: { id: string; ownerUserId: string; subjectKind: GuardianSubjectKind; subjectId: string; tokenHash: string; label: string | null; activeFrom: Date; expiresAt: Date }): Promise<void>;
  countActiveLinks(scope: TxScope | null, ownerUserId: string, subjectKind: GuardianSubjectKind, subjectId: string, at: Date): Promise<number>;
  listLinks(ownerUserId: string, subjectKind: GuardianSubjectKind, subjectId: string): Promise<GuardianLinkRow[]>;
  loadLink(scope: TxScope | null, id: string): Promise<GuardianLinkRow | null>;
  linkByTokenHash(tokenHash: string): Promise<GuardianLinkRow | null>;
  /** Lecture comptée (sans IP ni empreinte). */
  touchLink(id: string, at: Date): Promise<void>;
  revokeLink(scope: TxScope, id: string, reason: string): Promise<boolean>;
  /** Révocation en masse ; renvoie le nombre de liens révoqués. */
  revokeLinksWhere(scope: TxScope, w: { ownerUserId?: string; subjectKind?: GuardianSubjectKind; subjectId?: string }, reason: string): Promise<number>;
  // ---- push du proche
  upsertPush(linkId: string, endpoint: string, purgeAfter: Date, at: Date): Promise<void>;
  pushEndpointsFor(ownerUserId: string, subjectKind: GuardianSubjectKind, subjectId: string, at: Date): Promise<{ linkId: string; endpoint: string }[]>;
  deletePush(linkId: string): Promise<void>;
  // ---- « tout va bien » et alertes
  addOk(scope: TxScope, o: { id: string; userId: string; subjectKind: GuardianSubjectKind; subjectId: string }): Promise<void>;
  oks(userId: string, subjectKind: GuardianSubjectKind, subjectId: string): Promise<Date[]>;
  alertsCountSince(scope: TxScope, userId: string, since: Date): Promise<number>;
  createAlert(scope: TxScope, a: { id: string; userId: string; subjectKind: GuardianSubjectKind; subjectId: string; position: { lat: number; lng: number; accuracyM: number } | null; positionPurgeAfter: Date | null }): Promise<void>;
  setAlertCase(scope: TxScope, alertId: string, caseId: string): Promise<void>;
  loadAlert(scope: TxScope | null, id: string): Promise<AlertRow | null>;
  alertsOf(userId: string, subjectKind: GuardianSubjectKind, subjectId: string): Promise<AlertRow[]>;
  listAlerts(q: { status?: 'OPEN' | 'SAFE' | 'HANDLED'; after?: { createdAt: Date; id: string } | null; limit: number }): Promise<AlertRow[]>;
  resolveAlert(scope: TxScope, id: string, status: 'SAFE' | 'HANDLED', by: string | null): Promise<boolean>;
  ackAlert(scope: TxScope, id: string): Promise<void>;
  // ---- retraits système
  recordRemoval(scope: TxScope, r: { id: string; outingId: string; seatId: string; removedUserId: string; triggeredByUserId: string; cause: 'BLOCK' | 'KNOWS_SOMEONE' }): Promise<void>;
  removalsSince(scope: TxScope, triggeredByUserId: string, since: Date): Promise<number>;
  // ---- « je pars, mal à l'aise » (V5.3 B.9)
  /** Crée la trace (une par place) ; `notifyGuardian` n'est jamais rétrogradé. Renvoie true si créée. */
  upsertUneasyLeave(scope: TxScope, l: { id: string; userId: string; outingId: string; seatId: string; notifyGuardian: boolean }): Promise<boolean>;
  /** Départs « mal à l'aise » depuis `since` (fenêtre `[T] safety.uncomfortableLeaveWindowDays`). */
  uneasyLeaveCount(scope: TxScope, userId: string, since?: Date): Promise<number>;
  // ---- rétention
  purgeAlertPositions(now: Date): Promise<number>;
  purgePushSubscriptions(now: Date): Promise<number>;
  purgeExpiredLinks(before: Date): Promise<number>;
}
export const SAFETY_REPOSITORY = Symbol('SafetyRepository');

/** Lecture seule des sujets (sorties ; RDV duo quand le module `connections` les publiera). */
export interface SubjectReader {
  subject(ownerUserId: string, kind: GuardianSubjectKind, id: string, scope?: TxScope | null): Promise<SubjectFacts | null>;
  /** Propriétaire d'une place (consommateur `outing.seat_cancelled`). */
  seatOwner(seatId: string): Promise<{ userId: string; outingId: string } | null>;
}
export const SUBJECT_READER = Symbol('SafetySubjectReader');

/** Dossiers staff (module trust) : alerte → SAFETY prioritaire ; examen « je connais quelqu'un ». */
export interface SafetyCaseSink {
  open(scope: TxScope, c: { subjectType: 'SAFETY_ALERT' | 'OUTING' | 'USER'; subjectId: string; subjectUserId: string | null; reasonCode: string; priority: 1 | 2 | 3; dueInMinutes: number }): Promise<string>;
  /** Clôt le dossier d'un sujet (alerte résolue par la personne elle-même). */
  resolveFor(scope: TxScope, subjectType: 'SAFETY_ALERT' | 'OUTING', subjectId: string): Promise<void>;
  /** Un dossier encore ouvert retient la position d'alerte (§8.5). */
  isOpen(caseId: string): Promise<boolean>;
  audit(scope: TxScope | null, a: { actorUserId: string | null; actorRole: string | null; action: string; targetType: string; targetId: string | null; reason: string | null; at: Date }): Promise<void>;
}
export const SAFETY_CASE_SINK = Symbol('SafetyCaseSink');

/** Web Push du proche : notification SANS contenu (l'ouverture affiche la page à jour). */
export interface GuardianPushSender {
  readonly configured: boolean;
  /** `gone` = abonnement expiré côté navigateur (à supprimer). */
  send(endpoint: string): Promise<'SENT' | 'GONE' | 'FAILED'>;
}
export const GUARDIAN_PUSH_SENDER = Symbol('GuardianPushSender');

/** Débit dédié (alertes 10/h : jamais bloquées par le limiteur global ; page publique). */
export interface SafetyRateLimiter {
  hit(key: string, windowSec: number): Promise<number>;
}
export const SAFETY_RATE_LIMITER = Symbol('SafetyRateLimiter');
