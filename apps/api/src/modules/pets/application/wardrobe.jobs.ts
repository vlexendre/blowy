import { Inject, Injectable, Logger } from '@nestjs/common';
import { PREMIUM_ITEM_IDS } from '@blowy/domain';
import { PETS, PROFILES } from '../../../shared/tokens';
import { hasPlus } from '../../me/application/plus';
import type { ProfilesRepository } from '../../me/ports';
import type { PetsRepository } from '../ports';
import { Wardrobe } from './wardrobe';

const BATCH = 200;

/**
 * Travail planifié de la garde-robe (`modules/tick/jobs.ts`) : quand Minimoa+ prend fin, le minimoa range ses objets
 * premium, même si sa personne n'ouvre pas l'app (ses liens et les rencontres ne les voient plus). Sa personne, elle,
 * le voit dès sa prochaine ouverture (`Wardrobe.settle` à chaque vue).
 * Parcourt par pages les pets qui portent un objet premium (curseur gardé en mémoire, repart du début à la fin) ;
 * idempotent : un pet déjà rangé ne correspond plus, un abonné actif garde ses objets.
 */
@Injectable()
export class WardrobeJobs {
  private readonly logger = new Logger('Garde-robe');
  private cursor: string | null = null;

  constructor(
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(Wardrobe) private readonly wardrobe: Wardrobe,
  ) {}

  async runDue(now: Date, deadline?: number): Promise<number> {
    if (deadline !== undefined && Date.now() >= deadline) return 0;
    const page = await this.pets.listWearing(PREMIUM_ITEM_IDS, this.cursor, BATCH);
    this.cursor = page.length === BATCH ? (page[page.length - 1]?.id ?? null) : null;
    if (page.length === 0) return 0;
    const plusOf = new Map((await this.profiles.findByIds(page.map((p) => p.ownerId))).map((p) => [p.id, hasPlus(p, now)]));
    let settled = 0;
    for (const pet of page) {
      if (plusOf.get(pet.ownerId) === true) continue;
      const after = await this.wardrobe.settle(pet, false);
      if (after !== pet) settled += 1;
    }
    if (settled > 0) this.logger.log(`${settled} minimoa(s) ont rangé leurs objets premium (fin de Minimoa+)`);
    return settled;
  }
}
