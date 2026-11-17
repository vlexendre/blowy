import type { AcquisitionSource, CounterRow, Day, EventRow, GrowthCounterMetric, GrowthEventKind, MemberSpan } from '@blowy/domain';
import type { Db } from '../../../persistence/database.types';
import { check, iso, isoOrNull, isUniqueViolation } from '../../../persistence/supabase';
import type {
  AcquisitionRecord,
  AcquisitionsRepository,
  CreatorRecord,
  CreatorsRepository,
  GrowthCountersRepository,
  GrowthEventRecord,
  GrowthEventsRepository,
  GrowthReads,
} from '../ports';

/** Lignes lues par page (PostgREST limite chaque réponse). */
const PAGE = 1000;

const creatorFromRow = (r: { code: string; name: string; active: boolean; created_at: string; updated_at: string }): CreatorRecord => ({
  code: r.code,
  name: r.name,
  active: r.active,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

export class SupabaseCreatorsRepository implements CreatorsRepository {
  constructor(private readonly client: Db) {}
  async find(code: string): Promise<CreatorRecord | null> {
    const { data, error } = await this.client.from('creators').select('*').eq('code', code).maybeSingle();
    check(error, 'lecture du créateur');
    return data ? creatorFromRow(data) : null;
  }
  async list(): Promise<CreatorRecord[]> {
    const { data, error } = await this.client.from('creators').select('*').order('code').limit(500);
    check(error, 'liste des créateurs');
    return (data ?? []).map(creatorFromRow);
  }
  async create(c: CreatorRecord): Promise<boolean> {
    const { error } = await this.client.from('creators').insert({ code: c.code, name: c.name, active: c.active, created_at: c.createdAt, updated_at: c.updatedAt });
    if (isUniqueViolation(error)) return false;
    check(error, 'création du créateur');
    return true;
  }
  async update(code: string, patch: Partial<Pick<CreatorRecord, 'name' | 'active' | 'updatedAt'>>): Promise<CreatorRecord | null> {
    const row: { name?: string; active?: boolean; updated_at?: string } = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.active !== undefined) row.active = patch.active;
    if (patch.updatedAt !== undefined) row.updated_at = patch.updatedAt;
    const { data, error } = await this.client.from('creators').update(row).eq('code', code).select('*').maybeSingle();
    check(error, 'mise à jour du créateur');
    return data ? creatorFromRow(data) : null;
  }
}

export class SupabaseAcquisitionsRepository implements AcquisitionsRepository {
  constructor(private readonly client: Db) {}
  async find(userId: string): Promise<AcquisitionRecord | null> {
    const { data, error } = await this.client.from('acquisitions').select('*').eq('user_id', userId).maybeSingle();
    check(error, 'source du compte');
    return data
      ? { userId: data.user_id, source: data.source as AcquisitionSource, ref: data.ref, referredBy: data.referred_by, cohortOn: data.cohort_on, createdAt: iso(data.created_at) }
      : null;
  }
  async create(a: AcquisitionRecord): Promise<boolean> {
    const { data, error } = await this.client
      .from('acquisitions')
      .upsert({ user_id: a.userId, source: a.source, ref: a.ref, referred_by: a.referredBy, cohort_on: a.cohortOn, created_at: a.createdAt }, { onConflict: 'user_id', ignoreDuplicates: true })
      .select('user_id');
    // Parrain supprimé entre-temps (clé étrangère) : on garde la source sans lui.
    if (error?.code === '23503' && a.referredBy) return this.create({ ...a, referredBy: null });
    check(error, 'source du compte');
    return (data ?? []).length > 0;
  }
  async countReferredBy(userId: string): Promise<number> {
    const { count, error } = await this.client.from('acquisitions').select('user_id', { count: 'exact', head: true }).eq('referred_by', userId);
    check(error, 'parrainages');
    return count ?? 0;
  }
  async countByCreator(since: Day): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.client.from('acquisitions').select('ref').eq('source', 'creator').gte('cohort_on', since).range(from, from + PAGE - 1);
      check(error, 'comptes par créateur');
      for (const r of data ?? []) if (r.ref) out.set(r.ref, (out.get(r.ref) ?? 0) + 1);
      if ((data ?? []).length < PAGE) return out;
    }
  }
}

export class SupabaseGrowthEventsRepository implements GrowthEventsRepository {
  constructor(private readonly client: Db) {}
  async record(e: GrowthEventRecord): Promise<boolean> {
    const { data, error } = await this.client
      .from('growth_events')
      .upsert({ user_id: e.userId, kind: e.kind, source: e.source, cohort_on: e.cohortOn, created_at: e.createdAt }, { onConflict: 'user_id,kind', ignoreDuplicates: true })
      .select('id');
    if (error?.code === '23503') return false;
    check(error, 'étape de l’entonnoir');
    return (data ?? []).length > 0;
  }
  async listSince(from: Day): Promise<EventRow[]> {
    const out: EventRow[] = [];
    for (let at = 0; ; at += PAGE) {
      const { data, error } = await this.client.from('growth_events').select('kind, source, cohort_on').gte('cohort_on', from).order('id').range(at, at + PAGE - 1);
      check(error, 'étapes de l’entonnoir');
      for (const r of data ?? []) out.push({ kind: r.kind as GrowthEventKind, source: r.source as AcquisitionSource, cohortOn: r.cohort_on });
      if ((data ?? []).length < PAGE) return out;
    }
  }
}

export class SupabaseGrowthCountersRepository implements GrowthCountersRepository {
  constructor(private readonly client: Db) {}
  async bump(day: Day, metric: GrowthCounterMetric, source: string, ref: string): Promise<void> {
    const { error } = await this.client.rpc('growth_bump', { p_day: day, p_metric: metric, p_source: source, p_ref: ref });
    check(error, 'compteur de croissance');
  }
  async listSince(from: Day): Promise<CounterRow[]> {
    const out: CounterRow[] = [];
    for (let at = 0; ; at += PAGE) {
      const { data, error } = await this.client.from('growth_counters').select('*').gte('day', from).order('day').order('metric').order('source').order('ref').range(at, at + PAGE - 1);
      check(error, 'compteurs de croissance');
      out.push(...(data ?? []));
      if ((data ?? []).length < PAGE) return out;
    }
  }
}

export class SupabaseGrowthReads implements GrowthReads {
  constructor(private readonly client: Db) {}
  async groupsCreatedSince(sinceIso: string): Promise<{ createdAt: string; members: MemberSpan[] }[]> {
    const groups: { id: string; created_at: string }[] = [];
    for (let at = 0; ; at += PAGE) {
      const { data, error } = await this.client.from('groups').select('id, created_at').gte('created_at', sinceIso).order('id').range(at, at + PAGE - 1);
      check(error, 'groupes créés');
      groups.push(...(data ?? []));
      if ((data ?? []).length < PAGE) break;
    }
    const members = new Map<string, MemberSpan[]>();
    for (let i = 0; i < groups.length; i += 200) {
      const ids = groups.slice(i, i + 200).map((g) => g.id);
      const { data, error } = await this.client.from('group_members').select('group_id, joined_at, left_at, status').in('group_id', ids);
      check(error, 'membres des groupes créés');
      for (const r of data ?? []) {
        const list = members.get(r.group_id) ?? [];
        list.push({ joinedAt: isoOrNull(r.joined_at), leftAt: isoOrNull(r.left_at), status: r.status });
        members.set(r.group_id, list);
      }
    }
    return groups.map((g) => ({ createdAt: iso(g.created_at), members: members.get(g.id) ?? [] }));
  }
}
