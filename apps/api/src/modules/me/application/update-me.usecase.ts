import { Inject, Injectable } from '@nestjs/common';
import type { UpdateMeBody } from '@blowy/contract';
import { DomainError } from '../../../shared/errors';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilePatch, ProfilesRepository } from '../ports';
import { ContentFilter } from '../../moderation/content-filter';

@Injectable()
export class UpdateMe {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(ContentFilter) private readonly filter: ContentFilter,
  ) {}

  async execute(userId: string, body: UpdateMeBody): Promise<void> {
    const current = await this.profiles.findById(userId);
    if (!current) throw new DomainError('not_onboarded');
    const patch: ProfilePatch = {};
    if (body.displayName !== undefined && body.displayName !== current.displayName) {
      this.filter.checkName('display_name', body.displayName, body.locale ?? current.locale);
      patch.displayName = body.displayName;
    }
    if (body.locale !== undefined) patch.locale = body.locale;
    if (body.discreet !== undefined) patch.discreet = body.discreet;
    if (body.showHabits !== undefined) patch.showHabits = body.showHabits;
    // Le sexe ne filtre plus rien (spéc. §27) ; `seeking`, `whom`, `sensitiveConsent` d'une ancienne app sont ignorés.
    if (body.gender !== undefined) patch.gender = body.gender;
    if (Object.keys(patch).length > 0) await this.profiles.update(userId, patch);
  }
}
