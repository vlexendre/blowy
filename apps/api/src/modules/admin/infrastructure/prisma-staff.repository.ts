/**
 * Adapter Prisma du dépôt staff — CONTOURNEMENT SCHÉMA documenté (docs/agents/handoffs/F.md) :
 *  - sessions staff = lignes `DeviceSession` avec `platform = 'staff-admin'` et une empreinte
 *    calculée avec séparation de domaine (« staff: ») : le résolveur mobile (HMAC du jeton brut)
 *    ne peut jamais les valider, et ce dépôt n'accepte que les lignes staff ;
 *  - génération d'enrôlement MFA = nombre d'entrées d'audit `staff.mfa.enrollment_started` ;
 *    « enrôlé » = `StaffRoleAssignment.mfaEnrolled` ;
 *  - anti-rejeu TOTP = `CommandRecord(actor, 'staff.totp_step', uuid(step))` (unique) ;
 *  - step-up = entrée d'audit `staff.step_up` (targetId = session).
 */
import { createHash } from 'node:crypto';
import type { Db } from '@blowy/database';
import type { StaffRoleV5 as StaffRole } from '@blowy/domain';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { StaffAccount, StaffMfaState, StaffRepository, StaffSessionRecord } from '../application/ports/admin.ports.js';

export const STAFF_PLATFORM = 'staff-admin';

/** UUID déterministe (format v8) dérivé d'une clé — clé d'unicité CommandRecord. */
export function uuidFromKey(key: string): string {
  const h = createHash('sha256').update(key).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-${((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export class PrismaStaffRepository implements StaffRepository {
  constructor(private readonly db: Db) {}

  private async account(userId: string): Promise<StaffAccount | null> {
    const u = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, profile: { select: { displayName: true } }, staffRoles: { where: { revokedAt: null }, select: { role: true, mfaEnrolled: true } } },
    });
    if (!u || u.staffRoles.length === 0) return null;
    return {
      userId: u.id,
      displayName: u.profile?.displayName ?? 'Staff',
      roles: u.staffRoles.map((r) => r.role as StaffRole).sort(),
      userStatus: u.status,
      mfaEnrolled: u.staffRoles.every((r) => r.mfaEnrolled),
    };
  }

  async findStaffByIdentity(provider: 'FIREBASE' | 'LOCAL', subject: string) {
    const id = await this.findUserIdByIdentity(provider, subject);
    return id ? this.account(id) : null;
  }

  loadStaff(userId: string) {
    return this.account(userId);
  }

  async findUserIdByIdentity(provider: 'FIREBASE' | 'LOCAL', subject: string) {
    const ident = await this.db.authIdentity.findUnique({ where: { provider_subject: { provider, subject } }, select: { userId: true } });
    return ident?.userId ?? null;
  }

  async mfaState(userId: string): Promise<StaffMfaState> {
    const [roles, generation] = await Promise.all([
      this.db.staffRoleAssignment.findMany({ where: { userId, revokedAt: null }, select: { mfaEnrolled: true } }),
      this.db.auditLog.count({ where: { action: 'staff.mfa.enrollment_started', targetType: 'StaffUser', targetId: userId } }),
    ]);
    return { enrolled: roles.length > 0 && roles.every((r) => r.mfaEnrolled), generation };
  }

  async startEnrollment(scope: TxScope, userId: string): Promise<number> {
    const tx = txOf(scope);
    await tx.staffRoleAssignment.updateMany({ where: { userId, revokedAt: null }, data: { mfaEnrolled: false } });
    // L'entrée d'audit de démarrage est écrite par l'appelant ; la génération = compte + 1.
    const n = await tx.auditLog.count({ where: { action: 'staff.mfa.enrollment_started', targetType: 'StaffUser', targetId: userId } });
    return n + 1;
  }

  async setMfaEnrolled(scope: TxScope, userId: string, enrolled: boolean) {
    await txOf(scope).staffRoleAssignment.updateMany({ where: { userId, revokedAt: null }, data: { mfaEnrolled: enrolled } });
  }

  async consumeTotpStep(scope: TxScope, userId: string, step: number): Promise<boolean> {
    const n = await txOf(scope).$executeRaw`INSERT INTO "CommandRecord" (id, "actorId", operation, "commandId", "payloadHash", status, "createdAt", "completedAt")
      VALUES (${uuidFromKey(`totp-row:${userId}:${step}`)}::uuid, ${userId}::uuid, 'staff.totp_step', ${uuidFromKey(`totp:${userId}:${step}`)}::uuid, 'totp', 'COMPLETED', ${scope.now}, ${scope.now})
      ON CONFLICT ("actorId", operation, "commandId") DO NOTHING`;
    return n === 1;
  }

  async createSession(scope: TxScope, s: { id: string; userId: string; tokenHash: string; expiresAt: Date }) {
    await txOf(scope).deviceSession.create({
      data: { id: s.id, userId: s.userId, tokenHash: s.tokenHash, expiresAt: s.expiresAt, platform: STAFF_PLATFORM, deviceLabel: 'Back-office', createdAt: scope.now, lastUsedAt: scope.now },
    });
  }

  async findSession(id: string): Promise<StaffSessionRecord | null> {
    const s = await this.db.deviceSession.findUnique({ where: { id } });
    if (!s || s.platform !== STAFF_PLATFORM) return null;
    return { id: s.id, userId: s.userId, tokenHash: s.tokenHash, createdAt: s.createdAt, lastUsedAt: s.lastUsedAt, expiresAt: s.expiresAt, revokedAt: s.revokedAt };
  }

  async touchSession(id: string, at: Date) {
    await this.db.deviceSession.updateMany({ where: { id, platform: STAFF_PLATFORM }, data: { lastUsedAt: at } });
  }

  async lastStepUpAt(sessionId: string): Promise<Date | null> {
    const row = await this.db.auditLog.findFirst({ where: { action: 'staff.step_up', targetType: 'StaffSession', targetId: sessionId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
    return row?.createdAt ?? null;
  }

  async revokeSession(scope: TxScope, userId: string, id: string, at: Date) {
    const r = await txOf(scope).deviceSession.updateMany({ where: { id, userId, platform: STAFF_PLATFORM, revokedAt: null }, data: { revokedAt: at } });
    return r.count === 1;
  }

  async revokeAllFor(scope: TxScope, userId: string, at: Date) {
    const r = await txOf(scope).deviceSession.updateMany({ where: { userId, platform: STAFF_PLATFORM, revokedAt: null }, data: { revokedAt: at } });
    return r.count;
  }

  async listSessions(userId: string, now: Date): Promise<StaffSessionRecord[]> {
    const rows = await this.db.deviceSession.findMany({ where: { userId, platform: STAFF_PLATFORM, revokedAt: null, expiresAt: { gt: now } }, orderBy: { createdAt: 'desc' }, take: 50 });
    return rows.map((s) => ({ id: s.id, userId: s.userId, tokenHash: s.tokenHash, createdAt: s.createdAt, lastUsedAt: s.lastUsedAt, expiresAt: s.expiresAt, revokedAt: s.revokedAt }));
  }

  async grantRole(scope: TxScope, userId: string, role: StaffRole, grantedBy: string | null) {
    const tx = txOf(scope);
    const existing = await tx.staffRoleAssignment.findUnique({ where: { userId_role: { userId, role } } });
    if (existing && !existing.revokedAt) return false;
    // Un nouveau rôle n'hérite pas d'un enrôlement : MFA à (re)confirmer si aucun rôle actif n'est enrôlé.
    const others = await tx.staffRoleAssignment.findMany({ where: { userId, revokedAt: null } });
    const mfaEnrolled = others.length > 0 && others.every((o) => o.mfaEnrolled);
    if (existing) await tx.staffRoleAssignment.update({ where: { id: existing.id }, data: { revokedAt: null, grantedBy, mfaEnrolled, createdAt: scope.now } });
    else await tx.staffRoleAssignment.create({ data: { userId, role, grantedBy, mfaEnrolled, createdAt: scope.now } });
    return true;
  }

  async revokeRole(scope: TxScope, userId: string, role: StaffRole, at: Date) {
    const r = await txOf(scope).staffRoleAssignment.updateMany({ where: { userId, role, revokedAt: null }, data: { revokedAt: at } });
    return r.count === 1;
  }
}
