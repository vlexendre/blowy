import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import { CLOCK, ENCOUNTERS } from '../../../shared/tokens';
import { CreateLink } from '../../links/application/create-link.usecase';
import type { LinkRecord } from '../../links/ports';
import type { EncounterRecord, EncountersRepository } from '../ports';
import { WaveGuard } from './wave-guard';

/** Réponse à un coucou reçu : seule la personne saluée peut accepter ou refuser. */
@Injectable()
export class AnswerEncounter {
  constructor(
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(CreateLink) private readonly createLink: CreateLink,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(WaveGuard) private readonly guard: WaveGuard,
  ) {}

  async accept(encounterId: string, userId: string): Promise<LinkRecord> {
    const encounter = await this.received(encounterId, userId);
    if (encounter.status === 'declined') throw new DomainError('conflict', errorText('encounterDeclined'));
    // Le lien est créé avant de marquer la rencontre acceptée : en cas d'échec, on peut réessayer.
    const link = await this.createLink.execute({ by: userId, with: encounter.fromUser, notify: encounter.fromUser });
    if (encounter.status !== 'accepted') await this.encounters.setStatus(encounter.id, 'accepted', this.clock.now().toISOString());
    return link;
  }

  async decline(encounterId: string, userId: string): Promise<void> {
    const encounter = await this.received(encounterId, userId);
    if (encounter.status === 'accepted') throw new DomainError('conflict', errorText('alreadyLinked'));
    if (encounter.status !== 'declined') {
      await this.encounters.setStatus(encounter.id, 'declined', this.clock.now().toISOString());
      // Beaucoup de refus après ses coucous : la modération est prévenue (repérage, jamais de suspension).
      await this.guard.watch(encounter.fromUser);
    }
  }

  private async received(encounterId: string, userId: string): Promise<EncounterRecord> {
    const encounter = await this.encounters.findById(encounterId);
    if (!encounter || (encounter.toUser !== userId && encounter.fromUser !== userId)) throw new DomainError('not_found', errorText('encounterNotFound'));
    if (encounter.toUser !== userId) throw new DomainError('forbidden', errorText('encounterNotYours'));
    return encounter;
  }
}
