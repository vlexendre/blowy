import type { DailyKind, DailyStatus, Day, HabitRhythm, OutingAnswer, ProofVerdict, VisionAxis } from '@blowy/domain';
import type { Db, Json } from '../../../persistence/database.types';
import { check, iso, isoOrNull } from '../../../persistence/supabase';
import type {
  DailyChallengePatch,
  DailyChallengeRecord,
  DailyChallengesRepository,
  HabitCheckRecord,
  HabitChecksRepository,
  HabitRecord,
  HabitsRepository,
  ReviewFacts,
  RitualPhotoRecord,
  RitualPhotoSource,
  RitualPhotosRepository,
  RitualMarker,
  RitualStatePatch,
  RitualStateRecord,
  RitualStatesRepository,
  WeeklyReviewRecord,
  WeeklyReviewsRepository,
} from '../ports';

// ── État ───────────────────────────────────────────────────────────────────
interface StateRow {
  user_id: string;
  streak_current: number;
  streak_best: number;
  streak_last_done_on: string | null;
  joker_days: string[];
  last_seen_on: string | null;
  outing_on: string | null;
  outing_answer: string | null;
  outing_confirmed: boolean;
  habits_kept: number;
  danger_notified_on: string | null;
  needs_out_notified_on: string | null;
  review_week: string | null;
}

const stateFromRow = (r: StateRow): RitualStateRecord => ({
  userId: r.user_id,
  streak: { current: r.streak_current, best: r.streak_best, lastDoneOn: r.streak_last_done_on, jokerDays: [...(r.joker_days ?? [])].sort() },
  lastSeenOn: r.last_seen_on,
  outingOn: r.outing_on,
  outingAnswer: r.outing_answer as OutingAnswer | null,
  outingConfirmed: r.outing_confirmed,
  habitsKept: r.habits_kept,
  dangerNotifiedOn: r.danger_notified_on,
  needsOutNotifiedOn: r.needs_out_notified_on,
  reviewWeek: r.review_week,
});

function statePatchRow(p: RitualStatePatch) {
  return {
    ...(p.streak
      ? { streak_current: p.streak.current, streak_best: p.streak.best, streak_last_done_on: p.streak.lastDoneOn, joker_days: [...p.streak.jokerDays] }
      : {}),
    ...(p.lastSeenOn !== undefined ? { last_seen_on: p.lastSeenOn } : {}),
    ...(p.outingOn !== undefined ? { outing_on: p.outingOn } : {}),
    ...(p.outingAnswer !== undefined ? { outing_answer: p.outingAnswer } : {}),
    ...(p.outingConfirmed !== undefined ? { outing_confirmed: p.outingConfirmed } : {}),
    ...(p.habitsKept !== undefined ? { habits_kept: p.habitsKept } : {}),
    ...(p.dangerNotifiedOn !== undefined ? { danger_notified_on: p.dangerNotifiedOn } : {}),
    ...(p.needsOutNotifiedOn !== undefined ? { needs_out_notified_on: p.needsOutNotifiedOn } : {}),
    ...(p.reviewWeek !== undefined ? { review_week: p.reviewWeek } : {}),
  };
}

const MARKER_COLUMNS: Record<RitualMarker, string> = {
  dangerNotifiedOn: 'danger_notified_on',
  needsOutNotifiedOn: 'needs_out_notified_on',
  reviewWeek: 'review_week',
};

const markerPatch = (marker: RitualMarker, value: Day) =>
  marker === 'dangerNotifiedOn'
    ? { danger_notified_on: value }
    : marker === 'needsOutNotifiedOn'
      ? { needs_out_notified_on: value }
      : { review_week: value };

export class SupabaseRitualStatesRepository implements RitualStatesRepository {
  constructor(private readonly client: Db) {}

  async find(userId: string): Promise<RitualStateRecord | null> {
    const { data, error } = await this.client.from('ritual_states').select('*').eq('user_id', userId).maybeSingle();
    check(error, 'lecture des rituels');
    return data ? stateFromRow(data) : null;
  }

  async findMany(userIds: readonly string[]): Promise<RitualStateRecord[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await this.client.from('ritual_states').select('*').in('user_id', [...userIds]);
    check(error, 'lecture des rituels');
    return (data ?? []).map(stateFromRow);
  }

  async upsert(userId: string, patch: RitualStatePatch): Promise<void> {
    // Upsert partiel : seules les colonnes données sont écrites (les autres gardent leur valeur ou leur défaut).
    const { error } = await this.client
      .from('ritual_states')
      .upsert({ user_id: userId, ...statePatchRow(patch), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    check(error, 'enregistrement des rituels');
  }

  async mark(userIds: readonly string[], marker: RitualMarker, value: Day): Promise<void> {
    if (userIds.length === 0) return;
    const { error } = await this.client
      .from('ritual_states')
      .update(markerPatch(marker, value))
      .in('user_id', [...userIds]);
    check(error, 'marqueur des tâches');
  }

  async addHabitsKept(userId: string, n: number): Promise<number> {
    const { data, error } = await this.client.rpc('ritual_add_habits_kept', { p_user: userId, p_n: n });
    check(error, 'compteur des habitudes tenues');
    return typeof data === 'number' ? data : 0;
  }

  async listActive(sinceDay: Day, afterUserId: string | null, limit: number, pending?: { marker: RitualMarker; before: Day }): Promise<RitualStateRecord[]> {
    let query = this.client.from('ritual_states').select('*').gte('last_seen_on', sinceDay);
    if (afterUserId) query = query.gt('user_id', afterUserId);
    if (pending) {
      const column = MARKER_COLUMNS[pending.marker];
      query = query.or(`${column}.is.null,${column}.lt.${pending.before}`);
    }
    const { data, error } = await query.order('user_id', { ascending: true }).limit(limit);
    check(error, 'lecture des personnes actives');
    return (data ?? []).map(stateFromRow);
  }
}

// ── Défi du jour ───────────────────────────────────────────────────────────
interface DailyRow {
  user_id: string;
  day: string;
  challenge_id: string;
  kind: string;
  axis: string | null;
  status: string;
  answer: number | null;
  photo_id: string | null;
  seen_at: string | null;
  accepted_at: string | null;
  done_at: string | null;
  created_at: string;
}

const dailyFromRow = (r: DailyRow): DailyChallengeRecord => ({
  userId: r.user_id,
  day: r.day,
  challengeId: r.challenge_id,
  kind: r.kind as DailyKind,
  axis: r.axis as VisionAxis | null,
  status: r.status as DailyStatus,
  answer: r.answer === 0 || r.answer === 1 ? r.answer : null,
  photoId: r.photo_id,
  seenAt: isoOrNull(r.seen_at),
  acceptedAt: isoOrNull(r.accepted_at),
  doneAt: isoOrNull(r.done_at),
  createdAt: iso(r.created_at),
});

const dailyPatchRow = (p: DailyChallengePatch) => ({
  ...(p.status !== undefined ? { status: p.status } : {}),
  ...(p.answer !== undefined ? { answer: p.answer } : {}),
  ...(p.photoId !== undefined ? { photo_id: p.photoId } : {}),
  ...(p.seenAt !== undefined ? { seen_at: p.seenAt } : {}),
  ...(p.acceptedAt !== undefined ? { accepted_at: p.acceptedAt } : {}),
  ...(p.doneAt !== undefined ? { done_at: p.doneAt } : {}),
});

export class SupabaseDailyChallengesRepository implements DailyChallengesRepository {
  constructor(private readonly client: Db) {}

  async find(userId: string, day: Day): Promise<DailyChallengeRecord | null> {
    const { data, error } = await this.client.from('daily_challenges').select('*').eq('user_id', userId).eq('day', day).maybeSingle();
    check(error, 'lecture du défi du jour');
    return data ? dailyFromRow(data) : null;
  }

  async insertIfAbsent(record: DailyChallengeRecord): Promise<DailyChallengeRecord> {
    const { error } = await this.client.from('daily_challenges').upsert(
      {
        user_id: record.userId,
        day: record.day,
        challenge_id: record.challengeId,
        kind: record.kind,
        axis: record.axis,
        status: record.status,
        created_at: record.createdAt,
      },
      { onConflict: 'user_id,day', ignoreDuplicates: true },
    );
    check(error, 'création du défi du jour');
    const stored = await this.find(record.userId, record.day);
    if (!stored) throw new Error('défi du jour introuvable après création');
    return stored;
  }

  async update(userId: string, day: Day, patch: DailyChallengePatch): Promise<void> {
    const { error } = await this.client.from('daily_challenges').update(dailyPatchRow(patch)).eq('user_id', userId).eq('day', day);
    check(error, 'enregistrement du défi du jour');
  }

  async markDone(userId: string, day: Day, patch: DailyChallengePatch, doneAt: string): Promise<boolean> {
    // Condition dans la requête : un seul appel passe le défi à « fait ».
    const { data, error } = await this.client
      .from('daily_challenges')
      .update({ ...dailyPatchRow(patch), status: 'done', done_at: doneAt })
      .eq('user_id', userId)
      .eq('day', day)
      .neq('status', 'done')
      .select('day');
    check(error, 'défi du jour fait');
    return (data ?? []).length > 0;
  }

  async findForDay(userIds: readonly string[], day: Day): Promise<DailyChallengeRecord[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await this.client.from('daily_challenges').select('*').eq('day', day).in('user_id', [...userIds]);
    check(error, 'lecture des défis du jour');
    return (data ?? []).map(dailyFromRow);
  }

  async listBetween(userId: string, from: Day, to: Day): Promise<DailyChallengeRecord[]> {
    const { data, error } = await this.client
      .from('daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .gte('day', from)
      .lte('day', to)
      .order('day', { ascending: true });
    check(error, 'lecture des défis');
    return (data ?? []).map(dailyFromRow);
  }
}

// ── Habitudes ──────────────────────────────────────────────────────────────
interface HabitRow {
  id: string;
  user_id: string;
  habit_id: string;
  rhythm: string;
  proof_hour: number;
  asked_on: string | null;
  created_at: string;
  archived_at: string | null;
}
const habitFromRow = (r: HabitRow): HabitRecord => ({
  id: r.id,
  userId: r.user_id,
  habitId: r.habit_id,
  rhythm: r.rhythm as HabitRhythm,
  proofHour: r.proof_hour,
  askedOn: r.asked_on,
  createdAt: iso(r.created_at),
  archivedAt: isoOrNull(r.archived_at),
});

export class SupabaseHabitsRepository implements HabitsRepository {
  constructor(private readonly client: Db) {}

  async listActive(userId: string): Promise<HabitRecord[]> {
    const { data, error } = await this.client
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    check(error, 'lecture des habitudes');
    return (data ?? []).map(habitFromRow);
  }

  async find(id: string): Promise<HabitRecord | null> {
    const { data, error } = await this.client.from('habits').select('*').eq('id', id).maybeSingle();
    check(error, "lecture d'une habitude");
    return data ? habitFromRow(data) : null;
  }

  async create(habit: HabitRecord): Promise<boolean> {
    const { error } = await this.client.from('habits').insert({
      id: habit.id,
      user_id: habit.userId,
      habit_id: habit.habitId,
      rhythm: habit.rhythm,
      proof_hour: habit.proofHour,
      asked_on: habit.askedOn,
      created_at: habit.createdAt,
      archived_at: habit.archivedAt,
    });
    if (error?.code === '23505') return false;
    check(error, "ajout d'une habitude");
    return true;
  }

  async update(id: string, patch: Partial<Pick<HabitRecord, 'rhythm' | 'proofHour' | 'archivedAt' | 'askedOn'>>): Promise<void> {
    const { error } = await this.client
      .from('habits')
      .update({
        ...(patch.rhythm !== undefined ? { rhythm: patch.rhythm } : {}),
        ...(patch.proofHour !== undefined ? { proof_hour: patch.proofHour } : {}),
        ...(patch.archivedAt !== undefined ? { archived_at: patch.archivedAt } : {}),
        ...(patch.askedOn !== undefined ? { asked_on: patch.askedOn } : {}),
      })
      .eq('id', id);
    check(error, "enregistrement d'une habitude");
  }

  async markAsked(ids: readonly string[], day: Day): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await this.client.from('habits').update({ asked_on: day }).in('id', [...ids]);
    check(error, 'preuves demandées');
  }

  async listToAsk(hour: number, today: Day, afterId: string | null, limit: number): Promise<HabitRecord[]> {
    let query = this.client
      .from('habits')
      .select('*')
      .is('archived_at', null)
      .lte('proof_hour', hour)
      .or(`asked_on.is.null,asked_on.lt.${today}`);
    if (afterId) query = query.gt('id', afterId);
    const { data, error } = await query.order('id', { ascending: true }).limit(limit);
    check(error, 'lecture des preuves à demander');
    return (data ?? []).map(habitFromRow);
  }
}

interface CheckRow {
  id: string;
  habit_ref: string;
  user_id: string;
  day: string;
  verdict: string;
  line: string;
  photo_id: string | null;
  created_at: string;
}
const checkFromRow = (r: CheckRow): HabitCheckRecord => ({
  id: r.id,
  habitRef: r.habit_ref,
  userId: r.user_id,
  day: r.day,
  verdict: r.verdict as ProofVerdict,
  line: r.line,
  photoId: r.photo_id,
  createdAt: iso(r.created_at),
});

export class SupabaseHabitChecksRepository implements HabitChecksRepository {
  constructor(private readonly client: Db) {}

  async find(habitRef: string, day: Day): Promise<HabitCheckRecord | null> {
    const { data, error } = await this.client.from('habit_checks').select('*').eq('habit_ref', habitRef).eq('day', day).maybeSingle();
    check(error, "lecture d'une preuve");
    return data ? checkFromRow(data) : null;
  }

  async upsert(c: HabitCheckRecord): Promise<void> {
    const { error } = await this.client.from('habit_checks').upsert(
      { id: c.id, habit_ref: c.habitRef, user_id: c.userId, day: c.day, verdict: c.verdict, line: c.line, photo_id: c.photoId, created_at: c.createdAt },
      { onConflict: 'habit_ref,day' },
    );
    check(error, "enregistrement d'une preuve");
  }

  async listSince(habitRefs: readonly string[], from: Day): Promise<HabitCheckRecord[]> {
    if (habitRefs.length === 0) return [];
    const { data, error } = await this.client.from('habit_checks').select('*').in('habit_ref', [...habitRefs]).gte('day', from);
    check(error, 'lecture des preuves');
    return (data ?? []).map(checkFromRow);
  }

  async countKept(userId: string, from: Day, to: Day): Promise<number> {
    const { count, error } = await this.client
      .from('habit_checks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('day', from)
      .lte('day', to)
      .neq('verdict', 'no');
    check(error, 'comptage des preuves');
    return count ?? 0;
  }
}

// ── Photos privées ─────────────────────────────────────────────────────────
interface PhotoRow {
  id: string;
  user_id: string;
  source: string;
  day: string;
  path: string;
  caption: string;
  keep: boolean;
  created_at: string;
  deleted_at: string | null;
}
const photoFromRow = (r: PhotoRow): RitualPhotoRecord => ({
  id: r.id,
  userId: r.user_id,
  source: r.source as RitualPhotoSource,
  day: r.day,
  path: r.path,
  caption: r.caption,
  keep: r.keep,
  createdAt: iso(r.created_at),
  deletedAt: isoOrNull(r.deleted_at),
});

export class SupabaseRitualPhotosRepository implements RitualPhotosRepository {
  constructor(private readonly client: Db) {}

  async create(p: RitualPhotoRecord): Promise<void> {
    const { error } = await this.client.from('ritual_photos').insert({
      id: p.id,
      user_id: p.userId,
      source: p.source,
      day: p.day,
      path: p.path,
      caption: p.caption,
      keep: p.keep,
      created_at: p.createdAt,
      deleted_at: p.deletedAt,
    });
    check(error, "enregistrement d'une photo privée");
  }

  async find(id: string): Promise<RitualPhotoRecord | null> {
    const { data, error } = await this.client.from('ritual_photos').select('*').eq('id', id).maybeSingle();
    check(error, "lecture d'une photo privée");
    return data ? photoFromRow(data) : null;
  }

  async setKeep(id: string, keep: boolean): Promise<void> {
    const { error } = await this.client.from('ritual_photos').update({ keep }).eq('id', id).is('deleted_at', null);
    check(error, "enregistrement d'une photo privée");
  }

  async listExpired(beforeIso: string, limit: number): Promise<RitualPhotoRecord[]> {
    const { data, error } = await this.client
      .from('ritual_photos')
      .select('*')
      .eq('keep', false)
      .is('deleted_at', null)
      .lt('created_at', beforeIso)
      .order('created_at', { ascending: true })
      .limit(limit);
    check(error, 'lecture des photos à supprimer');
    return (data ?? []).map(photoFromRow);
  }

  async markDeleted(ids: readonly string[], at: string): Promise<void> {
    if (ids.length === 0) return;
    // `keep = false` dans la condition : une photo gardée entre-temps n'est pas marquée supprimée.
    const { error } = await this.client.from('ritual_photos').update({ deleted_at: at }).in('id', [...ids]).eq('keep', false);
    check(error, 'suppression de photos privées');
  }

  async listLive(userId: string): Promise<RitualPhotoRecord[]> {
    const { data, error } = await this.client.from('ritual_photos').select('*').eq('user_id', userId).is('deleted_at', null);
    check(error, 'lecture des photos privées');
    return (data ?? []).map(photoFromRow);
  }

  async listKept(userId: string, before: string | null, limit: number): Promise<RitualPhotoRecord[]> {
    let query = this.client.from('ritual_photos').select('*').eq('user_id', userId).eq('keep', true).is('deleted_at', null);
    if (before) query = query.lt('created_at', before);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    check(error, 'lecture des souvenirs privés');
    return (data ?? []).map(photoFromRow);
  }
}

// ── Bilans ─────────────────────────────────────────────────────────────────
interface ReviewRow {
  id: string;
  user_id: string;
  week_start: string;
  facts: Json;
  did: string[];
  noticed: string;
  tip: string;
  link_lines: string[];
  body: string;
  coached: boolean;
  detailed: Json | null;
  vision: Json;
  read_at: string | null;
  created_at: string;
}
const reviewFromRow = (r: ReviewRow): WeeklyReviewRecord => ({
  id: r.id,
  userId: r.user_id,
  weekStart: r.week_start,
  facts: r.facts as unknown as ReviewFacts,
  did: r.did ?? [],
  noticed: r.noticed,
  tip: r.tip,
  links: r.link_lines ?? [],
  text: r.body,
  coached: r.coached,
  detailed: (r.detailed as unknown as WeeklyReviewRecord['detailed']) ?? null,
  vision: (r.vision as unknown as WeeklyReviewRecord['vision']) ?? {},
  readAt: isoOrNull(r.read_at),
  createdAt: iso(r.created_at),
});

export class SupabaseWeeklyReviewsRepository implements WeeklyReviewsRepository {
  constructor(private readonly client: Db) {}

  async insertIfAbsent(r: WeeklyReviewRecord): Promise<boolean> {
    const { data, error } = await this.client
      .from('weekly_reviews')
      .upsert(
        {
          id: r.id,
          user_id: r.userId,
          week_start: r.weekStart,
          facts: r.facts as unknown as Json,
          did: r.did,
          noticed: r.noticed,
          tip: r.tip,
          link_lines: r.links,
          body: r.text,
          coached: r.coached,
          detailed: r.detailed as unknown as Json,
          vision: r.vision as unknown as Json,
          read_at: r.readAt,
          created_at: r.createdAt,
        },
        { onConflict: 'user_id,week_start', ignoreDuplicates: true },
      )
      .select('id');
    check(error, 'enregistrement du bilan');
    return (data ?? []).length > 0;
  }

  async find(id: string): Promise<WeeklyReviewRecord | null> {
    const { data, error } = await this.client.from('weekly_reviews').select('*').eq('id', id).maybeSingle();
    check(error, 'lecture du bilan');
    return data ? reviewFromRow(data) : null;
  }

  async list(userId: string, before: Day | null, limit: number): Promise<WeeklyReviewRecord[]> {
    let query = this.client.from('weekly_reviews').select('*').eq('user_id', userId);
    if (before) query = query.lt('week_start', before);
    const { data, error } = await query.order('week_start', { ascending: false }).limit(limit);
    check(error, 'lecture des bilans');
    return (data ?? []).map(reviewFromRow);
  }

  async latestUnread(userId: string): Promise<WeeklyReviewRecord | null> {
    const [latest] = await this.list(userId, null, 1);
    return latest && latest.readAt === null ? latest : null;
  }

  async markRead(id: string, at: string): Promise<void> {
    const { error } = await this.client.from('weekly_reviews').update({ read_at: at }).eq('id', id).is('read_at', null);
    check(error, 'bilan lu');
  }
}
