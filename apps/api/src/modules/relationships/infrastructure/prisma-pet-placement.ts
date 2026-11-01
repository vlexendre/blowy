import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { PetPlacement } from '../application/ports/relationship-side-effects.port.js';
import type { PetSickness } from '../application/link-progress.service.js';

/** Placement des pets lors des transitions de relation (lieu unique, PK petId). */
export class PrismaPetPlacement implements PetPlacement, PetSickness {
  constructor(private readonly sickBelow: number) {}

  async returnHomeIfIn(scope: TxScope, petId: string, contextId: string) {
    await txOf(scope).virtualLocation.updateMany({ where: { petId, contextId }, data: { kind: 'HOME', contextId: null, since: scope.now, version: { increment: 1 } } });
  }
  async moveToSharedHome(scope: TxScope, petIds: string[], contextId: string) {
    for (const petId of petIds) {
      await txOf(scope).virtualLocation.upsert({
        where: { petId },
        create: { petId, kind: 'SHARED_HOME', contextId, since: scope.now },
        update: { kind: 'SHARED_HOME', contextId, since: scope.now, version: { increment: 1 } },
      });
    }
  }
  async anySick(scope: TxScope, petIds: string[]) {
    return (await txOf(scope).petState.count({ where: { petId: { in: petIds }, health: { lt: this.sickBelow } } })) > 0;
  }
}
