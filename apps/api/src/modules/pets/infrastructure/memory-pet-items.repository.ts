import type { MemoryDb } from '../../../persistence/memory-db';
import type { ItemSource, PetItemsRepository } from '../ports';

export class MemoryPetItemsRepository implements PetItemsRepository {
  constructor(private readonly db: MemoryDb) {}

  async list(petId: string): Promise<string[]> {
    return this.db.petItems.filter((i) => i.petId === petId).map((i) => i.itemId);
  }

  async addMany(petId: string, items: readonly { itemId: string; source: ItemSource }[], acquiredAt: string): Promise<string[]> {
    if (![...this.db.pets.values()].some((p) => p.id === petId)) throw new Error('pet introuvable');
    const added: string[] = [];
    for (const { itemId, source } of items) {
      if (this.db.petItems.some((i) => i.petId === petId && i.itemId === itemId)) continue;
      this.db.petItems.push({ petId, itemId, source, acquiredAt });
      added.push(itemId);
    }
    return added;
  }
}
