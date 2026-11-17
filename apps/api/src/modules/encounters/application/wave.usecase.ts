import { Inject, Injectable } from '@nestjs/common';
import { encounterIntroLine, waveReceivedEmail } from '@blowy/content';
import { compatibility } from '@blowy/domain';
import type { Env } from '../../../config/env';
import { Notifier } from '../../../integrations/mailer/notifier';
import { NOTIFIER, type Notifier as PushNotifier } from '../../../integrations/push/notifier';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { seedOf } from '../../../shared/seed';
import { CLOCK, ENCOUNTERS, ENV, IDS, LINKS, PETS, PROFILES } from '../../../shared/tokens';
import { CreateLink } from '../../links/application/create-link.usecase';
import type { LinksRepository } from '../../links/ports';
import type { ProfilesRepository } from '../../me/ports';
import { PetCharacter } from '../../pets/application/pet-character';
import type { PetsRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import type { EncountersRepository } from '../ports';

/**
 * Saluer le pet de quelqu'un. Idempotent. Si l'autre avait déjà salué, c'est réciproque :
 * les deux coucous sont acceptés et le lien se crée tout de suite. Un minimoa qui boude salue quand même (les soins ne bloquent pas les gens).
 */
@Injectable()
export class Wave {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(CreateLink) private readonly createLink: CreateLink,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(Notifier) private readonly notifier: Notifier,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(ENV) private readonly env: Env,
    @Inject(NOTIFIER) private readonly push: PushNotifier,
    @Inject(Audience) private readonly audience: Audience,
  ) {}

  async execute(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) throw new DomainError('invalid', errorText('waveSelf'));
    const [me, target, myPet, targetPet] = await Promise.all([
      this.profiles.findById(userId),
      this.profiles.findById(targetId),
      this.pets.findByOwner(userId),
      this.pets.findByOwner(targetId),
    ]);
    if (!me || !myPet) throw new DomainError('not_onboarded');
    // Une personne bloquée (dans un sens ou l'autre), suspendue ou supprimée est introuvable (Audience).
    if (!target || !targetPet || !(await this.audience.reachable(userId, targetId))) throw new DomainError('not_found', errorText('personNotFound'));
    const [a, b] = userId < targetId ? [userId, targetId] : [targetId, userId];
    const link = await this.links.findBetween(a, b);
    if (link && link.status !== 'archived') throw new DomainError('conflict', errorText('alreadyLinked'));
    if (await this.encounters.findPair(userId, targetId)) return;
    const theirs = await this.encounters.findPair(targetId, userId);
    const mutual = theirs?.status === 'waved';
    const now = this.clock.now().toISOString();
    const created = await this.encounters.create({
      id: this.ids.uuid(),
      fromUser: userId,
      toUser: targetId,
      status: mutual ? 'accepted' : 'waved',
      intro: encounterIntroLine(me.locale, { other: targetPet.name, via: 'new', compatibility: compatibility(myPet.gauges, targetPet.gauges), mutualName: null }, seedOf('wave', userId, targetId)),
      createdAt: now,
      statusAt: now,
    });
    if (!created) return;
    await this.character.apply(userId, 'waved');

    if (theirs && mutual) {
      await this.encounters.setStatus(theirs.id, 'accepted', now);
      await this.createLink.execute({ by: userId, with: targetId, notify: targetId });
      return;
    }
    await this.notifier.notify(
      targetId,
      waveReceivedEmail(target.locale, { displayName: target.displayName, petName: targetPet.name, fromName: me.displayName, fromPetName: myPet.name, appUrl: this.env.webUrl }),
    );
    await this.push.notify(targetId, 'waved', { name: me.displayName, minimoa: myPet.name });
  }
}
