/**
 * Tick 15 min (worker) : avance les pets actifs ; les inactifs (> lazyCatchUpAfterDays) sont
 * rattrapés paresseusement à la lecture/commande suivante. Idempotent : avancer à `to`
 * deux fois n'applique pas deux fois la baisse (le moteur intègre depuis `asOf`).
 */
import type { UnitOfWork } from '../../../shared/application/unit-of-work.js';
import type { PetTimeService } from './pet-time.service.js';
import type { PetRepository } from './ports/pet.repository.js';

export class TickPetsUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly repo: PetRepository,
    private readonly time: PetTimeService,
    private readonly lazyAfterDays: number,
  ) {}

  async execute(now: Date, limit = 500): Promise<number> {
    const activeSince = new Date(now.getTime() - this.lazyAfterDays * 86_400_000);
    const ids = await this.repo.dueForTick(now, activeSince, limit);
    let n = 0;
    for (const id of ids) {
      await this.uow.run(async (scope) => {
        await scope.lock.pets([id]);
        const p = await this.repo.load(scope, id);
        if (!p || p.snapshot.asOf >= now) return;
        const { pet } = await this.time.advance(p, now);
        await this.repo.saveState(scope, id, pet.snapshot);
        n++;
      });
    }
    return n;
  }
}
