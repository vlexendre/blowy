import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { type Day, type Entitlements, dayOf, entitlements, parisHourOf } from '@blowy/domain';
import { NOTIFIER, type NotificationKind, type Notifier } from '../../../integrations/push/notifier';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PROFILES } from '../../../shared/tokens';
import { hasPlus } from '../../me/application/plus';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { EMPTY_RITUAL_STATE, type RitualStateRecord, type RitualStatesRepository } from '../ports';
import { RITUAL_STATES } from '../tokens';

/** Ce que tous les cas d'usage des rituels partagent : l'instant, le jour de Paris, la personne et ses limites. */
@Injectable()
export class RitualsContext {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  now(): Date {
    return this.clock.now();
  }

  today(): Day {
    return dayOf(this.clock.now());
  }

  hour(): number {
    return parisHourOf(this.clock.now());
  }

  async profile(userId: string): Promise<Profile> {
    const profile = await this.profiles.findById(userId);
    if (!profile) throw new DomainError('not_onboarded');
    return profile;
  }

  limitsOf(profile: Pick<Profile, 'plusUntil'> | null): Entitlements {
    return entitlements(hasPlus(profile, this.clock.now()));
  }

  async state(userId: string): Promise<RitualStateRecord> {
    return (await this.states.find(userId)) ?? EMPTY_RITUAL_STATE(userId);
  }
}

/**
 * Notifications déclenchées par les rituels. On appelle seulement le port de la plateforme (réglages, heures calmes
 * et plafonds sont son affaire) ; un échec n'interrompt jamais une requête ni une tâche.
 */
@Injectable()
export class RitualNotifications {
  private readonly logger = new Logger('Rituels');

  constructor(@Optional() @Inject(NOTIFIER) private readonly notifier?: Notifier) {}

  async send(userId: string, kind: NotificationKind, vars?: Record<string, string>): Promise<void> {
    if (!this.notifier) return;
    try {
      await this.notifier.notify(userId, kind, vars);
    } catch (err) {
      this.logger.warn(`notification ${kind} non envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }
}
