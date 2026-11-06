/**
 * Préférences V5.1 (spec-v5 §2.15, concept-v5.1 C.9–C.11, D.13–D.14, B.8, F.17, G.20) :
 *  - intentions SECRÈTES (potes / histoire / les deux, sous-choix, mode préféré, genres) — lues
 *    seulement par la personne elle-même ; `romanceGenders` exige le consentement explicite
 *    SENSITIVE_PREFERENCES (403 CONSENT_REQUIRED {purpose}) ;
 *  - préférences de sortie : tranche d'âge (défaut âge ± 4), disponibilités, semaines off,
 *    activités, quartiers acceptables (≤ 5), trajet déclaratif. Jamais de géolocalisation.
 */
import { SENSITIVE_PREFERENCES_PURPOSE } from '@blowy/domain';
import type { IntentionsV5Dto, OutingPreferencesV5Dto } from '@blowy/api-contract';
import { defaultGroupAge } from '@blowy/pet-engine';
import type { Tuning } from '@blowy/tuning';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock } from '../../../shared/application/clock.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { consentGranted } from '../domain/consents.js';
import type { PreferencesV5Repository } from './ports/preferences-v5.repository.js';
import type { UserProfileRepository } from './ports/user-profile.repository.js';

export class PreferencesV5UseCases {
  constructor(
    private readonly repo: PreferencesV5Repository,
    private readonly users: UserProfileRepository,
    private readonly bus: CommandBus,
    private readonly clock: Clock,
    private readonly tuning: Tuning,
  ) {}

  async intentions(userId: string): Promise<IntentionsV5Dto> {
    const i = await this.repo.intentions(userId);
    if (!i) throw Errors.notFound('Intentions');
    return i;
  }

  async saveIntentions(userId: string, i: IntentionsV5Dto, commandId: string) {
    if (i.romanceGenders.length > 0 && !consentGranted(await this.users.listConsents(userId), SENSITIVE_PREFERENCES_PURPOSE)) {
      throw new AppError('CONSENT_REQUIRED', 'Consentement explicite requis pour les genres recherchés', { detailsSafe: { purpose: SENSITIVE_PREFERENCES_PURPOSE } });
    }
    await this.bus.execute({
      actorId: userId,
      operation: 'me.update_intentions',
      commandId,
      payload: i,
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await this.repo.saveIntentions(scope, userId, i);
        await scope.outbox.emit({ topic: 'user.preferences_changed', aggregateType: 'User', aggregateId: userId, payload: {} });
        return { ok: true };
      },
    });
    return this.intentions(userId);
  }

  async outingPreferences(userId: string): Promise<OutingPreferencesV5Dto> {
    const p = await this.repo.outingPreferences(userId);
    if (p) return p;
    // V5.6 : rien d'enregistré → valeurs par défaut (jamais 400) ; quartier de la personne s'il est connu.
    const [age, home] = await Promise.all([this.repo.ageOf(userId, this.clock.now()), this.repo.homeNeighborhood(userId)]);
    return { groupAge: defaultGroupAge(age ?? 25, this.tuning), availableSlotTemplateIds: [], weeksOff: [], activities: [], neighborhoodIds: home ? [home] : [], maxTravelMinutes: 30, everyOtherWeekOffFrom: null, everyOtherWeekendOffFrom: null, ambiance: 'ANY', showCalmBadge: false };
  }

  async saveOutingPreferences(userId: string, p: OutingPreferencesV5Dto, commandId: string) {
    if (p.neighborhoodIds.length > this.tuning.preferences.maxNeighborhoods) throw Errors.validation({ field: 'neighborhoodIds' });
    const known = await this.repo.existingNeighborhoods(p.neighborhoodIds);
    if (known.length !== p.neighborhoodIds.length) throw Errors.precondition('NEIGHBORHOOD_NOT_FOUND');
    const slots = await this.repo.slotTemplatesIn(p.availableSlotTemplateIds, p.neighborhoodIds);
    if (slots.length !== p.availableSlotTemplateIds.length) throw Errors.precondition('SLOT_TEMPLATE_NOT_FOUND');
    await this.bus.execute({
      actorId: userId,
      operation: 'me.update_outing_preferences',
      commandId,
      payload: p,
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await this.repo.saveOutingPreferences(scope, userId, p);
        return { ok: true };
      },
    });
    return this.outingPreferences(userId);
  }
}
