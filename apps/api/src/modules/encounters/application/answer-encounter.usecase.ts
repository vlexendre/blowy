import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/errors';
import { ENCOUNTERS } from '../../../shared/tokens';
import { CreateLink } from '../../links/application/create-link.usecase';
import type { LinkRecord } from '../../links/ports';
import type { EncounterRecord, EncountersRepository } from '../ports';

/** Réponse à un coucou reçu : seule la personne saluée peut accepter ou refuser. */
@Injectable()
export class AnswerEncounter {
  constructor(
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(CreateLink) private readonly createLink: CreateLink,
  ) {}

  async accept(encounterId: string, userId: string): Promise<LinkRecord> {
    const encounter = await this.received(encounterId, userId);
    if (encounter.status === 'declined') throw new DomainError('conflict', 'Tu as déjà refusé cette rencontre.');
    // Le lien est créé avant de marquer la rencontre acceptée : en cas d'échec, on peut réessayer.
    const link = await this.createLink.execute({ by: userId, with: encounter.fromUser, notify: encounter.fromUser });
    if (encounter.status !== 'accepted') await this.encounters.setStatus(encounter.id, 'accepted');
    return link;
  }

  async decline(encounterId: string, userId: string): Promise<void> {
    const encounter = await this.received(encounterId, userId);
    if (encounter.status === 'accepted') throw new DomainError('conflict', 'Vous êtes déjà liés.');
    if (encounter.status !== 'declined') await this.encounters.setStatus(encounter.id, 'declined');
  }

  private async received(encounterId: string, userId: string): Promise<EncounterRecord> {
    const encounter = await this.encounters.findById(encounterId);
    if (!encounter || (encounter.toUser !== userId && encounter.fromUser !== userId)) throw new DomainError('not_found', 'Cette rencontre est introuvable.');
    if (encounter.toUser !== userId) throw new DomainError('forbidden', 'C’est à l’autre personne de répondre.');
    return encounter;
  }
}
