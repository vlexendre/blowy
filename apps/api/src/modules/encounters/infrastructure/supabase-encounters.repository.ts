import type { Db } from '../../../persistence/database.types';
import { check, iso, isUniqueViolation } from '../../../persistence/supabase';
import type { EncounterRecord, EncounterStatus, EncountersRepository, ProposalsRepository } from '../ports';

interface EncounterRow {
  id: string;
  from_user: string;
  to_user: string;
  status: EncounterStatus;
  intro: string | null;
  created_at: string;
  status_at: string;
}

const fromRow = (r: EncounterRow): EncounterRecord => ({
  id: r.id,
  fromUser: r.from_user,
  toUser: r.to_user,
  status: r.status,
  intro: r.intro,
  createdAt: iso(r.created_at),
  statusAt: iso(r.status_at),
});

export class SupabaseEncountersRepository implements EncountersRepository {
  constructor(private readonly client: Db) {}

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
      .insert({ id: e.id, from_user: e.fromUser, to_user: e.toUser, status: e.status, intro: e.intro, created_at: e.createdAt, status_at: e.statusAt })
      .select('*')
      .single();
    if (isUniqueViolation(error)) return null;
    check(error, 'création de la rencontre');
    return fromRow(data as EncounterRow);
  }

  async setStatus(id: string, status: EncounterStatus, at: string): Promise<void> {
    const { error } = await this.table.update({ status, status_at: at }).eq('id', id);
    check(error, 'mise à jour de la rencontre');
  }

  async listInvolving(userId: string): Promise<EncounterRecord[]> {
    const { data, error } = await this.table.select('*').or(`from_user.eq.${userId},to_user.eq.${userId}`);
    check(error, 'lecture des rencontres');
    return (data as EncounterRow[]).map(fromRow);
  }

  async listHistory(userId: string, before: string | null, limit: number): Promise<EncounterRecord[]> {
    // Envoyées (tous statuts) ou reçues avec une réponse : les coucous reçus en attente restent dans « reçus ».
    let query = this.table.select('*').or(`from_user.eq.${userId},and(to_user.eq.${userId},status.neq.waved)`);
    if (before !== null) query = query.lt('status_at', before);
    const { data, error } = await query.order('status_at', { ascending: false }).order('id', { ascending: false }).limit(limit);
    check(error, "lecture de l'historique des rencontres");
    return (data as EncounterRow[]).map(fromRow);
  }
}

/** `encounter_proposals` : écriture et total d'un jour par deux fonctions SQL (une requête chacune, clé primaire). */
export class SupabaseProposalsRepository implements ProposalsRepository {
  constructor(private readonly client: Db) {}
  async record(day: string, userId: string, proposed: number, scoreSum: number): Promise<void> {
    const { error } = await this.client.rpc('encounter_proposals_record', { p_day: day, p_user: userId, p_proposed: proposed, p_score_sum: scoreSum });
    check(error, 'rencontres proposées');
  }
  async summary(day: string): Promise<{ proposed: number; scoreSum: number }> {
    const { data, error } = await this.client.rpc('encounter_proposals_summary', { p_day: day });
    check(error, 'rencontres proposées');
    const row = (data ?? {}) as { proposed?: number; score_sum?: number };
    return { proposed: Number(row.proposed ?? 0), scoreSum: Number(row.score_sum ?? 0) };
  }
  async purgeBefore(day: string): Promise<number> {
    const { data, error } = await this.client.from('encounter_proposals').delete().lt('day', day).select('day');
    check(error, 'purge des rencontres proposées');
    return (data ?? []).length;
  }
}
