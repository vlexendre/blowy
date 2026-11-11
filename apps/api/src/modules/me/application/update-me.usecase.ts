import { Inject, Injectable } from '@nestjs/common';
import type { UpdateMeBody } from '@blowy/contract';
import { DomainError } from '../../../shared/errors';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilePatch, ProfilesRepository } from '../ports';

@Injectable()
export class UpdateMe {
  constructor(@Inject(PROFILES) private readonly profiles: ProfilesRepository) {}

  async execute(userId: string, body: UpdateMeBody): Promise<void> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
    const patch: ProfilePatch = {};
    if (body.displayName !== undefined) patch.displayName = body.displayName;
    if (body.city !== undefined) patch.city = body.city ? body.city : null;
    if (Object.keys(patch).length > 0) await this.profiles.update(userId, patch);
  }
}
