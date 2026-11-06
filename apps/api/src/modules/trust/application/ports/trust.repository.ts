/**
 * Ports de persistance du module trust (implémentés en Prisma). Les use cases ne voient
 * que ces interfaces. Le module trust écrit ses tables (Block, Report, ModerationCase,
 * Appeal, VerificationSession, DataExport, DeletionRequest, AuditLog, AIJob/AIResult
 * d'invalidation) ; les effets sur les relations passent par RelationshipLifecycle.
 */
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export interface UserTarget {
  userId: string;
  /** Relations (contextes) entre l'acteur et la cible. */
  contextIds: string[];
  petIds: string[];
}

export interface CaseRow {
  id: string;
  /** V5 : `SAFETY_ALERT` (sujet = alerte), `OUTING` (sujet = sortie pour un incident sur place, place pour « je connais quelqu'un »). */
  subjectType: 'MESSAGE' | 'MEDIA' | 'MISSION_SUBMISSION' | 'BIRTH_NAME' | 'PROFILE' | 'ANONYMOUS_RESPONSE' | 'USER' | 'SAFETY_ALERT' | 'OUTING';
  subjectId: string;
  subjectUserId: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'ESCALATED';
  priority: number;
  reasonCode: string;
  reportId: string | null;
  reportCategory: string | null;
  assignedToId: string | null;
  dueAt: Date;
  restricted: boolean;
  createdAt: Date;
}

export interface DecisionRow {
  id: string;
  action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'HUMAN_REVIEW';
  source: 'DETERMINISTIC' | 'AUTO' | 'HUMAN';
  policyVersion: string;
  provider: string | null;
  reasonCode: string;
  supersedesId: string | null;
  signals: Record<string, number> | null;
  createdAt: Date;
}

export interface VerificationRow {
  id: string;
  userId: string;
  kind: 'SELFIE_QUALITY' | 'SELFIE_HUMAN_REVIEW' | 'LIVENESS' | 'IDENTITY_AGE';
  provenance: 'PROVIDER' | 'STAFF' | 'LOCAL_DEMO';
  status: 'NOT_STARTED' | 'PENDING' | 'NEEDS_RETRY' | 'HUMAN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  providerRef: string | null;
  decisionCode: number | null;
  reasonCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface TrustRepository {
  // ---- cibles (anti-IDOR : seulement depuis un objet que l'acteur connaît)
  targetFromRelationship(actorId: string, contextId: string): Promise<string | null>;
  targetFromPet(actorId: string, petId: string): Promise<string | null>;
  targetFromMessage(actorId: string, messageId: string): Promise<string | null>;
  /** V5 : les deux ont (eu) une place dans cette sortie ; sinon null (404 neutre). */
  targetFromOuting(actorId: string, outingId: string, userId: string): Promise<string | null>;
  /** V5 : lieu de la sortie si l'acteur y a (eu) une place confirmée (null = sans lieu), `undefined` sinon. */
  outingOfReporter(actorId: string, outingId: string): Promise<string | null | undefined>;
  insertIncident(scope: TxScope, i: { id: string; reporterId: string; outingId: string; venueId: string | null; note: string | null; moderationCaseId: string }): Promise<void>;
  contextsBetween(scope: TxScope | null, a: string, b: string): Promise<{ id: string; petIds: string[]; status: string }[]>;
  // ---- blocages
  insertBlock(scope: TxScope, blockerId: string, blockedId: string): Promise<{ id: string; created: boolean }>;
  listBlocks(blockerId: string): Promise<{ id: string; blockedId: string; petName: string | null; createdAt: Date }[]>;
  /** Effets annexes du blocage (même transaction). */
  applyBlockSideEffects(scope: TxScope, a: string, b: string, contextIds: string[]): Promise<void>;
  // ---- signalements
  insertReport(scope: TxScope, r: { id: string; reporterId: string; reportedUserId: string; contextId: string | null; category: string; safetyExit: boolean; subjectRef: string | null; note: string | null; outingId?: string | null }): Promise<void>;
  // ---- dossiers
  openCase(scope: TxScope, c: { subjectType: CaseRow['subjectType']; subjectId: string; subjectUserId: string | null; reasonCode: string; priority: 1 | 2 | 3; restricted: boolean; reportId?: string | null; dueAt: Date }): Promise<string>;
  findOpenCase(scope: TxScope | null, subjectType: CaseRow['subjectType'], subjectId: string): Promise<CaseRow | null>;
  loadCase(scope: TxScope | null, id: string): Promise<CaseRow | null>;
  listCases(q: { status?: string; subjectType?: string; priority?: number; after?: { createdAt: Date; id: string } | null; limit: number; includeRestricted: boolean }): Promise<CaseRow[]>;
  updateCase(scope: TxScope, id: string, patch: Partial<Pick<CaseRow, 'status' | 'assignedToId' | 'priority'>> & { resolvedAt?: Date | null }): Promise<void>;
  decisionsFor(subjectType: string, subjectId: string): Promise<DecisionRow[]>;
  recordDecision(scope: TxScope, d: { subjectType: CaseRow['subjectType']; subjectId: string; action: DecisionRow['action']; policyVersion: string; reasonCode: string; decidedById: string; supersedesId: string | null }): Promise<string>;
  caseStats(now: Date): Promise<{ open: number; overdue: number; byPriority: Record<string, number>; providerErrors24h: number }>;
  // ---- recours
  createAppeal(scope: TxScope, caseId: string, userId: string): Promise<{ id: string; created: boolean }>;
  loadAppeal(scope: TxScope | null, id: string): Promise<{ id: string; caseId: string; userId: string; status: string; createdAt: Date } | null>;
  listAppeals(q: { status?: string; after?: { createdAt: Date; id: string } | null; limit: number }): Promise<{ id: string; caseId: string; status: string; createdAt: Date }[]>;
  resolveAppeal(scope: TxScope, id: string, status: 'UPHELD' | 'OVERTURNED'): Promise<void>;
  // ---- sujets
  messageAuthor(messageId: string): Promise<{ authorUserId: string | null; conversationId: string } | null>;
  mediaOwner(mediaId: string): Promise<string | null>;
  proofOwner(id: string): Promise<string | null>;
  caseContext(c: CaseRow): Promise<{ subject: { kind: string; text: string | null; mediaVariant: string | null; createdAt: Date } | null; neighbours: { author: 'A' | 'B' | 'SYSTEM'; text: string | null; createdAt: Date }[] }>;
  // ---- sanctions
  setUserStatus(scope: TxScope, userId: string, status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED'): Promise<void>;
  revokeSessions(scope: TxScope, userId: string): Promise<number>;
  // ---- vérification
  createVerification(scope: TxScope, v: { id: string; userId: string; kind: VerificationRow['kind']; provenance: VerificationRow['provenance']; status: VerificationRow['status']; providerRef: string | null; providerSessionUrl?: string | null; expiresAt: Date | null; reasonCode?: string | null }): Promise<void>;
  verificationByProviderRef(scope: TxScope | null, providerRef: string): Promise<VerificationRow | null>;
  loadVerification(scope: TxScope | null, id: string): Promise<VerificationRow | null>;
  updateVerification(scope: TxScope, id: string, patch: { status: VerificationRow['status']; decisionCode?: number | null; reasonCode?: string | null; verifiedAt?: Date | null; expiresAt?: Date | null; lastProviderEventAt?: Date; clearSessionUrl?: boolean }): Promise<void>;
  listVerifications(q: { status?: string; after?: { createdAt: Date; id: string } | null; limit: number }): Promise<VerificationRow[]>;
  /** Webhook fournisseur dédupliqué (provider, providerEventId) ; false si déjà reçu. */
  recordWebhook(scope: TxScope, w: { provider: string; providerEventId: string; environment: 'PRODUCTION' | 'SANDBOX'; eventType: string; payload: Record<string, unknown>; eventTimestamp: Date }): Promise<boolean>;
  // ---- audit
  audit(scope: TxScope | null, a: { actorUserId: string | null; actorRole: string | null; action: string; targetType: string; targetId: string | null; reason: string | null; data?: Record<string, unknown>; requestId?: string | null; at: Date }): Promise<void>;
  // ---- listes staff
  listReports(q: { status?: string; category?: string; after?: { createdAt: Date; id: string } | null; limit: number }): Promise<{ id: string; reportedUserId: string; category: string; safetyExit: boolean; status: string; createdAt: Date }[]>;
  listExports(q: { status?: string; after?: { createdAt: Date; id: string } | null; limit: number }): Promise<{ id: string; userId: string; status: string; requestedAt: Date; readyAt: Date | null; expiresAt: Date | null }[]>;
  listDeletions(q: { status?: string; after?: { createdAt: Date; id: string } | null; limit: number }): Promise<{ id: string; userId: string; status: string; requestedAt: Date; completedAt: Date | null; purgeAfter: Date | null }[]>;
}
export const TRUST_REPOSITORY = Symbol('TrustRepository');

/** Invalidation IA (retrait de consentement, blocage, suppression). */
export interface AiInvalidation {
  cancelForUser(scope: TxScope | null, userId: string, reason: string, kinds?: readonly string[]): Promise<number>;
  cancelForContexts(scope: TxScope | null, contextIds: readonly string[], reason: string): Promise<number>;
  invalidateSuggestionsForUser(scope: TxScope | null, userId: string): Promise<void>;
  deleteSignalsForUser(scope: TxScope | null, userId: string): Promise<void>;
  listJobs(q: { status?: string; kind?: string; after?: { createdAt: Date; id: string } | null; limit: number }): Promise<Array<{ id: string; kind: string; status: string; provider: string; model: string | null; promptVersion: string | null; attempts: number; lastErrorCode: string | null; durationMs: number | null; inputTokens: number | null; outputTokens: number | null; costMicros: number | null; createdAt: Date; subjectType: string; subjectId: string; userId: string | null; contextId: string | null }>>;
  setJobStatus(id: string, status: 'QUEUED' | 'CANCELLED', reason: string | null): Promise<void>;
}
export const AI_INVALIDATION = Symbol('AiInvalidation');
