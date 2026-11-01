/**
 * Connexion : vérifie l'identité auprès du fournisseur (hors transaction, appel réseau possible),
 * puis crée/charge le compte et ouvre une session appareil révocable.
 */
import type { Session, SignInRequest } from '@blowy/api-contract';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import { AppError } from '../../../shared/domain/errors.js';
import { hashSessionToken } from '../domain/session-token.js';
import type { AccountRepository, SessionRepository } from './ports/account.repository.js';
import type { IdentityProvider } from './ports/identity-provider.port.js';

export interface SignInConfig {
  sessionSecret: string;
  sessionTtlDays: number;
}

export class SignInUseCase {
  constructor(
    private readonly providers: ReadonlyMap<string, IdentityProvider>,
    private readonly uow: UnitOfWork,
    private readonly accounts: AccountRepository,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly cfg: SignInConfig,
  ) {}

  async execute(req: SignInRequest): Promise<Session> {
    const provider = this.providers.get(req.provider);
    if (!provider) throw new AppError('NOT_CONFIGURED', `Fournisseur d'authentification ${req.provider} indisponible`);
    const identity = await provider.verify(req.credential);
    const sessionId = this.random.uuid();
    const accessToken = `${sessionId}.${this.random.hex(32)}`;
    const expiresAt = new Date(this.clock.now().getTime() + this.cfg.sessionTtlDays * 86_400_000);

    return this.uow.run(async (scope) => {
      let account = await this.accounts.findByIdentity(scope, identity.provider, identity.subject);
      const isNewUser = !account;
      if (!account) {
        account = await this.accounts.createWithIdentity(scope, this.random.uuid(), identity);
      } else {
        await this.accounts.touchIdentity(scope, identity.provider, identity.subject);
      }
      if (account.status === 'BANNED' || account.status === 'DELETED' || account.status === 'SUSPENDED') {
        throw new AppError('FORBIDDEN', 'Compte indisponible', { detailsSafe: { status: account.status } });
      }
      await this.sessions.create(scope, {
        sessionId,
        userId: account.userId,
        tokenHash: hashSessionToken(accessToken, this.cfg.sessionSecret),
        expiresAt,
        deviceLabel: req.device.label,
        platform: req.device.platform,
        appVersion: req.device.appVersion,
      });
      await scope.outbox.emit({ topic: 'auth.session_opened', aggregateType: 'User', aggregateId: account.userId, payload: { sessionId, isNewUser } });
      return {
        accessToken,
        sessionId,
        userId: account.userId,
        expiresAt: expiresAt.toISOString(),
        isNewUser,
        onboardingRequired: !account.onboarded,
      };
    });
  }
}
