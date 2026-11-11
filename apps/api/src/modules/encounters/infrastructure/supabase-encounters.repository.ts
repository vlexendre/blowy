import type { SupabaseClient } from '@supabase/supabase-js';
import { check, iso, isUniqueViolation } from '../../../persistence/supabase';
import type { EncounterRecord, EncounterStatus, EncountersRepository } from '../ports';

interface EncounterRow {
  id: string;
  from_user: string;
  to_user: string;
  status: EncounterStatus;
  intro: string | null;
  created_at: string;
}

const fromRow = (r: EncounterRow): EncounterRecord => ({
  id: r.id,
  fromUser: r.from_user,
  toUser: r.to_user,
  status: r.status,
  intro: r.intro,
  createdAt: iso(r.created_at),
});

export class SupabaseEncountersRepository implements EncountersRepository {
  constructor(private readonly client: SupabaseClient) {}

  private get table() {
    return this.client.from('encounters');
  }

  async findById(id: string): Promise<EncounterRecord | null> {
    const { data, error } = await this.table.select('*').eq('id', id).maybeSingle();
    check(error, 'lecture de la rencontre');
    return data ? fromRow(data as EncounterRow) : null;
  }

  async findPair(fromUser: string, toUser: string): Promise<EncounterRecord | null> {
    const { data, error } = await this.table.select('*').eq('from_user', fromUser).eq('to_user', toUser).maybeSingle();
    check(error, 'lecture de la rencontre');
    return data ? fromRow(data as EncounterRow) : null;
  }

  async create(e: EncounterRecord): Promise<EncounterRecord | null> {
    const { data, error } = await this.table
      .insert({ id: e.id, from_user: e.fromUser, to_user: e.toUser, status: e.status, intro: e.intro, created_at: e.createdAt })
      .select('*')
      .single();
    if (isUniqueViolation(error)) return null;
    check(error, 'création de la rencontre');
    return fromRow(data as EncounterRow);
  }

  async setStatus(id: string, status: EncounterStatus): Promise<void> {
    const { error } = await this.table.update({ status }).eq('id', id);
    check(error, 'mise à jour de la rencontre');
  }

  async listInvolving(userId: string): Promise<EncounterRecord[]> {
    const { data, error } = await this.table.select('*').or(`from_user.eq.${userId},to_user.eq.${userId}`);
    check(error, 'lecture des rencontres');
    return (data as EncounterRow[]).map(fromRow);
  }
}
