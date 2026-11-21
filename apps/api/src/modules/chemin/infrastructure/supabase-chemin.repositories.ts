import type { BonusReason, CheminFormat, CheminStatus, Day, VisionAxis } from '@blowy/domain';
import type { Database, Db, Json } from '../../../persistence/database.types';
import { check, iso, isoOrNull } from '../../../persistence/supabase';
import type {
  ByLocale,
  CheminAnswerRecord,
  CheminAnswersRepository,
  CheminContent,
  CheminContentRepository,
  CheminProgressPatch,
  CheminProgressRecord,
  CheminProgressRepository,
  CheminSessionRecord,
  CheminSessionsRepository,
  ContentOption,
  ContentQuestion,
  ContentUnit,
} from '../ports';

type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
const json = (v: unknown): Json => v as Json;
const texts = <T>(v: Json): ByLocale<T> => (v && typeof v === 'object' && !Array.isArray(v) && 'fr' in v ? (v as unknown as ByLocale<T>) : ({ fr: {} } as ByLocale<T>));

// ── Contenu ──────────────────────────────────────────────────────────────────
const questionFromRow = (r: Row<'chemin_questions'>): ContentQuestion => ({
  id: r.id,
  stepId: r.step_id,
  position: r.position,
  format: r.format as CheminFormat,
  axis: r.axis as VisionAxis,
  direction: r.direction === -1 ? -1 : 1,
  minBuild: r.min_build,
  legacyTestId: r.legacy_test_id,
  status: r.status,
  texts: texts(r.texts),
  options: Array.isArray(r.options) ? (r.options as unknown as ContentOption[]) : [],
  updatedAt: iso(r.updated_at),
});

const questionRow = (q: ContentQuestion) => ({
  id: q.id,
  step_id: q.stepId,
  position: q.position,
  format: q.format,
  axis: q.axis,
  direction: q.direction,
  min_build: q.minBuild,
  legacy_test_id: q.legacyTestId,
  status: q.status,
  texts: json(q.texts),
  options: json(q.options),
  updated_at: q.updatedAt,
});

export class SupabaseCheminContentRepository implements CheminContentRepository {
  constructor(private readonly client: Db) {}

  async load(): Promise<CheminContent> {
    // Lu par pages : le serveur rend 1 000 lignes au plus par requête (3 000 questions et plus).
    const [units, steps, questions, scenes] = await Promise.all([
      this.all('chemin_units'),
      this.all('chemin_steps'),
      this.all('chemin_questions'),
      this.all('chemin_scenes'),
    ]);
    check(units.error, 'lecture des unités');
    check(steps.error, 'lecture des étapes');
    check(questions.error, 'lecture des questions');
    check(scenes.error, 'lecture des habillages');
    return {
      units: (units.data ?? []).map(
        (u): ContentUnit => ({
          id: u.id,
          position: u.position,
          icon: u.icon,
          minBuild: u.min_build,
          status: u.status,
          texts: texts(u.texts),
          updatedAt: iso(u.updated_at),
          steps: (steps.data ?? [])
            .filter((s) => s.unit_id === u.id)
            .map((s) => ({ id: s.id, unitId: s.unit_id, position: s.position, status: s.status, texts: texts(s.texts) })),
        }),
      ),
      questions: (questions.data ?? []).map(questionFromRow),
      scenes: (scenes.data ?? []).map((s) => ({ id: s.id, kind: s.kind, animation: s.animation, minBuild: s.min_build, status: s.status })),
    };
  }

  /** Toutes les lignes d'une table, par pages de 1 000 (ordre stable par identifiant). */
  private async all<T extends 'chemin_units' | 'chemin_steps' | 'chemin_questions' | 'chemin_scenes'>(table: T) {
    const PAGE = 1000;
    const rows: Row<T>[] = [];
    for (let from = 0; ; from += PAGE) {
      const res = await this.client.from(table).select('*').order('id').range(from, from + PAGE - 1);
      if (res.error) return { data: null, error: res.error };
      const page = (res.data ?? []) as unknown as Row<T>[];
      rows.push(...page);
      if (page.length < PAGE) return { data: rows, error: null };
    }
  }

  async insertMissingQuestions(list: readonly ContentQuestion[]): Promise<void> {
    for (let i = 0; i < list.length; i += 200) {
      const { error } = await this.client.from('chemin_questions').upsert(list.slice(i, i + 200).map(questionRow), { onConflict: 'id', ignoreDuplicates: true });
      check(error, 'enregistrement des questions');
    }
  }

  async upsertQuestion(q: ContentQuestion): Promise<void> {
    const { error } = await this.client.from('chemin_questions').upsert(questionRow(q), { onConflict: 'id' });
    check(error, 'enregistrement de la question');
  }

  async setQuestionStatus(id: string, status: CheminStatus, at: string): Promise<boolean> {
    const { data, error } = await this.client.from('chemin_questions').update({ status, updated_at: at }).eq('id', id).select('id');
    check(error, 'statut de la question');
    return (data ?? []).length > 0;
  }

  async upsertUnit(u: ContentUnit): Promise<void> {
    const { error } = await this.client
      .from('chemin_units')
      .upsert({ id: u.id, position: u.position, icon: u.icon, min_build: u.minBuild, status: u.status, texts: json(u.texts), updated_at: u.updatedAt }, { onConflict: 'id' });
    check(error, 'enregistrement de l’unité');
    if (u.steps.length === 0) return;
    const { error: e2 } = await this.client
      .from('chemin_steps')
      .upsert(
        u.steps.map((s) => ({ id: s.id, unit_id: u.id, position: s.position, status: s.status, texts: json(s.texts), updated_at: u.updatedAt })),
        { onConflict: 'id' },
      );
    check(e2, 'enregistrement des étapes');
  }

  async setUnitStatus(id: string, status: CheminStatus, at: string): Promise<boolean> {
    const { data, error } = await this.client.from('chemin_units').update({ status, updated_at: at }).eq('id', id).select('id');
    check(error, 'statut de l’unité');
    if ((data ?? []).length === 0) return false;
    const { error: e2 } = await this.client.from('chemin_steps').update({ status, updated_at: at }).eq('unit_id', id);
    check(e2, 'statut des étapes');
    return true;
  }
}

// ── Avancement ───────────────────────────────────────────────────────────────
const progressFromRow = (r: Row<'chemin_progress'>): CheminProgressRecord => ({
  userId: r.user_id,
  completedSteps: [...(r.completed_steps ?? [])],
  sessionsDone: r.sessions_done,
  answersCount: r.answers_count,
  bonusOn: r.bonus_on,
  bonusReason: r.bonus_reason as BonusReason | null,
  referralsSeen: r.referrals_seen,
  lastBuild: r.last_build,
  lastPlatform: r.last_platform,
  lastSessionOn: r.last_session_on,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

const progressPatchRow = (p: CheminProgressPatch) => ({
  ...(p.completedSteps !== undefined ? { completed_steps: [...p.completedSteps] } : {}),
  ...(p.sessionsDone !== undefined ? { sessions_done: p.sessionsDone } : {}),
  ...(p.answersCount !== undefined ? { answers_count: p.answersCount } : {}),
  ...(p.bonusOn !== undefined ? { bonus_on: p.bonusOn } : {}),
  ...(p.bonusReason !== undefined ? { bonus_reason: p.bonusReason } : {}),
  ...(p.referralsSeen !== undefined ? { referrals_seen: p.referralsSeen } : {}),
  ...(p.lastBuild !== undefined ? { last_build: p.lastBuild } : {}),
  ...(p.lastPlatform !== undefined ? { last_platform: p.lastPlatform } : {}),
  ...(p.lastSessionOn !== undefined ? { last_session_on: p.lastSessionOn } : {}),
});

export class SupabaseCheminProgressRepository implements CheminProgressRepository {
  constructor(private readonly client: Db) {}

  async find(userId: string): Promise<CheminProgressRecord | null> {
    const { data, error } = await this.client.from('chemin_progress').select('*').eq('user_id', userId).maybeSingle();
    check(error, 'lecture de l’avancement');
    return data ? progressFromRow(data) : null;
  }

  async findMany(userIds: readonly string[]): Promise<CheminProgressRecord[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await this.client.from('chemin_progress').select('*').in('user_id', [...userIds]);
    check(error, 'lecture des avancements');
    return (data ?? []).map(progressFromRow);
  }

  async upsert(userId: string, patch: CheminProgressPatch, at: string): Promise<CheminProgressRecord> {
    const { data, error } = await this.client
      .from('chemin_progress')
      .upsert({ user_id: userId, ...progressPatchRow(patch), updated_at: at }, { onConflict: 'user_id' })
      .select('*')
      .single();
    check(error, 'enregistrement de l’avancement');
    return progressFromRow(data as Row<'chemin_progress'>);
  }
}

const sessionFromRow = (r: Row<'chemin_sessions'>): CheminSessionRecord => ({
  id: r.id,
  userId: r.user_id,
  day: r.day,
  slot: r.slot === 1 ? 1 : 0,
  kind: r.kind,
  stepId: r.step_id,
  questions: Array.isArray(r.questions) ? (r.questions as unknown as CheminSessionRecord['questions']) : [],
  status: r.status,
  result: r.result,
  createdAt: iso(r.created_at),
  completedAt: isoOrNull(r.completed_at),
});

export class SupabaseCheminSessionsRepository implements CheminSessionsRepository {
  constructor(private readonly client: Db) {}

  async find(id: string): Promise<CheminSessionRecord | null> {
    const { data, error } = await this.client.from('chemin_sessions').select('*').eq('id', id).maybeSingle();
    check(error, 'lecture de la séance');
    return data ? sessionFromRow(data) : null;
  }

  async listForDay(userId: string, day: Day): Promise<CheminSessionRecord[]> {
    const { data, error } = await this.client.from('chemin_sessions').select('*').eq('user_id', userId).eq('day', day);
    check(error, 'lecture des séances du jour');
    return (data ?? []).map(sessionFromRow);
  }

  async insertIfAbsent(s: CheminSessionRecord): Promise<CheminSessionRecord> {
    const { error } = await this.client.from('chemin_sessions').upsert(
      {
        id: s.id,
        user_id: s.userId,
        day: s.day,
        slot: s.slot,
        kind: s.kind,
        step_id: s.stepId,
        questions: json(s.questions),
        status: s.status,
        created_at: s.createdAt,
      },
      { onConflict: 'user_id,day,slot', ignoreDuplicates: true },
    );
    check(error, 'création de la séance');
    const { data, error: e2 } = await this.client.from('chemin_sessions').select('*').eq('user_id', s.userId).eq('day', s.day).eq('slot', s.slot).single();
    check(e2, 'lecture de la séance créée');
    return sessionFromRow(data as Row<'chemin_sessions'>);
  }

  async markDone(id: string, at: string): Promise<boolean> {
    const { data, error } = await this.client.from('chemin_sessions').update({ status: 'done', completed_at: at }).eq('id', id).neq('status', 'done').select('id');
    check(error, 'séance faite');
    return (data ?? []).length > 0;
  }

  async saveResult(id: string, result: unknown): Promise<void> {
    const { error } = await this.client.from('chemin_sessions').update({ result: json(result) }).eq('id', id);
    check(error, 'résultat de la séance');
  }

  async doneDays(userId: string, from: Day, to: Day): Promise<Day[]> {
    const { data, error } = await this.client.from('chemin_sessions').select('day').eq('user_id', userId).eq('status', 'done').gte('day', from).lte('day', to);
    check(error, 'jours de séance');
    return (data ?? []).map((r) => r.day);
  }

  async statsForDay(day: Day): Promise<{ sessions: number; people: number; bonus: number }> {
    // Index (day, status) : une journée se lit d'un coup (quelques milliers de lignes au plus).
    const { data, error } = await this.client.from('chemin_sessions').select('user_id, slot').eq('day', day).eq('status', 'done');
    check(error, 'séances du jour');
    const rows = data ?? [];
    return { sessions: rows.length, people: new Set(rows.map((r) => r.user_id)).size, bonus: rows.filter((r) => r.slot === 1).length };
  }
}

const answerFromRow = (r: Row<'chemin_answers'>): CheminAnswerRecord => ({
  userId: r.user_id,
  sessionId: r.session_id,
  questionId: r.question_id,
  optionId: r.option_id,
  value: r.value,
  axis: r.axis as VisionAxis,
  signal: r.signal,
  day: r.day,
  answeredAt: iso(r.answered_at),
});

export class SupabaseCheminAnswersRepository implements CheminAnswersRepository {
  constructor(private readonly client: Db) {}

  async insertMany(rows: readonly CheminAnswerRecord[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.client.from('chemin_answers').upsert(
      rows.map((a) => ({
        user_id: a.userId,
        session_id: a.sessionId,
        question_id: a.questionId,
        option_id: a.optionId,
        value: a.value,
        axis: a.axis,
        signal: a.signal,
        day: a.day,
        answered_at: a.answeredAt,
      })),
      { onConflict: 'user_id,question_id,session_id', ignoreDuplicates: true },
    );
    check(error, 'enregistrement des réponses');
  }

  async lastAnswered(userId: string): Promise<Map<string, Day>> {
    const { data, error } = await this.client.from('chemin_answers').select('question_id, day').eq('user_id', userId).limit(5000);
    check(error, 'lecture des réponses');
    const out = new Map<string, Day>();
    for (const r of data ?? []) if ((out.get(r.question_id) ?? '') < r.day) out.set(r.question_id, r.day);
    return out;
  }

  async latestFor(userIds: readonly string[], questionIds: readonly string[]): Promise<CheminAnswerRecord[]> {
    if (userIds.length === 0 || questionIds.length === 0) return [];
    const { data, error } = await this.client.from('chemin_answers').select('*').in('user_id', [...userIds]).in('question_id', [...questionIds]);
    check(error, 'lecture des réponses des autres');
    const latest = new Map<string, CheminAnswerRecord>();
    for (const r of (data ?? []).map(answerFromRow)) {
      const key = `${r.userId}|${r.questionId}`;
      const cur = latest.get(key);
      if (!cur || cur.answeredAt < r.answeredAt) latest.set(key, r);
    }
    return [...latest.values()];
  }

  async count(userId: string): Promise<number> {
    const { count, error } = await this.client.from('chemin_answers').select('user_id', { count: 'exact', head: true }).eq('user_id', userId);
    check(error, 'nombre de réponses');
    return count ?? 0;
  }
}
