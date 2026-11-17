import { Inject, Injectable, Optional } from '@nestjs/common';
import { ITEMS, type PetStats, earnedItems, entitlements, itemById, ownedWith, withoutPremium } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK, LINKS, PET_ITEMS, PETS, PROFILES, WORD_VOTES } from '../../../shared/tokens';
import { hasPlus } from '../../me/application/plus';
import type { ProfilesRepository } from '../../me/ports';
import type { LinksRepository } from '../../links/ports';
import type { RitualStatesRepository } from '../../rituels/ports';
import { RITUAL_STATES } from '../../rituels/tokens';
import type { PetItemsRepository, PetRecord, PetsRepository, WordVotesRepository } from '../ports';
import { PetCharacter } from './pet-character';
import { Growth } from '../../growth/application/growth';

export interface WardrobeState {
  pet: PetRecord;
  stats: PetStats;
  /**
   * Objets possédés : ceux de `pet_items` et ceux déjà gagnés par les compteurs (un objet gagné reste gagné), plus tous
   * les objets premium tant que Minimoa+ est actif (`entitlements().premiumItems`) ; sans Minimoa+, aucun objet premium.
   */
  owned: ReadonlySet<string>;
  /** Minimoa+ actif : les objets premium sont à la personne. */
  plus: boolean;
}

/**
 * Garde-robe d'un pet : compteurs qui débloquent les objets, et attribution des objets gagnés.
 * Seul endroit qui écrit dans `pet_items` (hors monde de démo).
 */
@Injectable()
export class Wardrobe {
  constructor(
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(PET_ITEMS) private readonly items: PetItemsRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(WORD_VOTES) private readonly votes: WordVotesRepository,
    @Inject(RITUAL_STATES) private readonly rituals: RitualStatesRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(Growth) private readonly growth: Growth | null = null,
  ) {}

  /**
   * Ajoute à `pet_items` les objets gagnés que le pet n'a pas encore et rend ceux de cette fois-ci (à fêter).
   * Appelée à chaque vue du pet par sa personne : c'est là que les étapes franchies ailleurs
   * (lien créé, niveau, série, 3 mots) deviennent des objets « nouveaux ».
   */
  async sync(ownerId: string): Promise<string[]> {
    const loaded = await this.character.load(ownerId);
    const [stats, owned, plus] = await Promise.all([this.statsOf(loaded), this.items.list(loaded.id), this.plusOf(ownerId)]);
    const pet = await this.settle(loaded, plus);
    const have = new Set(owned);
    const missing = earnedItems(stats).filter((id) => !have.has(id));
    if (missing.length === 0) return [];
    const rows = missing.map((itemId) => ({ itemId, source: itemById(itemId)?.unlock.kind === 'start' ? ('start' as const) : ('milestone' as const) }));
    const added = await this.items.addMany(pet.id, rows, this.clock.now().toISOString());
    // Ordre du catalogue, pour un affichage stable.
    const order = new Map(ITEMS.map((i, n) => [i.id, n]));
    return added.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }

  async state(ownerId: string): Promise<WardrobeState> {
    const loaded = await this.character.load(ownerId);
    const [stats, owned, plus] = await Promise.all([this.statsOf(loaded), this.items.list(loaded.id), this.plusOf(ownerId)]);
    const pet = await this.settle(loaded, plus);
    return { pet, stats, plus, owned: ownedWith([...owned, ...earnedItems(stats)], entitlements(plus).premiumItems) };
  }

  /**
   * Fin de Minimoa+ : le minimoa range ses objets premium (ils retournent dans la garde-robe, verrouillés, et reviennent
   * avec un nouvel abonnement). Fait ici à chaque vue par sa personne, et pour les autres par `WardrobeJobs`.
   */
  async settle<T extends PetRecord>(pet: T, plus: boolean): Promise<T> {
    if (entitlements(plus).premiumItems) return pet;
    const outfit = withoutPremium(pet.outfit);
    if (outfit === pet.outfit) return pet;
    await this.pets.saveOutfit(pet.id, outfit);
    return { ...pet, outfit };
  }

  private async plusOf(ownerId: string): Promise<boolean> {
    return hasPlus(await this.profiles.findById(ownerId), this.clock.now());
  }

  async statsOf(pet: PetRecord): Promise<PetStats> {
    const [links, challenges, words, rituals, referrals] = await Promise.all([
      this.links.listForUsers([pet.ownerId]),
      this.pets.countEvents(pet.id, 'challenge_done'),
      this.votes.count(pet.ownerId),
      this.rituals.find(pet.ownerId),
      this.growth?.referrals(pet.ownerId) ?? Promise.resolve(0),
    ]);
    return {
      careDays: pet.careDays,
      // Liens qui existent encore (actifs ou fantômes) ; les liens archivés ne comptent plus.
      links: links.filter((l) => l.status !== 'archived').length,
      bestLevel: Math.max(0, ...links.map((l) => l.level)),
      bestStreak: Math.max(pet.bestStreak, ...links.map((l) => l.streak)),
      challenges,
      words,
      // Rituels (V7) : record de la série des défis du jour, habitudes tenues.
      ritualStreak: rituals?.streak.best ?? 0,
      habitsKept: rituals?.habitsKept ?? 0,
      // Parrainage (objet « Parrain ») : cosmétique, sans achat.
      referrals,
    };
  }
}
