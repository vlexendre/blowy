import type { Db } from '@blowy/database';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { VerifiedIdentity } from '../domain/identity.js';
import type { AccountRecord, AccountRepository, NewSession, SessionRecord, SessionRepository } from '../application/ports/account.repository.js';

export class PrismaAccountRepository implements AccountRepository {
  async findByIdentity(scope: TxScope, provider: VerifiedIdentity['provider'], subject: string): Promise<AccountRecord | null> {
    const ident = await txOf(scope).authIdentity.findUnique({
      where: { provider_subject: { provider, subject } },
      include: { user: { select: { id: true, status: true, onboardedAt: true } } },
    });
    return ident ? { userId: ident.user.id, status: ident.user.status, onboarded: ident.user.onboardedAt !== null } : null;
  }

  async createWithIdentity(scope: TxScope, userId: string, identity: VerifiedIdentity): Promise<AccountRecord> {
    const tx = txOf(scope);
    await tx.user.create({
      data: {
        id: userId,
        email: identity.email,
        emailVerified: identity.emailVerified,
        lastActiveAt: scope.now,
        authIdentities: {
          create: {
            provider: identity.provider,
            subject: identity.subject,
            signInProvider: identity.signInProvider,
            email: identity.email,
            emailVerified: identity.emailVerified,
            lastSeenAt: scope.now,
          },
        },
        privacySettings: { create: {} },
      },
    });
    return { userId, status: 'ACTIVE', onboarded: false };
  }

  async touchIdentity(scope: TxScope, provider: VerifiedIdentity['provider'], subject: string): Promise<void> {
    await txOf(scope).authIdentity.update({ where: { provider_subject: { provider, subject } }, data: { lastSeenAt: scope.now } });
  }
}

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: Db) {}

  async create(scope: TxScope, s: NewSession): Promise<void> {
    await txOf(scope).deviceSession.create({
      data: {
        id: s.sessionId,
        userId: s.userId,
        tokenHash: s.tokenHash,
        expiresAt: s.expiresAt,
        deviceLabel: s.deviceLabel ?? null,
        platform: s.platform ?? null,
        appVersion: s.appVersion ?? null,
        createdAt: scope.now,
        lastUsedAt: scope.now,
      },
    });
  }

  async findById(sessionId: string): Promise<SessionRecord | null> {
    const s = await this.db.deviceSession.findUnique({ where: { id: sessionId }, include: { user: { select: { status: true } } } });
    return s ? { ...s, userStatus: s.user.status } : null;
  }

  async touch(sessionId: string, at: Date): Promise<void> {
    await this.db.deviceSession.update({ where: { id: sessionId }, data: { lastUsedAt: at } });
    await this.db.user.updateMany({ where: { deviceSessions: { some: { id: sessionId } } }, data: { lastActiveAt: at } });
  }

  async listActive(userId: string, at: Date): Promise<SessionRecord[]> {
    const rows = await this.db.deviceSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: at } },
      orderBy: { lastUsedAt: 'desc' },
      include: { user: { select: { status: true } } },
    });
    return rows.map((s) => ({ ...s, userStatus: s.user.status }));
  }

  async revoke(scope: TxScope, userId: string, sessionId: string): Promise<boolean> {
    const r = await txOf(scope).deviceSession.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: scope.now } });
    return r.count === 1;
  }
}
