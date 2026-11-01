import type { SelfProfile } from '@blowy/api-contract';
import type { Clock } from '../../../shared/application/clock.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { UserProfileRepository } from './ports/user-profile.repository.js';
import type { VerificationGateway } from './ports/verification.gateway.js';
import { toSelfProfile } from './self-profile.serializer.js';

export class GetSelfProfileQuery {
  constructor(
    private readonly repo: UserProfileRepository,
    private readonly verification: VerificationGateway,
    private readonly clock: Clock,
  ) {}
  async execute(userId: string): Promise<SelfProfile> {
    const now = this.clock.now();
    const u = await this.repo.load(userId, now);
    if (!u) throw Errors.notFound('Utilisateur');
    return toSelfProfile(u, now, this.verification.mode);
  }
}
