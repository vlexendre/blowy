import type { Db } from '../../../persistence/database.types';
import { check } from '../../../persistence/supabase';
import type { ItemSource, PetItemsRepository } from '../ports';

export class SupabasePetItemsRepository implements PetItemsRepository {
  constructor(private readonly client: Db) {}

  async list(petId: string): Promise<string[]> {
    const { data, error } = await this.client.from('pet_items').select('item_id').eq('pet_id', petId);
    check(error, 'lecture des objets du pet');
    return (data ?? []).map((r) => r.item_id);
  }

  async addMany(petId: string, items: readonly { itemId: string; source: ItemSource }[], acquiredAt: string): Promise<string[]> {
    if (items.length === 0) return [];
    // ON CONFLICT DO NOTHING : seules les lignes réellement insérées reviennent (idempotent, sûr en cas de course).
    const { data, error } = await this.client
      .from('pet_items')
      .upsert(
        items.map((i) => ({ pet_id: petId, item_id: i.itemId, source: i.source, acquired_at: acquiredAt })),
        { onConflict: 'pet_id,item_id', ignoreDuplicates: true },
      )
      .select('item_id');
    check(error, "ajout d'objets au pet");
    return (data ?? []).map((r) => r.item_id);
  }
}
