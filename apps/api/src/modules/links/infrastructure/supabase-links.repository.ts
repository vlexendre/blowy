import type { Day, LinkDay, LinkMilestone, LinkStatus } from '@blowy/domain';
import type { Json } from '../../../persistence/database.types';
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
  best_streak: number;
  duo_days: number;
  last_active_on: string;
  last_tick_on: string;
  last_duo_day_on: string | null;
  recent_days: Json;
  milestones: Json;
  revived: boolean;
  message_xp_on: string | null;
  message_xp: number;
  last_message_at: string;
  created_at: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** `recent_days` (jsonb) : [{ day, a, b }] ; une entrée illisible est ignorée. */
function linkDays(v: Json): LinkDay[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((d): LinkDay[] => (isObject(d) && isDay(d.day) ? [{ day: d.day, a: d.a === true, b: d.b === true }] : []));
}

/** `milestones` (jsonb) : [{ kind: 'level' | 'streak', value, on }] ; `on` null pour une étape d'avant la migration. */
function linkMilestones(v: Json): LinkMilestone[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((m): LinkMilestone[] =>
    isObject(m) && (m.kind === 'level' || m.kind === 'streak') && typeof m.value === 'number' ? [{ kind: m.kind, value: m.value, on: isDay(m.on) ? m.on : null }] : [],
  );
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
  bestStreak: r.best_streak,
  duoDays: r.duo_days,
  lastActiveOn: r.last_active_on,
  lastTickOn: r.last_tick_on,
  lastDuoDayOn: r.last_duo_day_on,
  recentDays: linkDays(r.recent_days),
  milestones: linkMilestones(r.milestones),
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
  best_streak: l.bestStreak,
  duo_days: l.duoDays,
  last_active_on: l.lastActiveOn,
  last_tick_on: l.lastTickOn,
  last_duo_day_on: l.lastDuoDayOn,
  recent_days: l.recentDays as unknown as Json,
  milestones: l.milestones as unknown as Json,
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

  async listForWriteReminder(today: Day, limit: number): Promise<LinkRecord[]> {
    // Index partiel links_write_reminder_idx (last_active_on, id) where status = 'active'.
    const { data, error } = await this.table
      .select('*')
      .eq('status', 'active')
      .eq('last_active_on', today)
      .or(`write_reminder_on.is.null,write_reminder_on.lt.${today}`)
      .order('id')
      .limit(limit);
    check(error, 'liens du rappel « à toi d’écrire »');
    return (data as LinkRow[]).map(fromRow);
  }

  async markWriteReminder(ids: readonly string[], today: Day): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await this.table.update({ write_reminder_on: today }).in('id', [...ids]);
    check(error, 'marque du rappel « à toi d’écrire »');
  }

  async pageForUser(userId: string, after: string | null, limit: number): Promise<LinkRecord[]> {
    let query = this.table.select('*').or(`user_a.eq.${userId},user_b.eq.${userId}`).neq('status', 'archived');
    if (after !== null) query = query.gt('id', after);
    const { data, error } = await query.order('id').limit(limit);
    check(error, 'liens par pages');
    return (data as LinkRow[]).map(fromRow);
  }
}
