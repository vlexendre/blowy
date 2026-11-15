import { Inject, Injectable } from '@nestjs/common';
import type { UpdateMeBody } from '@blowy/contract';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK, PROFILES } from '../../../shared/tokens';
import { applyIdentity, identityChanged } from '../../vision/application/identity';
import type { MatchCacheRepository } from '../../vision/ports';
import { MATCH_CACHE } from '../../vision/tokens';
import type { ProfilePatch, ProfilesRepository } from '../ports';

@Injectable()
export class UpdateMe {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(MATCH_CACHE) private readonly cache: MatchCacheRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(userId: string, body: UpdateMeBody): Promise<void> {
    const current = await this.profiles.findById(userId);
    if (!current) throw new DomainError('not_onboarded');
    const patch: ProfilePatch = {};
    if (body.displayName !== undefined) patch.displayName = body.displayName;
    if (body.locale !== undefined) patch.locale = body.locale;
    if (body.discreet !== undefined) patch.discreet = body.discreet;
    const touchesIdentity = body.gender !== undefined || body.seeking !== undefined || body.whom !== undefined || body.sensitiveConsent !== undefined;
    if (touchesIdentity) {
      const next = applyIdentity(current, { gender: body.gender, seeking: body.seeking, whom: body.whom, sensitiveConsent: body.sensitiveConsent }, this.clock.now().toISOString());
      Object.assign(patch, next);
      if (identityChanged(current, next)) await this.cache.clear(userId);
    }
    if (Object.keys(patch).length > 0) await this.profiles.update(userId, patch);
  }
}
