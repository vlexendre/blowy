import type { Day } from '@blowy/domain';
import type { MemoryDb } from '../../../persistence/memory-db';
import type { DailyPhotoRecord, DailyPhotosRepository } from '../ports';

export class MemoryDailyPhotosRepository implements DailyPhotosRepository {
  constructor(private readonly db: MemoryDb) {}

  async add(photo: DailyPhotoRecord): Promise<boolean> {
    if (this.db.dailyPhotos.some((p) => p.linkId === photo.linkId && p.userId === photo.userId && p.day === photo.day)) return false;
    this.db.dailyPhotos.push({ ...photo });
    return true;
  }

  async forDay(linkId: string, day: Day): Promise<DailyPhotoRecord[]> {
    return this.db.dailyPhotos.filter((p) => p.linkId === linkId && p.day === day).map((p) => ({ ...p }));
  }

  async listForLink(linkId: string): Promise<DailyPhotoRecord[]> {
    return this.db.dailyPhotos.filter((p) => p.linkId === linkId).map((p) => ({ ...p }));
  }

  async listForUser(userId: string): Promise<DailyPhotoRecord[]> {
    return this.db.dailyPhotos.filter((p) => p.userId === userId).map((p) => ({ ...p }));
  }
}
