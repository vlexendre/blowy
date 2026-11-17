import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import { CLOCK, PETS, PROFILES } from '../../../shared/tokens';
import { CreateLink } from '../../links/application/create-link.usecase';
import type { LinkRecord } from '../../links/ports';
import type { Profile, ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import type { PetRecord, PetsRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import { Growth } from '../../growth/application/growth';

export interface InviteResult {
  profile: Profile;
  pet: PetRecord;
}

const normalize = (code: string): string => code.trim().toUpperCase();

@Injectable()
export class Invites {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(CreateLink) private readonly createLink: CreateLink,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(Growth) private readonly growth: Growth,
  ) {}

  /** Page publique d'une invitation : le prénom et le pet de la personne qui invite. */
  async get(code: string): Promise<InviteResult> {
    const profile = await this.audience.publiclyVisible(await this.profiles.findByInviteCode(normalize(code)));
    const pet = profile ? await this.pets.findByOwner(profile.id) : null;
    if (!profile || !pet) throw new DomainError('not_found', errorText('inviteNotFound'));
    await this.growth.visit('i');
    return { profile, pet: livePet(pet, this.clock.now()) };
  }

  async accept(code: string, userId: string): Promise<LinkRecord> {
    const [owner, me, myPet] = await Promise.all([
      this.profiles.findByInviteCode(normalize(code)),
      this.profiles.findById(userId),
      this.pets.findByOwner(userId),
    ]);
    if (!me || !myPet) throw new DomainError('not_onboarded');
    // Monde d'exemple du compte de revue d'Apple, d'un côté ou de l'autre : introuvable (jamais de lien avec un vrai compte).
    if (!owner || (owner.reviewWorld ?? null) !== (me.reviewWorld ?? null)) throw new DomainError('not_found', errorText('inviteNotFound'));
    if (owner.id === userId) throw new DomainError('conflict', errorText('inviteOwn'));
    // Bloqué dans un sens ou dans l'autre, suspendu : introuvable, comme la page publique (rien ne trahit un blocage).
    if (!(await this.audience.reachable(userId, owner.id))) throw new DomainError('not_found', errorText('inviteNotFound'));
    return this.createLink.execute({ by: userId, with: owner.id, notify: owner.id });
  }
}
