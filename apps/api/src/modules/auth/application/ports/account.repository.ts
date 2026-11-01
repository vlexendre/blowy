import type { TxScope } from '../../../../shared/application/unit-of-work.js';
import type { VerifiedIdentity } from '../../domain/identity.js';

export interface AccountRecord {
  userId: string;
  status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED' | 'DELETED';
  onboarded: boolean;
}

export interface NewSession {
  sessionId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceLabel?: string | undefined;
  platform?: string | undefined;
  appVersion?: string | undefined;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  deviceLabel: string | null;
  platform: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  userStatus: AccountRecord['status'];
}

export interface AccountRepository {
  findByIdentity(scope: TxScope, provider: VerifiedIdentity['provider'], subject: string): Promise<AccountRecord | null>;
  createWithIdentity(scope: TxScope, userId: string, identity: VerifiedIdentity): Promise<AccountRecord>;
  touchIdentity(scope: TxScope, provider: VerifiedIdentity['provider'], subject: string): Promise<void>;
}
export const ACCOUNT_REPOSITORY = Symbol('AccountRepository');

export interface SessionRepository {
  create(scope: TxScope, s: NewSession): Promise<void>;
  findById(sessionId: string): Promise<SessionRecord | null>;
  touch(sessionId: string, at: Date): Promise<void>;
  listActive(userId: string, at: Date): Promise<SessionRecord[]>;
  revoke(scope: TxScope, userId: string, sessionId: string): Promise<boolean>;
}
export const SESSION_REPOSITORY = Symbol('SessionRepository');
