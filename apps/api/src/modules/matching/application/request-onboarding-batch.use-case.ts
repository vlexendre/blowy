/** Lot d'onboarding : une fois par utilisateur (kind = ONBOARDING:<userId>, unicité du lot). */
import type { Clock } from '../../../shared/application/clock.js';
import { Errors } from '../../../shared/domain/errors.js';
import type { MatchingRepository } from './ports/matching.repository.js';
import type { RunMatchingBatchUseCase } from './run-matching-batch.use-case.js';

export class RequestOnboardingBatchUseCase {
  constructor(
    private readonly repo: MatchingRepository,
    private readonly runner: RunMatchingBatchUseCase,
    private readonly clock: Clock,
  ) {}
  async execute(userId: string) {
    const zone = await this.repo.zoneOfUser(userId);
    if (!zone) throw Errors.precondition('NO_ZONE');
    const ctx = await this.repo.feedContext(userId, this.clock.now());
    if (!ctx.hasPet || !ctx.verified) return null;
    return this.runner.run(zone.id, zone.timezone, this.clock.now(), `ONBOARDING:${userId}`, userId);
  }
}
