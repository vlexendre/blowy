import type { Db } from '../../../persistence/database.types';
import { check, iso } from '../../../persistence/supabase';
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
      })),
    );
    check(error, 'ajout de messages');
  }

  async page(linkId: string, before: string | null, limit: number): Promise<MessageRecord[]> {
    let query = this.table.select('*').eq('link_id', linkId);
    if (before !== null) query = query.lt('created_at', before);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    check(error, 'lecture des messages');
    return (data as MessageRow[]).map(fromRow);
  }

  async latest(linkId: string): Promise<MessageRecord | null> {
    const [first] = await this.page(linkId, null, 1);
    return first ?? null;
  }

  async countUnread(linkId: string, userId: string, after: string | null): Promise<number> {
    let query = this.table.select('id', { count: 'exact', head: true }).eq('link_id', linkId).or(`author_id.is.null,author_id.neq.${userId}`);
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
}
