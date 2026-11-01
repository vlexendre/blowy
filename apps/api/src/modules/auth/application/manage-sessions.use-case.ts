import type { DeviceSessionView } from '@blowy/api-contract';
import type { Clock } from '../../../shared/application/clock.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { SessionRepository } from './ports/account.repository.js';

export class ListSessionsQuery {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}
  async execute(userId: string, currentSessionId: string): Promise<DeviceSessionView[]> {
    const rows = await this.sessions.listActive(userId, this.clock.now());
    return rows.map((s) => ({
      id: s.id,
      deviceLabel: s.deviceLabel,
      platform: s.platform,
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt.toISOString(),
      current: s.id === currentSessionId,
    }));
  }
}

/** Révocation d'une session appareil (déconnexion = révoquer la session courante). */
export class RevokeSessionUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly sessions: SessionRepository,
  ) {}
  async execute(userId: string, sessionId: string): Promise<void> {
    await this.uow.run(async (scope) => {
      const ok = await this.sessions.revoke(scope, userId, sessionId);
      if (!ok) throw Errors.notFound('Session');
      await scope.outbox.emit({ topic: 'auth.session_revoked', aggregateType: 'User', aggregateId: userId, payload: { sessionId } });
    });
  }
}
