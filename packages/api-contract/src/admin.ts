/**
 * Contrats du back-office (/v1/admin/*) — agent F.
 * Auth staff distincte du mobile : cookie de session staff (HttpOnly, Secure hors local,
 * SameSite=Strict) + en-tête CSRF sur toute mutation + MFA TOTP + step-up pour les actions
 * sensibles. Un bearer mobile n'ouvre jamais de droit staff.
 * Les réponses sont des vues staff explicites (jamais un modèle Prisma brut) ; aucune ne contient
 * de vote privé, d'identité de signaleur ou de répondant anonyme, ni de position.
 */
import { z } from 'zod';
import { STAFF_ROLES, type StaffRole } from '@blowy/domain';

export const STAFF_SESSION_COOKIE = 'blowy_staff';
export const STAFF_PENDING_COOKIE = 'blowy_staff_pending';
export const STAFF_CSRF_COOKIE = 'blowy_staff_csrf';
export const STAFF_CSRF_HEADER = 'x-blowy-csrf';

export const StaffRoleSchema = z.enum(STAFF_ROLES);
export const ReasonSchema = z.string().trim().min(5).max(500);
export const TotpCodeSchema = z.string().regex(/^\d{6}$/);

// ---------------------------------------------------------------- Auth staff
export const StaffLoginRequestSchema = z.object({
  provider: z.enum(['firebase', 'local']),
  credential: z.string().min(1).max(4096),
});
export const StaffLoginResultSchema = z.object({
  /** Jeton d'attente MFA (5 min) : à placer en cookie HttpOnly STAFF_PENDING_COOKIE. */
  pendingToken: z.string(),
  mfaEnrolled: z.boolean(),
  expiresAt: z.string(),
});
export const StaffMfaRequestSchema = z.object({ code: TotpCodeSchema });
export const StaffSessionIssuedSchema = z.object({
  sessionToken: z.string(),
  csrfToken: z.string(),
  expiresAt: z.string(),
  idleTimeoutSeconds: z.number().int(),
});
export type StaffSessionIssued = z.infer<typeof StaffSessionIssuedSchema>;
export const StepUpRequestSchema = z.object({ code: TotpCodeSchema });

export interface StaffMe {
  userId: string;
  displayName: string;
  roles: StaffRole[];
  permissions: string[];
  sessionId: string;
  sessionExpiresAt: string;
  stepUpValidUntil: string | null;
}

export interface StaffSessionView {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

// ---------------------------------------------------------------- Commun
export interface PageOf<T> {
  items: T[];
  nextCursor: string | null;
}

export const AdminPageQuerySchema = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

/** Résultat d'une mutation admin : toujours un identifiant d'audit. */
export interface AdminMutationResult<T = unknown> {
  auditId: string;
  replayed: boolean;
  result: T;
}

// ---------------------------------------------------------------- 18.1 Dashboard
export const DashboardQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  zone: z.string().max(64).optional(),
});
export interface DashboardMetric {
  key: string;
  label: string;
  value: number | null;
  /** Dénominateur explicite (null = compte absolu). */
  denominator: number | null;
  /** Ratio value/denominator, null si dénominateur 0 ou absent. */
  ratio: number | null;
  definition: string;
  /** NOT_INSTRUMENTED : aucune donnée source n'existe encore — jamais un chiffre inventé. */
  status: 'OK' | 'NOT_INSTRUMENTED';
}
export interface DashboardView {
  period: { from: string; to: string };
  zone: string | null;
  generatedAt: string;
  sections: { key: string; title: string; metrics: DashboardMetric[] }[];
}

// ---------------------------------------------------------------- 18.2 Utilisateurs
export const UserSearchQuerySchema = AdminPageQuerySchema.extend({
  q: z.string().trim().max(80).optional(),
  status: z.enum(['ACTIVE', 'RESTRICTED', 'SUSPENDED', 'BANNED', 'DELETED']).optional(),
});
export interface AdminUserRow {
  id: string;
  displayName: string | null;
  status: string;
  zone: string | null;
  verified: boolean;
  onboarded: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  isFictional: boolean;
  staffRoles: StaffRole[];
}
export interface AdminUserDetail extends AdminUserRow {
  emailMasked: string | null;
  ageYears: number | null;
  timezone: string;
  reliability: number;
  intention: string | null;
  photoPreference: string | null;
  verifications: { id: string; kind: string; provenance: string; status: string; createdAt: string; expiresAt: string | null }[];
  devices: { id: string; platform: string | null; appVersion: string | null; lastUsedAt: string; revoked: boolean }[];
  subscriptions: { id: string; provider: string; environment: string; state: string; currentPeriodEndsAt: string | null }[];
  pauses: { id: string; startsAt: string; endsAt: string; scope: string }[];
  exports: { id: string; status: string; requestedAt: string }[];
  deletions: { id: string; status: string; requestedAt: string }[];
  pet: { id: string; name: string; species: string; stage: string } | null;
  relationships: { id: string; type: string; status: string; branch: string; reachedLevel: number }[];
  auditTrail: AdminAuditRow[];
}
export const UserActionRequestSchema = z.object({
  kind: z.enum(['WARN', 'RESTRICT', 'SUSPEND', 'BAN', 'RESTORE']),
  reason: ReasonSchema,
});
export type UserActionRequest = z.infer<typeof UserActionRequestSchema>;

// ---------------------------------------------------------------- 18.3 Pets / relations
export interface AdminPetView {
  id: string;
  name: string;
  species: string;
  stage: string;
  kind: string;
  engineVersion: string;
  state: { satiety: number; energy: number; mood: number; health: number; advancedTo: string; tuningVersion: string } | null;
  location: { kind: string; contextId: string | null } | null;
  careTimeline: { at: string; action: string; actorUserId: string | null; engineVersion: string; tuningVersion: string; effects: unknown }[];
}
export interface AdminRelationshipView {
  id: string;
  type: string;
  status: string;
  branch: string;
  xpMilli: number;
  eligibleLevel: number;
  reachedLevel: number;
  engineVersion: string;
  tuningVersion: string;
  legacy: boolean;
  startedAt: string;
  endedAt: string | null;
  sides: { userId: string; petId: string; active: boolean; exclusive: boolean }[];
  /** Diagnostics en lecture : niveau éligible recalculé par le moteur pur vs stocké. */
  diagnostics: { computedEligibleLevel: number | null; eligibleMismatch: boolean; engineAvailable: boolean; notes: string[] };
  /** Événements PARTICIPANTS/SYSTEM ; les événements ACTOR_ONLY et les bulletins de vote sont omis. */
  timeline: { seq: number; type: string; at: string; visibility: string; engineVersion: string | null; tuningVersion: string | null }[];
}
export const RelationshipRepairRequestSchema = z.object({
  kind: z.literal('RECOMPUTE_ELIGIBLE_LEVEL'),
  reason: ReasonSchema,
});

// ---------------------------------------------------------------- 18.4 / 18.5 Modération & vérification (ports de l'agent E)
export const CaseListQuerySchema = AdminPageQuerySchema.extend({
  status: z.enum(['OPEN', 'ASSIGNED', 'RESOLVED', 'ESCALATED']).optional(),
  subjectType: z.enum(['MESSAGE', 'MEDIA', 'MISSION_SUBMISSION', 'BIRTH_NAME', 'PROFILE', 'ANONYMOUS_RESPONSE', 'USER']).optional(),
  priority: z.coerce.number().int().min(0).max(9).optional(),
});
export const CaseContextQuerySchema = z.object({ justification: z.string().trim().min(10).max(500).optional() });
export const CaseAssignRequestSchema = z.object({ assigneeId: z.string().uuid().nullable() });
export const CaseDecisionRequestSchema = z.object({
  action: z.enum(['ALLOW', 'WARN', 'QUARANTINE', 'REJECT', 'WITHDRAW']),
  reason: ReasonSchema,
});
export const AppealResolveRequestSchema = z.object({ outcome: z.enum(['UPHELD', 'OVERTURNED']), reason: ReasonSchema });
export const VerificationReviewRequestSchema = z.object({
  decision: z.enum(['APPROVE_SELFIE_REVIEW', 'REJECT', 'REQUEST_RETRY']),
  reason: ReasonSchema,
});

// ---------------------------------------------------------------- 18.6 Missions
export const MissionDraftRequestSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{2,48}$/),
  titleKey: z.string().regex(/^mission\.[a-z0-9_.]{2,80}$/),
  criteria: z.object({
    /** Critères observables sur la photo (mots-clés courts, pas d'instruction libre au modèle). */
    visible: z.array(z.string().trim().min(2).max(40)).min(1).max(6),
    photosExpected: z.number().int().min(1).max(3).default(1),
    joint: z.boolean().default(false),
  }),
  accessibleAlternative: z.string().regex(/^mission\.[a-z0-9_.]{2,80}$/).nullable(),
  linkXpMilli: z.number().int().min(0),
  petXpMilli: z.number().int().min(0),
  coins: z.number().int().min(0),
});
export type MissionDraftRequest = z.infer<typeof MissionDraftRequestSchema>;
export const MissionScheduleRequestSchema = z.object({
  definitionId: z.string().uuid(),
  zoneCode: z.string().min(1).max(64),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export interface AdminMissionVersion {
  id: string;
  key: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  titleKey: string;
  title: string | null;
  criteria: unknown;
  accessibleAlternative: string | null;
  linkXpMilli: number;
  petXpMilli: number;
  coins: number;
  createdAt: string;
  publishedAt: string | null;
  scheduled: { zone: string; day: string }[];
}
export interface MissionBounds {
  maxLinkXpMilli: number;
  maxPetXpMilli: number;
  maxCoins: number;
  source: string;
}

// ---------------------------------------------------------------- 18.7 Contenus
export const ContentDraftRequestSchema = z.object({
  /** Surcharges de textes : clés EXISTANTES du référentiel uniquement. */
  entries: z.record(z.string().regex(/^[a-z0-9_.]{3,120}$/), z.string().min(1).max(600)).refine((e) => Object.keys(e).length > 0 && Object.keys(e).length <= 200, { message: '1 à 200 entrées' }),
  minClientVersion: z.string().regex(/^\d+\.\d+\.\d+$/).nullable().default(null),
  note: z.string().max(300).optional(),
});
export interface AdminConfigVersionRow {
  id: string;
  kind: 'TUNING' | 'CONTENT';
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  authorId: string | null;
  createdAt: string;
  activatedAt: string | null;
  minClientVersion: string | null;
}
export interface ContentPreview {
  version: string;
  entries: { key: string; base: string | null; draft: string; rendered: string; variables: string[] }[];
  issues: string[];
}

// ---------------------------------------------------------------- 18.8 Tuning
export const TuningDraftRequestSchema = z.object({
  /** Tuning complet (validé par @blowy/tuning TuningSchema). */
  payload: z.record(z.string(), z.unknown()),
  note: z.string().max(300).optional(),
});
export const TuningRollbackRequestSchema = z.object({ targetVersionId: z.string().uuid(), newVersion: z.string().regex(/^tuning-\d{4}\.\d{2}\.\d+$/), reason: ReasonSchema });
export const ConfigPublishRequestSchema = z.object({ reason: ReasonSchema });
export interface TuningDiffEntry {
  path: string;
  before: unknown;
  after: unknown;
}
export interface TuningOverview {
  active: { id: string | null; version: string; source: 'CONFIG_VERSION' | 'PACKAGE_DEFAULT'; activatedAt: string | null };
  versions: AdminConfigVersionRow[];
  /** Le runtime moteur lit-il la version active publiée ? (sinon publication enregistrée seulement). */
  runtimeConsumesPublished: boolean;
  simulator: { available: boolean; reason: string | null };
}

// ---------------------------------------------------------------- 18.9 Matching
export interface MatchingDiagnostics {
  zones: {
    code: string;
    name: string;
    active: boolean;
    users: number;
    eligible: number;
    exclusions: Record<string, number>;
    lastBatches: { id: string; localDate: string; kind: string; status: string; algoVersion: string; tuningVersion: string; proposals: number; startedAt: string; finishedAt: string | null }[];
    exposureHistogram: { bucket: string; users: number }[];
  }[];
}

// ---------------------------------------------------------------- 18.10 Économie
export const EconomyCorrectionRequestSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0 && Math.abs(n) <= 100_000, { message: 'montant invalide' }),
  reason: ReasonSchema,
});
export const WebhookListQuerySchema = AdminPageQuerySchema.extend({
  status: z.enum(['RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED']).optional(),
  appUserId: z.string().uuid().optional(),
});

// ---------------------------------------------------------------- 18.11 Social
export interface AdminSocialOverview {
  groups: { id: string; name: string; status: string; activeMembers: number; createdAt: string }[];
  referrals: { id: string; status: string; claimedAt: string; rewardedAt: string | null; referrerUserId: string; refereeUserId: string; referrerClaims24h: number; suspicious: boolean }[];
  reportedAnonymous: { id: string; words: string[]; targetUserId: string; targetDisplayName: string | null; reportedAt: string | null; hidden: boolean }[];
  leagues: { id: string; kind: string; tier: number; weekKey: string; status: string; endsAt: string }[];
}

// ---------------------------------------------------------------- 18.12 IA
export interface AdminAiSummary {
  windowHours: number;
  byStatus: Record<string, number>;
  byKind: { kind: string; count: number; failed: number; avgDurationMs: number | null; costMicros: number }[];
  errors: { code: string; count: number }[];
  promptVersions: { kind: string; provider: string; model: string | null; promptVersion: string | null; jobs: number }[];
  budgets: { configured: boolean; note: string };
}

// ---------------------------------------------------------------- 18.13 Exploitation
export interface OpsStatus {
  generatedAt: string;
  api: { version: string; env: string; engineVersion: string; tuningVersion: string; node: string; uptimeSeconds: number };
  database: { ok: boolean; latencyMs: number | null };
  redis: { configured: boolean; ok: boolean | null };
  outbox: { pending: number; dead: number; oldestPendingAgeSeconds: number | null; maxAttempts: number };
  jobs: { name: string; lastStatus: string; lastStartedAt: string; lastError: string | null; failed24h: number }[];
  featureFlags: { key: string; value: unknown; note: string }[];
}
export interface DeadOutboxRow {
  id: string;
  topic: string;
  aggregateType: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  redrivable: boolean;
  blockedReason: string | null;
}
export const RedriveRequestSchema = z.object({ reason: ReasonSchema });

// ---------------------------------------------------------------- Audit
export const AuditQuerySchema = AdminPageQuerySchema.extend({
  targetType: z.string().max(64).optional(),
  targetId: z.string().max(64).optional(),
  actorUserId: z.string().uuid().optional(),
  action: z.string().max(80).optional(),
});
export interface AdminAuditRow {
  id: string;
  at: string;
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  requestId: string | null;
}

// ---------------------------------------------------------------- Vues de modération/vérification (miroir des ports de l'agent E)
export interface AdminCaseView {
  id: string;
  subjectType: string;
  subjectId: string;
  status: string;
  priority: number;
  reasonCode: string;
  dueAt: string;
  overdue: boolean;
  assignedToId: string | null;
  createdAt: string;
  reportCategory: string | null;
  automaticSignals: Record<string, number>;
  decisions: { id: string; action: string; source: string; policyVersion: string; provider: string | null; reasonCode: string; supersedesId: string | null; createdAt: string }[];
  restricted: boolean;
}
export interface AdminCaseContext {
  restricted: boolean;
  subject: { kind: string; text: string | null; mediaVariant: string | null; createdAt: string } | null;
  neighbours: { author: 'A' | 'B' | 'SYSTEM'; text: string | null; createdAt: string }[];
}
export interface AdminVerificationView {
  id: string;
  userId: string;
  kind: string;
  provenance: string;
  status: string;
  providerRef: string | null;
  decisionCode: number | null;
  reasonCode: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}
