import { Inject, Injectable } from '@nestjs/common';
import { ITEMS, type PetStats, earnedItems, itemById } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { CLOCK, LINKS, PET_ITEMS, PETS, WORD_VOTES } from '../../../shared/tokens';
import type { LinksRepository } from '../../links/ports';
import type { PetItemsRepository, PetRecord, PetsRepository, WordVotesRepository } from '../ports';
import { PetCharacter } from './pet-character';

export interface WardrobeState {
  pet: PetRecord;
  stats: PetStats;
  /** Objets possédés : ceux de `pet_items` et ceux déjà gagnés par les compteurs (un objet gagné reste gagné). */
  owned: ReadonlySet<string>;
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
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * Ajoute à `pet_items` les objets gagnés que le pet n'a pas encore et rend ceux de cette fois-ci (à fêter).
   * Appelée à chaque vue du pet par sa personne : c'est là que les étapes franchies ailleurs
   * (lien créé, niveau, série, 3 mots) deviennent des objets « nouveaux ».
   */
  async sync(ownerId: string): Promise<string[]> {
    const pet = await this.character.load(ownerId);
    const [stats, owned] = await Promise.all([this.statsOf(pet), this.items.list(pet.id)]);
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
    const pet = await this.character.load(ownerId);
    const [stats, owned] = await Promise.all([this.statsOf(pet), this.items.list(pet.id)]);
    return { pet, stats, owned: new Set([...owned, ...earnedItems(stats)]) };
  }

  async statsOf(pet: PetRecord): Promise<PetStats> {
    const [links, challenges, words] = await Promise.all([
      this.links.listForUsers([pet.ownerId]),
      this.pets.countEvents(pet.id, 'challenge_done'),
      this.votes.count(pet.ownerId),
    ]);
    return {
      careDays: pet.careDays,
      // Liens qui existent encore (actifs ou fantômes) ; les liens archivés ne comptent plus.
      links: links.filter((l) => l.status !== 'archived').length,
      bestLevel: Math.max(0, ...links.map((l) => l.level)),
      bestStreak: Math.max(pet.bestStreak, ...links.map((l) => l.streak)),
      challenges,
      words,
    };
  }
}
