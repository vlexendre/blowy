import type { Day, LinkStatus } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check, iso, isUniqueViolation } from '../../../persistence/supabase';
import type { LinkRecord, LinksRepository } from '../ports';

interface LinkRow {
  id: string;
  user_a: string;
  user_b: string;
  status: LinkStatus;
  lives: number;
  xp: number;
  level: number;
  streak: number;
  last_active_on: string;
  last_tick_on: string;
  last_duo_photo_on: string | null;
  revived: boolean;
  message_xp_on: string | null;
  message_xp: number;
  last_message_at: string;
  created_at: string;
}

const fromRow = (r: LinkRow): LinkRecord => ({
  id: r.id,
  userA: r.user_a,
  userB: r.user_b,
  status: r.status,
  lives: r.lives,
  xp: r.xp,
  level: r.level,
  streak: r.streak,
  lastActiveOn: r.last_active_on,
  lastTickOn: r.last_tick_on,
  lastDuoPhotoOn: r.last_duo_photo_on,
  revived: r.revived,
  messageXpOn: r.message_xp_on,
  messageXp: r.message_xp,
  lastMessageAt: iso(r.last_message_at),
  createdAt: iso(r.created_at),
});

/** Colonnes modifiables d'un lien (l'identité et la paire ne changent jamais). */
const stateRow = (l: LinkRecord) => ({
  status: l.status,
  lives: l.lives,
  xp: l.xp,
  level: l.level,
  streak: l.streak,
  last_active_on: l.lastActiveOn,
  last_tick_on: l.lastTickOn,
  last_duo_photo_on: l.lastDuoPhotoOn,
  revived: l.revived,
  message_xp_on: l.messageXpOn,
  message_xp: l.messageXp,
  last_message_at: l.lastMessageAt,
});

export class SupabaseLinksRepository implements LinksRepository {
  constructor(private readonly client: Db) {}

  private get table() {
    return this.client.from('links');
  }

  async findById(id: string): Promise<LinkRecord | null> {
    const { data, error } = await this.table.select('*').eq('id', id).maybeSingle();
    check(error, 'lecture du lien');
    return data ? fromRow(data as LinkRow) : null;
  }

  async findBetween(userA: string, userB: string): Promise<LinkRecord | null> {
    const { data, error } = await this.table.select('*').eq('user_a', userA).eq('user_b', userB).maybeSingle();
    check(error, 'lecture du lien');
    return data ? fromRow(data as LinkRow) : null;
  }

  async listForUsers(userIds: readonly string[]): Promise<LinkRecord[]> {
    if (userIds.length === 0) return [];
    const ids = [...userIds].join(',');
    const { data, error } = await this.table.select('*').or(`user_a.in.(${ids}),user_b.in.(${ids})`);
    check(error, 'lecture des liens');
    return (data as LinkRow[]).map(fromRow);
  }

  async create(link: LinkRecord): Promise<LinkRecord | null> {
    const { data, error } = await this.table
      .insert({ ...stateRow(link), id: link.id, user_a: link.userA, user_b: link.userB, created_at: link.createdAt })
      .select('*')
      .single();
    if (isUniqueViolation(error)) return null;
    check(error, 'création du lien');
    return fromRow(data as LinkRow);
  }

  async save(link: LinkRecord): Promise<void> {
    const { error } = await this.table.update(stateRow(link)).eq('id', link.id);
    check(error, 'enregistrement du lien');
  }

  async listDueForTick(today: Day, limit: number): Promise<LinkRecord[]> {
    // Index partiel links_due_tick_idx (last_tick_on) where status = 'active'.
    const { data, error } = await this.table.select('*').eq('status', 'active').lt('last_tick_on', today).order('last_tick_on').order('id').limit(limit);
    check(error, 'liens à rattraper');
    return (data as LinkRow[]).map(fromRow);
  }

  async pageForUser(userId: string, after: string | null, limit: number): Promise<LinkRecord[]> {
    let query = this.table.select('*').or(`user_a.eq.${userId},user_b.eq.${userId}`).neq('status', 'archived');
    if (after !== null) query = query.gt('id', after);
    const { data, error } = await query.order('id').limit(limit);
    check(error, 'liens par pages');
    return (data as LinkRow[]).map(fromRow);
  }
}
