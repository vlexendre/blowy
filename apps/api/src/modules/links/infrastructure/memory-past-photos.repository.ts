import type { MemoryDb } from '../../../persistence/memory-db';
import type { DailyPhotoRecord, PastPhotosRepository } from '../ports';

export class MemoryPastPhotosRepository implements PastPhotosRepository {
  constructor(private readonly db: MemoryDb) {}

  async listForLink(linkId: string): Promise<DailyPhotoRecord[]> {
    return this.db.dailyPhotos
      .filter((p) => p.linkId === linkId)
      .sort((a, b) => b.day.localeCompare(a.day))
      .map((p) => ({ ...p }));
  }
}
