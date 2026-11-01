/** Consentements de traitement versionnés : enregistrement (commande) et lecture (requête). */
import type { ConsentState, RecordConsentsRequest } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import { Errors } from '../../../shared/domain/errors.js';
import { CURRENT_CONSENT_VERSIONS, latestByPurpose, socialAllowed } from '../domain/consents.js';
import type { UserProfileRepository } from './ports/user-profile.repository.js';

export class RecordConsentsUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: UserProfileRepository,
  ) {}
  execute(actorId: string, commandId: string, req: RecordConsentsRequest) {
    for (const i of req.items) {
      // On ne consent qu'à la version actuellement présentée (pas de consentement rétroactif).
      if (i.granted && i.version !== CURRENT_CONSENT_VERSIONS[i.purpose]) throw Errors.precondition('CONSENT_VERSION_OUTDATED', { purpose: i.purpose });
    }
    return this.bus.execute({
      actorId,
      operation: 'me.record_consents',
      commandId,
      payload: req,
      handle: async (scope) => {
        await this.repo.appendConsents(scope, actorId, req.items);
        const withdrawn = req.items.filter((i) => !i.granted).map((i) => i.purpose);
        if (withdrawn.length) {
          // Retrait : annule jobs/caches IA de cet auteur (consommé par l'agent E).
          await scope.outbox.emit({ topic: 'user.consent_withdrawn', aggregateType: 'User', aggregateId: actorId, payload: { purposes: withdrawn } });
        }
        return { ok: true };
      },
    });
  }
}

export class GetConsentsQuery {
  constructor(private readonly repo: UserProfileRepository) {}
  async execute(userId: string): Promise<ConsentState> {
    const facts = await this.repo.listConsents(userId);
    const latest = [...latestByPurpose(facts).values()];
    return {
      items: latest.map((f) => ({ purpose: f.purpose as keyof typeof CURRENT_CONSENT_VERSIONS, version: f.version, granted: f.granted, recordedAt: f.createdAt.toISOString() })),
      currentVersions: { ...CURRENT_CONSENT_VERSIONS },
      socialAllowed: socialAllowed(facts),
    };
  }
}
