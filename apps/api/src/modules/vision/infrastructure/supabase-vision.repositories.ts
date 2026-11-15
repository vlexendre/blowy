import { EMPTY_VISION, VISION_AXES, VISION_SOURCES, type VisionAxis, type VisionProfile, type VisionSignal, type VisionSource } from '@blowy/domain';
import type { Db, Json } from '../../../persistence/database.types';
import { check, iso, isoOrNull } from '../../../persistence/supabase';
import type { CachedMatch, MatchCacheEntry, MatchCacheRepository, PlaceRecord, PlacesRepository, VisionSnapshot, VisionStore } from '../ports';

// ── Positions ─────────────────────────────────────────────────────────────────
interface PlaceRow {
  user_id: string;
  last_lat: number;
  last_lng: number;
  located_at: string;
  last_away_at: string | null;
  home_lat: number;
  home_lng: number;
  home_cell: string;
  candidate_lat: number | null;
  candidate_lng: number | null;
  candidate_since: string | null;
  city_label: string | null;
  city_lat: number | null;
  city_lng: number | null;
}

const placeFromRow = (r: PlaceRow): PlaceRecord => ({
  userId: r.user_id,
  last: { lat: r.last_lat, lng: r.last_lng },
  locatedAt: iso(r.located_at),
  lastAwayAt: isoOrNull(r.last_away_at),
  home: { lat: r.home_lat, lng: r.home_lng },
  homeCell: r.home_cell,
  candidate: r.candidate_lat !== null && r.candidate_lng !== null ? { lat: r.candidate_lat, lng: r.candidate_lng } : null,
  candidateSince: isoOrNull(r.candidate_since),
  chosenCity: r.city_label !== null && r.city_lat !== null && r.city_lng !== null ? { label: r.city_label, lat: r.city_lat, lng: r.city_lng } : null,
});

const placeToRow = (p: PlaceRecord): PlaceRow => ({
  user_id: p.userId,
  last_lat: p.last.lat,
  last_lng: p.last.lng,
  located_at: p.locatedAt,
  last_away_at: p.lastAwayAt,
  home_lat: p.home.lat,
  home_lng: p.home.lng,
  home_cell: p.homeCell,
  candidate_lat: p.candidate?.lat ?? null,
  candidate_lng: p.candidate?.lng ?? null,
  candidate_since: p.candidateSince,
  city_label: p.chosenCity?.label ?? null,
  city_lat: p.chosenCity?.lat ?? null,
  city_lng: p.chosenCity?.lng ?? null,
});

export class SupabasePlacesRepository implements PlacesRepository {
  constructor(private readonly client: Db) {}

  private get table() {
    return this.client.from('profile_places');
  }

  async find(userId: string): Promise<PlaceRecord | null> {
    const { data, error } = await this.table.select('*').eq('user_id', userId).maybeSingle();
    check(error, 'lecture de la position');
    return data ? placeFromRow(data as PlaceRow) : null;
  }

  async findMany(userIds: readonly string[]): Promise<PlaceRecord[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await this.table.select('*').in('user_id', [...userIds]);
    check(error, 'lecture des positions');
    return (data as PlaceRow[]).map(placeFromRow);
  }

  async save(place: PlaceRecord): Promise<void> {
    const { error } = await this.table.upsert(placeToRow(place), { onConflict: 'user_id' });
    check(error, 'enregistrement de la position');
  }

  async remove(userId: string): Promise<void> {
    const { error } = await this.table.delete().eq('user_id', userId);
    check(error, 'suppression de la position');
  }

  /** Utilise l'index (home_cell, located_at desc) : quelques dizaines de mailles, `limit` lignes au plus. */
  async listInCells(cells: readonly string[], limit: number, excludeId: string): Promise<PlaceRecord[]> {
    if (cells.length === 0) return [];
    // Fonction SQL : au plus `limit` par maille par l'index, jamais toutes les positions d'une ville dense.
    const { data, error } = await this.client.rpc('places_in_cells', { p_cells: [...cells], p_limit: limit, p_exclude: excludeId });
    check(error, 'lecture des positions proches');
    return (data as PlaceRow[]).map(placeFromRow);
  }
}

// ── Vision ────────────────────────────────────────────────────────────────────
interface SignalRow {
  axis: string;
  value: number;
  source: string;
  at: string;
}

const isAxis = (v: string): v is VisionAxis => (VISION_AXES as readonly string[]).includes(v);
const isSource = (v: string): v is VisionSource => (VISION_SOURCES as readonly string[]).includes(v);

/** Relit un profil stocké en JSON ; un axe absent ou abîmé vaut « inconnu ». */
function profileFromJson(json: Json): VisionProfile {
  const out = { ...EMPTY_VISION } as Record<VisionAxis, { value: number; confidence: number }>;
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    for (const axis of VISION_AXES) {
      const r = json[axis];
      if (r && typeof r === 'object' && !Array.isArray(r) && typeof r.value === 'number' && typeof r.confidence === 'number') {
        out[axis] = { value: r.value, confidence: r.confidence };
      }
    }
  }
  return out;
}

interface SnapshotRow {
  user_id: string;
  axes: Json;
  test_done: boolean;
  computed_at: string;
}
const snapshotFromRow = (r: SnapshotRow): VisionSnapshot => ({ userId: r.user_id, profile: profileFromJson(r.axes), testDone: r.test_done, computedAt: iso(r.computed_at) });

export class SupabaseVisionStore implements VisionStore {
  constructor(private readonly client: Db) {}

  async listSignals(userId: string, limit: number): Promise<VisionSignal[]> {
    const { data, error } = await this.client.from('vision_signals').select('axis, value, source, at').eq('user_id', userId).order('at', { ascending: false }).limit(limit);
    check(error, 'lecture des observations de vision');
    return (data as SignalRow[]).flatMap((r) => (isAxis(r.axis) && isSource(r.source) ? [{ axis: r.axis, value: r.value, source: r.source, at: iso(r.at) }] : []));
  }

  async addSignals(userId: string, signals: readonly VisionSignal[]): Promise<void> {
    if (signals.length === 0) return;
    const rows = signals.map((s) => ({ user_id: userId, axis: s.axis, value: Math.round(s.value), source: s.source, at: s.at }));
    const { error } = await this.client.from('vision_signals').insert(rows);
    check(error, 'enregistrement des observations de vision');
  }

  async replaceTest(userId: string, signals: readonly VisionSignal[]): Promise<void> {
    const { error } = await this.client.from('vision_signals').delete().eq('user_id', userId).eq('source', 'test');
    check(error, 'remplacement du test de vision');
    await this.addSignals(userId, signals);
  }

  async saveSnapshot(s: VisionSnapshot): Promise<void> {
    const { error } = await this.client
      .from('vision_profiles')
      .upsert({ user_id: s.userId, axes: s.profile as unknown as Json, test_done: s.testDone, computed_at: s.computedAt }, { onConflict: 'user_id' });
    check(error, 'enregistrement du profil de vision');
  }

  async findSnapshot(userId: string): Promise<VisionSnapshot | null> {
    const { data, error } = await this.client.from('vision_profiles').select('*').eq('user_id', userId).maybeSingle();
    check(error, 'lecture du profil de vision');
    return data ? snapshotFromRow(data as SnapshotRow) : null;
  }

  async findSnapshots(userIds: readonly string[]): Promise<VisionSnapshot[]> {
    if (userIds.length === 0) return [];
    const { data, error } = await this.client.from('vision_profiles').select('*').in('user_id', [...userIds]);
    check(error, 'lecture des profils de vision');
    return (data as SnapshotRow[]).map(snapshotFromRow);
  }
}

// ── Cache ─────────────────────────────────────────────────────────────────────
export class SupabaseMatchCache implements MatchCacheRepository {
  constructor(private readonly client: Db) {}

  async get(userId: string): Promise<MatchCacheEntry | null> {
    const { data, error } = await this.client.from('match_cache').select('day, center_key, entries').eq('user_id', userId).maybeSingle();
    check(error, 'lecture du cache des rencontres');
    if (!data) return null;
    // Écrit par `put` ci-dessous uniquement.
    return { day: data.day, centerKey: data.center_key, matches: (Array.isArray(data.entries) ? data.entries : []) as unknown as CachedMatch[] };
  }

  async put(userId: string, entry: MatchCacheEntry): Promise<void> {
    const { error } = await this.client
      .from('match_cache')
      .upsert({ user_id: userId, day: entry.day, center_key: entry.centerKey, entries: entry.matches as unknown as Json, computed_at: new Date().toISOString() }, { onConflict: 'user_id' });
    check(error, 'écriture du cache des rencontres');
  }

  async clear(userId: string): Promise<void> {
    const { error } = await this.client.from('match_cache').delete().eq('user_id', userId);
    check(error, 'vidage du cache des rencontres');
  }
}
