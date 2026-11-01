/**
 * Ports du module admin (implémentés en infrastructure). Les ports de modération / vérification
 * appartiennent à l'agent E (shared/application/ports/admin-trust.port.ts) et sont ré-exportés ici.
 */
import type { StaffRole } from '@blowy/domain';
import type {
  AdminAuditRow,
  AdminConfigVersionRow,
  AdminMissionVersion,
  AdminPetView,
  AdminRelationshipView,
  AdminSocialOverview,
  AdminAiSummary,
  AdminUserDetail,
  AdminUserRow,
  DashboardView,
  DeadOutboxRow,
  MatchingDiagnostics,
  MissionDraftRequest,
  OpsStatus,
  PageOf,
} from '@blowy/api-contract';
import type { TxScope } from '../../../../shared/application/unit-of-work.js';

export type { AdminModerationPort, AdminTrustPort, StaffActor } from '../../../../shared/application/ports/admin-trust.port.js';
export { ADMIN_MODERATION, ADMIN_TRUST } from '../../../../shared/application/ports/admin-trust.port.js';

// --------------------------------------------------------------- Staff (auth)
export interface StaffAccount {
  userId: string;
  displayName: string;
  roles: StaffRole[];
  userStatus: string;
  mfaEnrolled: boolean;
}

export interface StaffSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

/**
 * État MFA. Le secret TOTP n'est PAS stocké : il est dérivé (HMAC de STAFF_MFA_KEY, userId,
 * génération). `generation` augmente à chaque (ré)enrôlement ; `enrolled` = confirmation faite.
 */
export interface StaffMfaState {
  enrolled: boolean;
  generation: number;
}

export interface StaffRepository {
  findStaffByIdentity(provider: 'FIREBASE' | 'LOCAL', subject: string): Promise<StaffAccount | null>;
  loadStaff(userId: string): Promise<StaffAccount | null>;
  mfaState(userId: string): Promise<StaffMfaState>;
  /** Démarre un (ré)enrôlement : nouvelle génération (tracée dans l'audit). */
  startEnrollment(scope: TxScope, userId: string): Promise<number>;
  setMfaEnrolled(scope: TxScope, userId: string, enrolled: boolean): Promise<void>;
  /** Anti-rejeu : consomme le pas TOTP (unique par utilisateur) ; false si déjà utilisé. */
  consumeTotpStep(scope: TxScope, userId: string, step: number): Promise<boolean>;
  createSession(scope: TxScope, s: { id: string; userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findSession(id: string): Promise<StaffSessionRecord | null>;
  touchSession(id: string, at: Date): Promise<void>;
  lastStepUpAt(sessionId: string): Promise<Date | null>;
  revokeSession(scope: TxScope, userId: string, id: string, at: Date): Promise<boolean>;
  revokeAllFor(scope: TxScope, userId: string, at: Date): Promise<number>;
  listSessions(userId: string, now: Date): Promise<StaffSessionRecord[]>;
  /** Attribution par CLI (aucune route HTTP) ; renvoie false si déjà active. */
  grantRole(scope: TxScope, userId: string, role: StaffRole, grantedBy: string | null): Promise<boolean>;
  revokeRole(scope: TxScope, userId: string, role: StaffRole, at: Date): Promise<boolean>;
  findUserIdByIdentity(provider: 'FIREBASE' | 'LOCAL', subject: string): Promise<string | null>;
}
export const STAFF_REPOSITORY = Symbol('StaffRepository');

// --------------------------------------------------------------- Audit
export interface AuditEntry {
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  data?: Record<string, unknown>;
  requestId?: string | null;
}
export interface AuditLog {
  /** Append-only (trigger SQL). Écrit dans la même transaction que la mutation. */
  record(scope: TxScope, e: AuditEntry): Promise<string>;
  /** Accès hors transaction (lecture sensible auditée). */
  recordNow(e: AuditEntry): Promise<string>;
  list(q: { targetType?: string; targetId?: string; actorUserId?: string; action?: string; cursor?: string; limit: number }): Promise<PageOf<AdminAuditRow>>;
}
export const AUDIT_LOG = Symbol('AuditLog');

// --------------------------------------------------------------- Lectures / mutations de back-office
export interface DashboardQueryPort {
  compute(q: { from: Date; to: Date; zone: string | null; now: Date }): Promise<DashboardView>;
}
export const DASHBOARD_QUERY = Symbol('DashboardQuery');

export interface UserAdminRepository {
  search(q: { q?: string; status?: string; cursor?: string; limit: number }): Promise<PageOf<AdminUserRow>>;
  detail(userId: string, now: Date): Promise<Omit<AdminUserDetail, 'auditTrail'> | null>;
}
export const USER_ADMIN_REPOSITORY = Symbol('UserAdminRepository');

export interface PetAdminRepository {
  pet(petId: string): Promise<AdminPetView | null>;
  /** Vue staff : événements ACTOR_ONLY et bulletins de vote exclus à la source. */
  relationship(id: string): Promise<Omit<AdminRelationshipView, 'diagnostics'> | null>;
}
export const PET_ADMIN_REPOSITORY = Symbol('PetAdminRepository');

export interface ConfigVersionRecord {
  id: string;
  kind: 'TUNING' | 'CONTENT';
  version: string;
  payload: Record<string, unknown>;
  authorId: string | null;
  activatedAt: Date | null;
  minClientVersion: string | null;
  createdAt: Date;
}
export interface ConfigRepository {
  list(kind: 'TUNING' | 'CONTENT'): Promise<AdminConfigVersionRow[]>;
  get(scope: TxScope | null, id: string): Promise<ConfigVersionRecord | null>;
  active(scope: TxScope | null, kind: 'TUNING' | 'CONTENT'): Promise<ConfigVersionRecord | null>;
  /** Verrou consultatif transactionnel par type (publication sérialisée). */
  lockKind(scope: TxScope, kind: 'TUNING' | 'CONTENT'): Promise<void>;
  create(scope: TxScope, r: Omit<ConfigVersionRecord, 'createdAt' | 'activatedAt'>): Promise<void>;
  /** Marque une version comme active (activatedAt = now) ; l'active précédente reste dans l'historique. */
  activate(scope: TxScope, id: string, at: Date): Promise<void>;
  archive(scope: TxScope, id: string): Promise<void>;
  versionExists(scope: TxScope, kind: 'TUNING' | 'CONTENT', version: string): Promise<boolean>;
}
export const CONFIG_REPOSITORY = Symbol('ConfigRepository');

export interface MissionAdminRepository {
  list(): Promise<AdminMissionVersion[]>;
  get(scope: TxScope | null, id: string): Promise<AdminMissionVersion | null>;
  nextVersion(scope: TxScope, key: string): Promise<number>;
  create(scope: TxScope, id: string, version: number, d: MissionDraftRequest): Promise<void>;
  update(scope: TxScope, id: string, d: MissionDraftRequest): Promise<void>;
  setStatus(scope: TxScope, id: string, status: 'PUBLISHED' | 'ARCHIVED', at: Date): Promise<void>;
  /** Archive les autres versions publiées de la même clé (une seule version publiée par clé). */
  archiveOtherPublished(scope: TxScope, key: string, keepId: string): Promise<string[]>;
  schedule(scope: TxScope, definitionId: string, zoneCode: string, day: string): Promise<{ id: string; created: boolean }>;
}
export const MISSION_ADMIN_REPOSITORY = Symbol('MissionAdminRepository');

export interface ReadModelsPort {
  matching(now: Date): Promise<MatchingDiagnostics>;
  social(now: Date): Promise<AdminSocialOverview>;
  ai(now: Date, windowHours: number): Promise<AdminAiSummary>;
  ops(now: Date): Promise<Omit<OpsStatus, 'api' | 'featureFlags' | 'redis'>>;
  deadOutbox(limit: number): Promise<DeadOutboxRow[]>;
}
export const READ_MODELS = Symbol('AdminReadModels');

export interface OutboxAdminRepository {
  loadForRedrive(scope: TxScope | null, id: string): Promise<{ id: string; topic: string; aggregateType: string; aggregateId: string; payload: Record<string, unknown>; attempts: number; publishedAt: Date | null } | null>;
  /** Remet l'événement en file (attempts=0, availableAt=now), idempotent par l'état. */
  requeue(scope: TxScope, id: string, at: Date): Promise<void>;
}
export const OUTBOX_ADMIN_REPOSITORY = Symbol('OutboxAdminRepository');

/**
 * Garde « état actuel » du redrive (§18.13) : un ancien événement n'est relancé que si la
 * permission/l'état qui le justifiait est toujours vrai (sinon refus motivé).
 */
export interface RedriveGuard {
  check(e: { topic: string; aggregateType: string; aggregateId: string; payload: Record<string, unknown> }): Promise<{ ok: true } | { ok: false; reason: string }>;
}
export const REDRIVE_GUARD = Symbol('RedriveGuard');

/** Simulateur 60 jours (pet-engine) : absent → « simulateur indisponible ». */
export interface TuningSimulator {
  readonly available: boolean;
  readonly reason: string | null;
  run(tuning: Record<string, unknown>, opts: { days: number; relationships: number; seed: string }): Promise<Record<string, unknown>>;
}
export const TUNING_SIMULATOR = Symbol('TuningSimulator');
