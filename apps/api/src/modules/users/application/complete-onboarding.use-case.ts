/** Fin d'onboarding : exige 18+, pet principal, préférences et consentements nécessaires. */
import type { CommandBus } from '../../../shared/application/command-bus.js';
import { Errors } from '../../../shared/domain/errors.js';
import { socialAllowed } from '../domain/consents.js';
import type { UserProfileRepository } from './ports/user-profile.repository.js';

export class CompleteOnboardingUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: UserProfileRepository,
  ) {}
  execute(actorId: string, commandId: string) {
    return this.bus.execute({
      actorId,
      operation: 'me.complete_onboarding',
      commandId,
      payload: {},
      handle: async (scope) => {
        await scope.lock.users([actorId]);
        const u = await this.repo.load(actorId, scope.now);
        if (!u) throw Errors.notFound('Utilisateur');
        const missing: string[] = [];
        if (!u.birthDate) missing.push('birthDate');
        if (!u.primaryPetId) missing.push('primaryPet');
        if (!u.preferences) missing.push('preferences');
        if (!u.zoneCode) missing.push('zone');
        if (!socialAllowed(await this.repo.listConsents(actorId))) missing.push('consents');
        // V5.4 (A.5) : « Discret » ou « Normal », choisi explicitement (aucun défaut présélectionné).
        if (!u.privacy.discreetModeChosen) missing.push('discreetMode');
        if (missing.length) throw Errors.precondition('ONBOARDING_INCOMPLETE', { missing });
        if (!u.onboardedAt) {
          await this.repo.markOnboarded(scope, actorId);
          await scope.outbox.emit({ topic: 'user.onboarded', aggregateType: 'User', aggregateId: actorId, payload: {} });
        }
        return { ok: true };
      },
    });
  }
}
