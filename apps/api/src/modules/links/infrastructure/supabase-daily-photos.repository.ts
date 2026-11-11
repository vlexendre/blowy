import type { Day } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check, iso, isUniqueViolation } from '../../../persistence/supabase';
import type { DailyPhotoRecord, DailyPhotosRepository } from '../ports';

interface DailyPhotoRow {
  id: string;
  link_id: string;
  user_id: string;
  day: string;
  media_path: string;
  created_at: string;
}

const fromRow = (r: DailyPhotoRow): DailyPhotoRecord => ({
  id: r.id,
  linkId: r.link_id,
  userId: r.user_id,
  day: r.day,
  mediaPath: r.media_path,
  createdAt: iso(r.created_at),
});

export class SupabaseDailyPhotosRepository implements DailyPhotosRepository {
  constructor(private readonly client: Db) {}

  private get table() {
    return this.client.from('daily_photos');
  }

  async add(p: DailyPhotoRecord): Promise<boolean> {
    const { error } = await this.table.insert({ id: p.id, link_id: p.linkId, user_id: p.userId, day: p.day, media_path: p.mediaPath, created_at: p.createdAt });
    if (isUniqueViolation(error)) return false;
    check(error, 'enregistrement de la photo du jour');
    return true;
  }

  async forDay(linkId: string, day: Day): Promise<DailyPhotoRecord[]> {
    const { data, error } = await this.table.select('*').eq('link_id', linkId).eq('day', day);
    check(error, 'lecture des photos du jour');
    return (data as DailyPhotoRow[]).map(fromRow);
  }

  async listForLink(linkId: string): Promise<DailyPhotoRecord[]> {
    const { data, error } = await this.table.select('*').eq('link_id', linkId).order('day', { ascending: false });
    check(error, 'lecture des souvenirs');
    return (data as DailyPhotoRow[]).map(fromRow);
  }

  async listForUser(userId: string): Promise<DailyPhotoRecord[]> {
    const { data, error } = await this.table.select('*').eq('user_id', userId);
    check(error, 'lecture des photos');
    return (data as DailyPhotoRow[]).map(fromRow);
  }
}
