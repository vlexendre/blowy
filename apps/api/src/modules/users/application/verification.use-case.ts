/** Démarrage d'une vérification (session créée côté serveur ; adapter selon environnement). */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { RandomSource } from '../../../shared/application/clock.js';
import { AppError } from '../../../shared/domain/errors.js';
import type { UserProfileRepository } from './ports/user-profile.repository.js';
import type { VerificationGateway } from './ports/verification.gateway.js';

/** Démarrage délégué au module trust (agent E : Veriff réel / démo / non configuré). */
export interface VerificationStarter {
  execute(actorId: string, commandId: string, kind: 'SELFIE_QUALITY' | 'LIVENESS' | 'IDENTITY_AGE'): Promise<unknown>;
}
export const VERIFICATION_STARTER = Symbol.for('blowy.trust.verificationStarter');

export class StartVerificationUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: UserProfileRepository,
    private readonly gateway: VerificationGateway,
    private readonly random: RandomSource,
    private readonly delegate: VerificationStarter | null = null,
  ) {}

  async execute(actorId: string, commandId: string, kind: 'SELFIE_QUALITY' | 'LIVENESS' | 'IDENTITY_AGE') {
    if (this.delegate) return this.delegate.execute(actorId, commandId, kind);
    if (this.gateway.mode === 'NOT_CONFIGURED') throw new AppError('NOT_CONFIGURED', 'Vérification non configurée');
    return this.bus.execute({
      actorId,
      operation: 'me.start_verification',
      commandId,
      payload: { kind },
      handle: async (scope) => {
        // L'adapter local est pur ; un adapter réseau (Veriff) devra créer la session hors transaction (agent E).
        const start = await this.gateway.start(actorId, kind, scope.now);
        await this.repo.createVerification(scope, { id: this.random.uuid(), userId: actorId, kind, provenance: start.provenance, status: start.status, providerRef: start.providerRef, expiresAt: start.expiresAt });
        await scope.outbox.emit({ topic: 'user.verification_changed', aggregateType: 'User', aggregateId: actorId, payload: { status: start.status, provenance: start.provenance } });
        return { status: start.status, provenance: start.provenance };
      },
    });
  }
}
