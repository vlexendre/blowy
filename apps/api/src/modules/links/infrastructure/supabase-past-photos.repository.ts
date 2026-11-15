import type { Db } from '../../../persistence/database.types';
import { check, iso } from '../../../persistence/supabase';
import type { DailyPhotoRecord, PastPhotosRepository } from '../ports';

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

/** Table `daily_photos` en lecture seule : plus aucune photo du jour n'y est ajoutée (spéc §24). */
export class SupabasePastPhotosRepository implements PastPhotosRepository {
  constructor(private readonly client: Db) {}

  async listForLink(linkId: string): Promise<DailyPhotoRecord[]> {
    const { data, error } = await this.client.from('daily_photos').select('*').eq('link_id', linkId).order('day', { ascending: false });
    check(error, 'lecture des anciennes photos');
    return (data as DailyPhotoRow[]).map(fromRow);
  }
}
