import { Inject, Injectable } from '@nestjs/common';
import { encounterIntroLine, waveReceivedEmail } from '@blowy/content';
import { compatibility } from '@blowy/domain';
import type { Env } from '../../../config/env';
import { Notifier } from '../../../integrations/mailer/notifier';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { seedOf } from '../../../shared/seed';
import { BLOCKS, CLOCK, ENCOUNTERS, ENV, IDS, LINKS, PETS, PROFILES } from '../../../shared/tokens';
import { CreateLink } from '../../links/application/create-link.usecase';
import type { LinksRepository } from '../../links/ports';
import type { ProfilesRepository } from '../../me/ports';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetsRepository } from '../../pets/ports';
import type { BlocksRepository } from '../../safety/ports';
import type { EncountersRepository } from '../ports';

/**
 * Saluer le pet de quelqu'un. Idempotent. Si l'autre avait déjà salué, c'est réciproque :
 * les deux coucous sont acceptés et le lien se crée tout de suite.
 */
@Injectable()
export class Wave {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(BLOCKS) private readonly blocks: BlocksRepository,
    @Inject(CreateLink) private readonly createLink: CreateLink,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(Notifier) private readonly notifier: Notifier,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async execute(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) throw new DomainError('invalid', 'Ton pet se connaît déjà très bien.');
    const [me, target, myPet, targetPet] = await Promise.all([
      this.profiles.findById(userId),
      this.profiles.findById(targetId),
      this.pets.findByOwner(userId),
      this.pets.findByOwner(targetId),
    ]);
    if (!me || !myPet) throw new DomainError('not_onboarded');
    // Une personne bloquée (dans un sens ou l'autre) est introuvable.
    if (!target || !targetPet || (await this.blocks.blockedEitherWay(userId)).has(targetId)) throw new DomainError('not_found', 'Cette personne est introuvable.');
    const [a, b] = userId < targetId ? [userId, targetId] : [targetId, userId];
    const link = await this.links.findBetween(a, b);
    if (link && link.status !== 'archived') throw new DomainError('conflict', 'Vous êtes déjà liés.');

    if (await this.encounters.findPair(userId, targetId)) return;
    const theirs = await this.encounters.findPair(targetId, userId);
    const mutual = theirs?.status === 'waved';
    const created = await this.encounters.create({
      id: this.ids.uuid(),
      fromUser: userId,
      toUser: targetId,
      status: mutual ? 'accepted' : 'waved',
      intro: encounterIntroLine({ other: targetPet.name, via: 'new', compatibility: compatibility(myPet.gauges, targetPet.gauges), mutualName: null }, seedOf('wave', userId, targetId)),
      createdAt: this.clock.now().toISOString(),
    });
    if (!created) return;
    await this.character.apply(userId, 'waved');

    if (theirs && mutual) {
      await this.encounters.setStatus(theirs.id, 'accepted');
      await this.createLink.execute({ by: userId, with: targetId, notify: targetId });
      return;
    }
    await this.notifier.notify(
      targetId,
      waveReceivedEmail({ displayName: target.displayName, petName: targetPet.name, fromName: me.displayName, fromPetName: myPet.name, appUrl: this.env.webUrl }),
    );
  }
}
