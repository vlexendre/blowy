import type { AxisLeans, AxisSide, GeoPoint, VisionAxis, VisionProfile, VisionSignal } from '@blowy/domain';

// ── Position ────────────────────────────────────────────────────────────────
export interface ChosenCityRecord extends GeoPoint {
  label: string;
}

/** Position d'une personne (n'existe que si elle a donné son accord). */
export interface PlaceRecord {
  userId: string;
  /**
   * Dernier relevé, arrondi à la maille de ~300 m avant d'être enregistré (`storedPoint`) : jamais le point exact,
   * jamais montré, jamais renvoyé à quelqu'un d'autre. Le point exact ne sert qu'en mémoire, le temps de savoir si la
   * personne est hors de sa zone (`lastAwayAt`).
   */
  last: GeoPoint;
  locatedAt: string;
  lastAwayAt: string | null;
  /** Zone du domicile, arrondie à ~300 m. */
  home: GeoPoint;
  homeCell: string;
  candidate: GeoPoint | null;
  candidateSince: string | null;
  chosenCity: ChosenCityRecord | null;
  /** D'où vient la zone : `gps` (défaut) ou `manual` (choisie à la main, sans localisation). */
  source?: 'gps' | 'manual';
  /** Zone choisie à la main : la ville et le jour du choix (gratuit : une fois tous les 30 jours). */
  manualArea?: { label: string; setOn: string } | null;
}

export interface PlacesRepository {
  find(userId: string): Promise<PlaceRecord | null>;
  findMany(userIds: readonly string[]): Promise<PlaceRecord[]>;
  save(place: PlaceRecord): Promise<void>;
  remove(userId: string): Promise<void>;
  /** Positions dont la zone est dans une de ces mailles, les plus récemment relevées d'abord, `limit` au plus. */
  listInCells(cells: readonly string[], limit: number, excludeId: string): Promise<PlaceRecord[]>;
}

// ── Vision ──────────────────────────────────────────────────────────────────
export interface VisionSnapshot {
  userId: string;
  profile: VisionProfile;
  testDone: boolean;
  computedAt: string;
}

export interface VisionStore {
  /** Observations d'une personne, les plus récentes d'abord, `limit` au plus. */
  listSignals(userId: string, limit: number): Promise<VisionSignal[]>;
  addSignals(userId: string, signals: readonly VisionSignal[]): Promise<void>;
  /** Remplace les observations du test (test repassé). */
  replaceTest(userId: string, signals: readonly VisionSignal[]): Promise<void>;
  saveSnapshot(snapshot: VisionSnapshot): Promise<void>;
  findSnapshot(userId: string): Promise<VisionSnapshot | null>;
  findSnapshots(userIds: readonly string[]): Promise<VisionSnapshot[]>;
}

// ── Cache des personnes compatibles (une fois par jour et par personne) ─────
export interface CachedMatch {
  userId: string;
  score: number;
  /** `leans` : où penche chacun (côté et cran) ; absent des entrées écrites avant son ajout (le cache est alors refait). */
  common: readonly { axis: VisionAxis; side: AxisSide; leans?: AxisLeans }[];
  explore: { axis: VisionAxis; mine: AxisSide; theirs: AxisSide; leans?: AxisLeans };
  /** Distance entre le centre et la zone de l'autre, en km. */
  distanceKm: number;
  /** Position montrée (arrondie et décalée), calculée depuis la zone de l'autre. */
  shown: GeoPoint;
}

export interface MatchCacheEntry {
  day: string;
  /** Centre utilisé (une autre ville choisie rend le cache caduc). */
  centerKey: string;
  matches: CachedMatch[];
}

export interface MatchCacheRepository {
  get(userId: string): Promise<MatchCacheEntry | null>;
  put(userId: string, entry: MatchCacheEntry): Promise<void>;
  clear(userId: string): Promise<void>;
}
