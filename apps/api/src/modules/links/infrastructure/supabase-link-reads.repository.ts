import type { SupabaseClient } from '@supabase/supabase-js';
import { check, iso } from '../../../persistence/supabase';
import type { LinkReadsRepository } from '../ports';

export class SupabaseLinkReadsRepository implements LinkReadsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async lastReadAt(linkId: string, userId: string): Promise<string | null> {
    const { data, error } = await this.client.from('link_reads').select('last_read_at').eq('link_id', linkId).eq('user_id', userId).maybeSingle();
    check(error, 'lecture de la dernière lecture');
    const row = data as { last_read_at: string } | null;
    return row ? iso(row.last_read_at) : null;
  }

  async markRead(linkId: string, userId: string, at: string): Promise<void> {
    const { error } = await this.client.from('link_reads').upsert({ link_id: linkId, user_id: userId, last_read_at: at }, { onConflict: 'link_id,user_id' });
    check(error, 'enregistrement de la lecture');
  }
}
