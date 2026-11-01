/**
 * Authentification staff (flux distinct du mobile) :
 *   1. login : preuve d'identité (Firebase en production, clé locale hors production) → le compte
 *      DOIT porter un rôle staff actif (sinon refus, sans dire si le compte existe) → jeton
 *      d'attente MFA (5 min). Aucune session n'est ouverte à ce stade.
 *   2. MFA TOTP obligatoire : enrôlement (génération dérivée) puis confirmation, ou vérification ;
 *      anti-rejeu du pas TOTP. Ouvre une session staff courte (TTL + inactivité) + jeton CSRF.
 *   3. step-up : nouveau code TOTP → actions sensibles autorisées pendant 5 minutes.
 * Le bearer mobile n'est jamais accepté par l'admin ; une session staff ne passe pas le guard mobile.
 */
import type { StaffMe, StaffSessionIssued, StaffSessionView } from '@blowy/api-contract';
import type { Clock, RandomSource } from '../../../../shared/application/clock.js';
import type { UnitOfWork } from '../../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../../shared/domain/errors.js';
import { permissionsOf, STEP_UP_TTL_SECONDS } from '../../domain/permissions.js';
import { csrfFor, hashStaffSessionToken, issuePendingToken, verifyPendingToken } from '../../domain/staff-tokens.js';
import { deriveTotpSecret, otpauthUri, verifyTotp, base32Encode } from '../../domain/totp.js';
import type { AuditLog, StaffAccount, StaffRepository } from '../ports/admin.ports.js';

export interface StaffIdentityVerifier {
  /** Vérifie une preuve d'identité auprès du fournisseur configuré ; lève si invalide. */
  verify(provider: 'firebase' | 'local', credential: string): Promise<{ provider: 'FIREBASE' | 'LOCAL'; subject: string }>;
}
export const STAFF_IDENTITY_VERIFIER = Symbol('StaffIdentityVerifier');

export interface StaffAuthConfig {
  staffSessionSecret: string;
  staffMfaKey: string;
  sessionTtlMs: number;
  idleTimeoutMs: number;
}

/** Contexte staff authentifié (résolu par le guard admin à chaque requête). */
export interface StaffContext {
  userId: string;
  sessionId: string;
  roles: StaffAccount['roles'];
  displayName: string;
  sessionExpiresAt: Date;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BLOCKED_STATUSES = new Set(['BANNED', 'SUSPENDED', 'DELETED']);
const loginRefused = () => new AppError('UNAUTHENTICATED', 'Identifiants staff refusés');

export class StaffAuthService {
  constructor(
    private readonly verifier: StaffIdentityVerifier,
    private readonly repo: StaffRepository,
    private readonly audit: AuditLog,
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly cfg: StaffAuthConfig,
  ) {}

  async login(provider: 'firebase' | 'local', credential: string, requestId: string | null) {
    let ident: { provider: 'FIREBASE' | 'LOCAL'; subject: string };
    try {
      ident = await this.verifier.verify(provider, credential);
    } catch {
      throw loginRefused();
    }
    const staff = await this.repo.findStaffByIdentity(ident.provider, ident.subject);
    if (!staff || BLOCKED_STATUSES.has(staff.userStatus)) {
      await this.audit.recordNow({ actorUserId: null, actorRole: null, action: 'staff.login_refused', targetType: 'StaffLogin', targetId: null, reason: staff ? 'ACCOUNT_BLOCKED' : 'NOT_STAFF', requestId });
      throw loginRefused();
    }
    const now = this.clock.now();
    const { token, expiresAt } = issuePendingToken(this.cfg.staffSessionSecret, staff.userId, this.random.hex(12), now);
    return { pendingToken: token, mfaEnrolled: staff.mfaEnrolled, expiresAt: expiresAt.toISOString() };
  }

  private pendingUser(pendingToken: string | undefined): string {
    const p = pendingToken ? verifyPendingToken(this.cfg.staffSessionSecret, pendingToken, this.clock.now()) : null;
    if (!p) throw new AppError('UNAUTHENTICATED', 'Étape d’identification expirée : reconnecte-toi');
    return p.userId;
  }

  /** Démarre l'enrôlement TOTP (uniquement si non enrôlé) : renvoie le secret une seule fois. */
  async startEnrollment(pendingToken: string | undefined, requestId: string | null) {
    const userId = this.pendingUser(pendingToken);
    const staff = await this.repo.loadStaff(userId);
    if (!staff) throw loginRefused();
    if (staff.mfaEnrolled) throw new AppError('CONFLICT', 'MFA déjà enrôlée : réinitialisation par un admin (CLI) uniquement');
    const generation = await this.uow.run(async (scope) => {
      const g = await this.repo.startEnrollment(scope, userId);
      await this.audit.record(scope, { actorUserId: userId, actorRole: staff.roles.join(','), action: 'staff.mfa.enrollment_started', targetType: 'StaffUser', targetId: userId, reason: null, requestId });
      return g;
    });
    const secret = deriveTotpSecret(this.cfg.staffMfaKey, userId, generation);
    return { secret: base32Encode(secret), otpauthUri: otpauthUri(secret, staff.displayName) };
  }

  /** Vérifie le code TOTP (et confirme l'enrôlement le cas échéant) puis ouvre une session. */
  async completeMfa(pendingToken: string | undefined, code: string, requestId: string | null): Promise<StaffSessionIssued> {
    const userId = this.pendingUser(pendingToken);
    const staff = await this.repo.loadStaff(userId);
    if (!staff || BLOCKED_STATUSES.has(staff.userStatus)) throw loginRefused();
    const state = await this.repo.mfaState(userId);
    if (state.generation === 0) throw new AppError('PRECONDITION_FAILED', 'Enrôlement MFA requis', { detailsSafe: { reason: 'MFA_ENROLLMENT_REQUIRED' } });
    const now = this.clock.now();
    const step = verifyTotp(deriveTotpSecret(this.cfg.staffMfaKey, userId, state.generation), code, now);
    if (step === null) {
      await this.audit.recordNow({ actorUserId: userId, actorRole: staff.roles.join(','), action: 'staff.mfa_failed', targetType: 'StaffUser', targetId: userId, reason: null, requestId });
      throw new AppError('UNAUTHENTICATED', 'Code MFA invalide');
    }
    const sessionId = this.random.uuid();
    const sessionToken = `${sessionId}.${this.random.hex(32)}`;
    const expiresAt = new Date(now.getTime() + this.cfg.sessionTtlMs);
    await this.uow.run(async (scope) => {
      if (!(await this.repo.consumeTotpStep(scope, userId, step))) throw new AppError('UNAUTHENTICATED', 'Code MFA déjà utilisé');
      if (!state.enrolled) {
        await this.repo.setMfaEnrolled(scope, userId, true);
        await this.audit.record(scope, { actorUserId: userId, actorRole: staff.roles.join(','), action: 'staff.mfa.enrolled', targetType: 'StaffUser', targetId: userId, reason: null, requestId });
      }
      await this.repo.createSession(scope, { id: sessionId, userId, tokenHash: hashStaffSessionToken(this.cfg.staffSessionSecret, sessionToken), expiresAt });
      await this.audit.record(scope, { actorUserId: userId, actorRole: staff.roles.join(','), action: 'staff.session_opened', targetType: 'StaffSession', targetId: sessionId, reason: null, requestId });
    });
    return { sessionToken, csrfToken: csrfFor(this.cfg.staffSessionSecret, sessionId), expiresAt: expiresAt.toISOString(), idleTimeoutSeconds: Math.round(this.cfg.idleTimeoutMs / 1000) };
  }

  /** Résout un cookie de session staff ; null si invalide, expiré, inactif, révoqué ou rôle retiré. */
  async resolve(sessionToken: string | undefined): Promise<StaffContext | null> {
    if (!sessionToken) return null;
    const sessionId = sessionToken.split('.')[0] ?? '';
    if (!UUID_RE.test(sessionId)) return null;
    const s = await this.repo.findSession(sessionId);
    const now = this.clock.now();
    if (!s || s.revokedAt || s.expiresAt <= now) return null;
    if (now.getTime() - s.lastUsedAt.getTime() > this.cfg.idleTimeoutMs) return null;
    if (s.tokenHash !== hashStaffSessionToken(this.cfg.staffSessionSecret, sessionToken)) return null;
    const staff = await this.repo.loadStaff(s.userId);
    if (!staff || !staff.mfaEnrolled || BLOCKED_STATUSES.has(staff.userStatus)) return null;
    if (now.getTime() - s.lastUsedAt.getTime() > 30_000) await this.repo.touchSession(s.id, now);
    return { userId: staff.userId, sessionId: s.id, roles: staff.roles, displayName: staff.displayName, sessionExpiresAt: s.expiresAt };
  }

  async stepUp(ctx: StaffContext, code: string, requestId: string | null): Promise<{ validUntil: string }> {
    const state = await this.repo.mfaState(ctx.userId);
    const now = this.clock.now();
    const step = verifyTotp(deriveTotpSecret(this.cfg.staffMfaKey, ctx.userId, state.generation), code, now);
    if (step === null) throw new AppError('UNAUTHENTICATED', 'Code MFA invalide');
    await this.uow.run(async (scope) => {
      if (!(await this.repo.consumeTotpStep(scope, ctx.userId, step))) throw new AppError('UNAUTHENTICATED', 'Code MFA déjà utilisé');
      await this.audit.record(scope, { actorUserId: ctx.userId, actorRole: ctx.roles.join(','), action: 'staff.step_up', targetType: 'StaffSession', targetId: ctx.sessionId, reason: null, requestId });
    });
    return { validUntil: new Date(now.getTime() + STEP_UP_TTL_SECONDS * 1000).toISOString() };
  }

  async stepUpValidUntil(sessionId: string): Promise<Date | null> {
    const at = await this.repo.lastStepUpAt(sessionId);
    if (!at) return null;
    const until = new Date(at.getTime() + STEP_UP_TTL_SECONDS * 1000);
    return until > this.clock.now() ? until : null;
  }

  async me(ctx: StaffContext): Promise<StaffMe> {
    const stepUp = await this.stepUpValidUntil(ctx.sessionId);
    return {
      userId: ctx.userId,
      displayName: ctx.displayName,
      roles: ctx.roles,
      permissions: [...permissionsOf(ctx.roles)].sort(),
      sessionId: ctx.sessionId,
      sessionExpiresAt: ctx.sessionExpiresAt.toISOString(),
      stepUpValidUntil: stepUp?.toISOString() ?? null,
    };
  }

  async sessions(ctx: StaffContext): Promise<StaffSessionView[]> {
    const rows = await this.repo.listSessions(ctx.userId, this.clock.now());
    return rows.map((s) => ({ id: s.id, createdAt: s.createdAt.toISOString(), lastUsedAt: s.lastUsedAt.toISOString(), expiresAt: s.expiresAt.toISOString(), current: s.id === ctx.sessionId }));
  }

  async revoke(ctx: StaffContext, sessionId: string, requestId: string | null): Promise<void> {
    await this.uow.run(async (scope) => {
      const ok = await this.repo.revokeSession(scope, ctx.userId, sessionId, scope.now);
      if (!ok) throw Errors.notFound('Session');
      await this.audit.record(scope, { actorUserId: ctx.userId, actorRole: ctx.roles.join(','), action: 'staff.session_revoked', targetType: 'StaffSession', targetId: sessionId, reason: null, requestId });
    });
  }
}
