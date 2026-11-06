/** Commandes me.update_preferences et me.update_privacy (remplacement complet, validé). */
import type { MatchPreferences, UpdatePrivacyV5Request } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { UserProfileRepository } from './ports/user-profile.repository.js';

export class UpdatePreferencesUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: UserProfileRepository,
  ) {}
  execute(actorId: string, commandId: string, prefs: MatchPreferences) {
    return this.bus.execute({
      actorId,
      operation: 'me.update_preferences',
      commandId,
      payload: prefs,
      handle: async (scope) => {
        await this.repo.savePreferences(scope, actorId, prefs);
        await scope.outbox.emit({ topic: 'user.preferences_changed', aggregateType: 'User', aggregateId: actorId, payload: {} });
        return { ok: true };
      },
    });
  }
}

export class UpdatePrivacyUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: UserProfileRepository,
  ) {}
  /**
   * V5 : mise à jour PARTIELLE (`UpdatePrivacyV5RequestSchema`, compatible avec le corps V4 complet).
   * V5.4 (A.5) : `discreetMode` (« Discret » / « Normal ») est un choix explicite, exigé avant la fin de
   * l'onboarding — aucun des deux n'est présélectionné. `mapVisible` (V4) est ignoré.
   */
  execute(actorId: string, commandId: string, req: UpdatePrivacyV5Request) {
    const privacy = { ...(req.photoPreference ? { photoPreference: req.photoPreference } : {}), ...(req.ageDisplay ? { ageDisplay: req.ageDisplay } : {}), ...(req.discreetMode !== undefined ? { discreetMode: req.discreetMode } : {}) };
    return this.bus.execute({
      actorId,
      operation: 'me.update_privacy',
      commandId,
      payload: privacy,
      handle: async (scope) => {
        await this.repo.savePrivacy(scope, actorId, privacy);
        // Un passage à NEVER révoque les autorisations photo futures (consommé par media, agent E).
        if (privacy.photoPreference) await scope.outbox.emit({ topic: 'user.privacy_changed', aggregateType: 'User', aggregateId: actorId, payload: { photoPreference: privacy.photoPreference } });
        return { ok: true };
      },
    });
  }
}
