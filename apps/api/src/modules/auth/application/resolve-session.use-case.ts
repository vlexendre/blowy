/** Résolution d'un jeton Bearer → utilisateur authentifié (implémente SessionResolver du guard). */
import type { Clock } from '../../../shared/application/clock.js';
import type { AuthenticatedUser, SessionResolver } from '../../../shared/application/session.port.js';
import { hashSessionToken, safeEqualHex } from '../domain/session-token.js';
import type { SessionRepository } from './ports/account.repository.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOUCH_EVERY_MS = 5 * 60_000;

export class ResolveSessionUseCase implements SessionResolver {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
    private readonly sessionSecret: string,
  ) {}

  async resolve(token: string): Promise<AuthenticatedUser | null> {
    const sessionId = token.split('.')[0] ?? '';
    if (!UUID_RE.test(sessionId)) return null;
    const s = await this.sessions.findById(sessionId);
    const now = this.clock.now();
    if (!s || s.revokedAt || s.expiresAt <= now) return null;
    if (s.userStatus === 'BANNED' || s.userStatus === 'DELETED' || s.userStatus === 'SUSPENDED') return null;
    if (!safeEqualHex(s.tokenHash, hashSessionToken(token, this.sessionSecret))) return null;
    if (now.getTime() - s.lastUsedAt.getTime() > TOUCH_EVERY_MS) await this.sessions.touch(s.id, now);
    return { userId: s.userId, sessionId: s.id, expiresAt: s.expiresAt };
  }
}
