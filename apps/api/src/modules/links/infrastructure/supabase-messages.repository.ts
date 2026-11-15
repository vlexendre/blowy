import type { Db } from '../../../persistence/database.types';
import { check, iso } from '../../../persistence/supabase';
import type { PetRole } from '@blowy/domain';
import type { AuthorKind, MessageKind, MessageRecord, MessagesRepository } from '../ports';

interface MessageRow {
  id: string;
  link_id: string;
  author_kind: AuthorKind;
  author_id: string | null;
  kind: MessageKind;
  body: string | null;
  media_path: string | null;
  created_at: string;
  pet_role: string | null;
  visible_to: string | null;
}

const fromRow = (r: MessageRow): MessageRecord => ({
  id: r.id,
  linkId: r.link_id,
  authorKind: r.author_kind,
  authorId: r.author_id,
  kind: r.kind,
  body: r.body,
  mediaPath: r.media_path,
  createdAt: iso(r.created_at),
  petRole: r.pet_role as PetRole | null,
  visibleTo: r.visible_to,
});

export class SupabaseMessagesRepository implements MessagesRepository {
  constructor(private readonly client: Db) {}

  private get table() {
    return this.client.from('messages');
  }

  async add(messages: readonly MessageRecord[]): Promise<void> {
    if (messages.length === 0) return;
    const { error } = await this.table.insert(
      messages.map((m) => ({
        id: m.id,
        link_id: m.linkId,
        author_kind: m.authorKind,
        author_id: m.authorId,
        kind: m.kind,
        body: m.body,
        media_path: m.mediaPath,
        created_at: m.createdAt,
        pet_role: m.petRole ?? null,
        visible_to: m.visibleTo ?? null,
      })),
    );
    check(error, 'ajout de messages');
  }

  async page(linkId: string, before: string | null, limit: number, viewerId: string): Promise<MessageRecord[]> {
    let query = this.table.select('*').eq('link_id', linkId).or(`visible_to.is.null,visible_to.eq.${viewerId}`);
    if (before !== null) query = query.lt('created_at', before);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    check(error, 'lecture des messages');
    return (data as MessageRow[]).map(fromRow);
  }

  async latest(linkId: string, viewerId: string): Promise<MessageRecord | null> {
    const [first] = await this.page(linkId, null, 1, viewerId);
    return first ?? null;
  }

  async countUnread(linkId: string, userId: string, after: string | null): Promise<number> {
    let query = this.table
      .select('id', { count: 'exact', head: true })
      .eq('link_id', linkId)
      .or(`author_id.is.null,author_id.neq.${userId}`)
      .or(`visible_to.is.null,visible_to.eq.${userId}`);
    if (after !== null) query = query.gt('created_at', after);
    const { count, error } = await query;
    check(error, 'comptage des non-lus');
    return count ?? 0;
  }

  async countUserMessages(linkId: string): Promise<number> {
    const { count, error } = await this.table.select('id', { count: 'exact', head: true }).eq('link_id', linkId).eq('author_kind', 'user').eq('kind', 'text');
    check(error, 'comptage des messages');
    return count ?? 0;
  }

  async recentUserTexts(linkId: string, limit: number): Promise<MessageRecord[]> {
    // Index partiel messages_link_user_idx (link_id, created_at desc) where author_kind = 'user'.
    const { data, error } = await this.table
      .select('*')
      .eq('link_id', linkId)
      .eq('author_kind', 'user')
      .eq('kind', 'text')
      .order('created_at', { ascending: false })
      .limit(limit);
    check(error, 'lecture des derniers messages');
    return (data as MessageRow[]).map(fromRow);
  }

  async countUserTextsSince(linkId: string, since: string): Promise<Map<string, number>> {
    // Au plus 500 messages lus sur la semaine (au-delà, le compte est plafonné : la santé du lien n'en a pas besoin).
    const { data, error } = await this.table
      .select('author_id')
      .eq('link_id', linkId)
      .eq('author_kind', 'user')
      .eq('kind', 'text')
      .gte('created_at', since)
      .limit(500);
    check(error, 'comptage des messages de la semaine');
    const out = new Map<string, number>();
    for (const r of data ?? []) if (r.author_id) out.set(r.author_id, (out.get(r.author_id) ?? 0) + 1);
    return out;
  }
}
