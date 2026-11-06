/**
 * Ports staff (propriétaire : agent E) consommés par le module admin (agent F).
 * Une seule implémentation de la logique de modération / vérification : modules/trust.
 * Le module admin authentifie la session staff (cookie, MFA, step-up) ; l'implémentation
 * REVÉRIFIE les rôles côté serveur, audite chaque action et lève des AppError
 * (FORBIDDEN / NOT_FOUND / PRECONDITION_FAILED / CONFLICT).
 * Aucun DTO ne contient l'identité d'un signaleur, un vote privé, une date de naissance,
 * un email ni le contenu d'un dossier à accès restreint (protection des mineurs).
 */
export type StaffRole = 'support' | 'moderator' | 'trust_lead' | 'content_manager' | 'finance' | 'analyst' | 'admin';

export interface StaffActor {
  staffUserId: string;
  roles: StaffRole[];
  requestId?: string;
}

/** V5 (T4) : `SAFETY_ALERT` (alerte « besoin d'aide », priorité 1, échéance 1 h) ; `OUTING` (incident sur place : sujet = sortie ; « je connais quelqu'un » : sujet = place). */
export type CaseSubjectType = 'MESSAGE' | 'MEDIA' | 'MISSION_SUBMISSION' | 'BIRTH_NAME' | 'PROFILE' | 'ANONYMOUS_RESPONSE' | 'USER' | 'SAFETY_ALERT' | 'OUTING';
export type CaseStatus = 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'ESCALATED';

export interface StaffDecisionView {
  id: string;
  action: 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'HUMAN_REVIEW';
  source: 'DETERMINISTIC' | 'AUTO' | 'HUMAN';
  policyVersion: string;
  provider: string | null;
  reasonCode: string;
  supersedesId: string | null;
  createdAt: string;
}

export interface StaffCaseView {
  id: string;
  subjectType: CaseSubjectType;
  subjectId: string;
  status: CaseStatus;
  priority: number;
  reasonCode: string;
  dueAt: string;
  overdue: boolean;
  assignedToId: string | null;
  createdAt: string;
  /** Catégorie déclarée par le signalement éventuel (jamais l'identité du signaleur). */
  reportCategory: string | null;
  /** Catégories/scores automatiques (sans texte). Scores fournisseur ≠ probabilités de culpabilité. */
  automaticSignals: Record<string, number>;
  decisions: StaffDecisionView[];
  /** Dossier à accès spécialisé : aucun contenu exposé dans les outils ordinaires. */
  restricted: boolean;
}

export interface StaffCaseContext {
  restricted: boolean;
  /** Contenu du sujet seulement (null si restreint, purgé ou non textuel). */
  subject: { kind: string; text: string | null; mediaVariant: string | null; createdAt: string } | null;
  /** ≤ 5 messages voisins publiés de la même conversation (pseudonymisés A/B). */
  neighbours: { author: 'A' | 'B' | 'SYSTEM'; text: string | null; createdAt: string }[];
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export type StaffDecisionAction = 'ALLOW' | 'WARN' | 'QUARANTINE' | 'REJECT' | 'WITHDRAW';
export type SanctionKind = 'WARN' | 'RESTRICT' | 'SUSPEND' | 'BAN' | 'RESTORE';

export interface AdminModerationPort {
  listCases(actor: StaffActor, q: { status?: CaseStatus; subjectType?: CaseSubjectType; priority?: number; cursor?: string; limit: number }): Promise<Page<StaffCaseView>>;
  /** Lecture auditée ; `justification` (≥ 10 car.) exigée pour un sujet MEDIA / MISSION_SUBMISSION. */
  getCase(actor: StaffActor, caseId: string, opts?: { justification?: string }): Promise<StaffCaseView & { context: StaffCaseContext }>;
  assign(actor: StaffActor, caseId: string, assigneeId: string | null): Promise<StaffCaseView>;
  /** Idempotent par commandId ; correction append-only (supersedesId), aucun XP réattribué. */
  decide(actor: StaffActor, caseId: string, input: { action: StaffDecisionAction; reason: string; commandId: string }): Promise<StaffCaseView>;
  /** trust_lead / admin uniquement ; motif obligatoire. */
  sanction(actor: StaffActor, input: { userId: string; kind: SanctionKind; reason: string; commandId: string }): Promise<{ userId: string; status: string }>;
  listAppeals(actor: StaffActor, q: { status?: 'OPEN' | 'UPHELD' | 'OVERTURNED'; cursor?: string; limit: number }): Promise<Page<{ id: string; caseId: string; status: string; createdAt: string }>>;
  resolveAppeal(actor: StaffActor, appealId: string, input: { outcome: 'UPHELD' | 'OVERTURNED'; reason: string; commandId: string }): Promise<{ id: string; status: string }>;
  stats(actor: StaffActor): Promise<{ open: number; overdue: number; byPriority: Record<string, number>; providerErrors24h: number }>;
}

export interface StaffVerificationView {
  id: string;
  userId: string;
  kind: 'SELFIE_QUALITY' | 'SELFIE_HUMAN_REVIEW' | 'LIVENESS' | 'IDENTITY_AGE';
  provenance: 'PROVIDER' | 'STAFF' | 'LOCAL_DEMO';
  status: string;
  /** Référence fournisseur masquée (4 derniers caractères). */
  providerRef: string | null;
  decisionCode: number | null;
  reasonCode: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface StaffAiJobView {
  id: string;
  kind: string;
  status: string;
  provider: string;
  model: string | null;
  promptVersion: string | null;
  attempts: number;
  lastErrorCode: string | null;
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costMicros: number | null;
  createdAt: string;
}

import type { StaffSafetyAlertDetail, StaffSafetyAlertView } from './safety-staff.port.js';
export type { StaffSafetyAlertDetail, StaffSafetyAlertView };

export interface AdminTrustPort {
  listVerifications(actor: StaffActor, q: { status?: string; cursor?: string; limit: number }): Promise<Page<StaffVerificationView>>;
  /** N'accorde JAMAIS IDENTITY_AGE : approbation = SELFIE_HUMAN_REVIEW / STAFF (« selfie contrôlé »). */
  reviewVerification(actor: StaffActor, sessionId: string, input: { decision: 'APPROVE_SELFIE_REVIEW' | 'REJECT' | 'REQUEST_RETRY'; reason: string; commandId: string }): Promise<StaffVerificationView>;
  listReports(actor: StaffActor, q: { status?: string; category?: string; cursor?: string; limit: number }): Promise<Page<{ id: string; reportedUserId: string; category: string; safetyExit: boolean; status: string; createdAt: string }>>;
  listExports(actor: StaffActor, q: { status?: string; cursor?: string; limit: number }): Promise<Page<{ id: string; userId: string; status: string; requestedAt: string; readyAt: string | null; expiresAt: string | null }>>;
  listDeletionRequests(actor: StaffActor, q: { status?: string; cursor?: string; limit: number }): Promise<Page<{ id: string; userId: string; status: string; requestedAt: string; completedAt: string | null; purgeAfter: string | null }>>;
  listAiJobs(actor: StaffActor, q: { status?: string; kind?: string; cursor?: string; limit: number }): Promise<Page<StaffAiJobView>>;
  /** Revérifie l'autorisation ACTUELLE (consentement, blocage, relation) avant réexécution. */
  retryAiJob(actor: StaffActor, jobId: string, commandId: string): Promise<StaffAiJobView>;
  cancelAiJob(actor: StaffActor, jobId: string): Promise<StaffAiJobView>;
  // ---- V5 T4 : sécurité des sorties (section admin « Sécurité », spec-v5 §10) ----
  /** File temps réel des alertes « besoin d'aide » (SLA affiché : réponse humaine < 1 h). trust_lead / admin. */
  listSafetyAlerts(actor: StaffActor, q: { status?: 'OPEN' | 'SAFE' | 'HANDLED'; cursor?: string; limit: number }): Promise<Page<StaffSafetyAlertView>>;
  /** Détail audité (position jointe incluse si non purgée) ; `justification` ≥ 10 car. obligatoire. trust_lead / admin. */
  getSafetyAlert(actor: StaffActor, alertId: string, opts: { justification: string }): Promise<StaffSafetyAlertDetail>;
  /** Prise en charge : alerte HANDLED + dossier résolu (motif obligatoire, idempotent). trust_lead / admin. */
  handleSafetyAlert(actor: StaffActor, alertId: string, input: { reason: string; commandId: string }): Promise<StaffSafetyAlertView>;
  /** « Je connais quelqu'un » en examen (sujet = place) : accepté → retrait sans pénalité ; refusé → place gardée. support / trust_lead / admin. */
  resolveKnowsSomeone(actor: StaffActor, seatId: string, input: { accept: boolean; reason: string; commandId: string }): Promise<{ status: 'MOVED' | 'ACCEPTED_TOO_LATE' | 'REJECTED' }>;
}

export const ADMIN_MODERATION = Symbol.for('blowy.admin.moderation');
export const ADMIN_TRUST = Symbol.for('blowy.admin.trust');
