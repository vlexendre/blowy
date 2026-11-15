/**
 * Vision : ce que la personne projette pour sa vie, sur 5 axes de −100 à 100, chacun avec une confiance.
 * C'est le moteur de l'appariement : le minimoa ne présente que des personnes dont la vision va dans le même sens.
 * Noms partagés avec les autres chantiers (docs/V7-INTERFACES.md) : ne pas les renommer.
 *
 * Tout est pur : l'instant présent, les graines et les positions sont des paramètres.
 */
import { type Day, ageOn, MIN_AGE } from './days';

export const VISION_AXES = ['foyer', 'ancrage', 'elan', 'rythme', 'cap'] as const;
export type VisionAxis = (typeof VISION_AXES)[number];
export const VISION_SOURCES = ['test', 'daily', 'habit', 'care', 'words'] as const;
export type VisionSource = (typeof VISION_SOURCES)[number];
/** Une observation sur un axe : value de -100 à 100. */
export interface VisionSignal {
  axis: VisionAxis;
  value: number;
  source: VisionSource;
  at: string /* ISO */;
}

// ── Profil de vision ────────────────────────────────────────────────────────

/** Poids de départ de chaque source (spéc. §3). Celui du test décroît à mesure que les autres sources s'accumulent. */
export const SOURCE_WEIGHTS: Readonly<Record<VisionSource, number>> = { test: 0.4, daily: 0.2, habit: 0.25, care: 0.1, words: 0.05 };
/** Ce qu'une observation apporte à la confiance (une réponse franche compte plus qu'une façon de s'occuper). */
export const SOURCE_EVIDENCE: Readonly<Record<VisionSource, number>> = { test: 1, daily: 1, habit: 0.6, care: 0.3, words: 0.3 };
/** Le poids du test est divisé par deux quand les autres sources ont apporté autant de preuve sur l'axe. */
export const TEST_HALF_EVIDENCE = 8;
/** Les observations hors test perdent la moitié de leur poids en 120 jours : la vision suit la personne. */
export const SIGNAL_HALF_LIFE_DAYS = 120;
/** Preuve nécessaire pour une confiance de 50 (avant cohérence). */
export const CONFIDENCE_HALF_EVIDENCE = 4;

export interface AxisReading {
  /** De −100 (pôle −) à 100 (pôle +). */
  value: number;
  /** De 0 (rien de connu) à 100. */
  confidence: number;
}
export type VisionProfile = Readonly<Record<VisionAxis, AxisReading>>;

export const EMPTY_VISION: VisionProfile = Object.freeze({
  foyer: { value: 0, confidence: 0 },
  ancrage: { value: 0, confidence: 0 },
  elan: { value: 0, confidence: 0 },
  rythme: { value: 0, confidence: 0 },
  cap: { value: 0, confidence: 0 },
});

const DAY_MS = 86_400_000;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const clampVision = (v: number): number => Math.round(clamp(v, -100, 100));

/** Poids lié à l'ancienneté d'une observation (le test n'en a pas : il s'efface par la preuve, pas par le temps). */
export function recencyWeight(signal: Pick<VisionSignal, 'source' | 'at'>, now: Date): number {
  if (signal.source === 'test') return 1;
  const ageDays = Math.max(0, (now.getTime() - new Date(signal.at).getTime()) / DAY_MS);
  return 0.5 ** (ageDays / SIGNAL_HALF_LIFE_DAYS);
}

/** Poids effectif du test sur un axe, selon la preuve apportée par les autres sources. */
export const testWeight = (otherEvidence: number): number => SOURCE_WEIGHTS.test * (TEST_HALF_EVIDENCE / (TEST_HALF_EVIDENCE + Math.max(0, otherEvidence)));

/**
 * Lecture d'un axe : moyenne par source (pondérée par l'ancienneté), puis mélange des sources présentes selon
 * leurs poids. Confiance = preuve accumulée E / (E + 4), réduite si les observations se contredisent.
 */
export function readAxis(signals: readonly VisionSignal[], now: Date): AxisReading {
  if (signals.length === 0) return { value: 0, confidence: 0 };
  const sums = new Map<VisionSource, { total: number; weight: number }>();
  let evidence = 0;
  let otherEvidence = 0;
  for (const s of signals) {
    const r = recencyWeight(s, now);
    const acc = sums.get(s.source) ?? { total: 0, weight: 0 };
    acc.total += clamp(s.value, -100, 100) * r;
    acc.weight += r;
    sums.set(s.source, acc);
    const e = SOURCE_EVIDENCE[s.source] * r;
    evidence += e;
    if (s.source !== 'test') otherEvidence += e;
  }
  let mixed = 0;
  let mixWeight = 0;
  const means = new Map<VisionSource, number>();
  for (const [source, { total, weight }] of sums) {
    if (weight <= 0) continue;
    const mean = total / weight;
    means.set(source, mean);
    const w = source === 'test' ? testWeight(otherEvidence) : SOURCE_WEIGHTS[source];
    mixed += w * mean;
    mixWeight += w;
  }
  const value = mixWeight > 0 ? mixed / mixWeight : 0;

  // Cohérence : écart type des observations autour de la valeur retenue (0 → cohérent, 100 et plus → contradictoire).
  let spread = 0;
  let spreadWeight = 0;
  for (const s of signals) {
    const w = SOURCE_EVIDENCE[s.source] * recencyWeight(s, now);
    spread += w * (clamp(s.value, -100, 100) - value) ** 2;
    spreadWeight += w;
  }
  const sd = spreadWeight > 0 ? Math.sqrt(spread / spreadWeight) : 0;
  const consistency = 1 - 0.5 * Math.min(1, sd / 100);
  const confidence = Math.round(100 * (evidence / (evidence + CONFIDENCE_HALF_EVIDENCE)) * consistency);
  return { value: clampVision(value), confidence: clamp(confidence, 0, 100) };
}

/** Profil de vision à l'instant `now`. Déterministe : mêmes observations, même instant → même profil. */
export function visionProfile(signals: readonly VisionSignal[], now: Date): VisionProfile {
  const byAxis = new Map<VisionAxis, VisionSignal[]>(VISION_AXES.map((a) => [a, []]));
  const t = now.getTime();
  for (const s of signals) {
    // Une observation venue du futur (horloge décalée) est ignorée plutôt que surpondérée.
    if (new Date(s.at).getTime() > t) continue;
    byAxis.get(s.axis)?.push(s);
  }
  const out = {} as Record<VisionAxis, AxisReading>;
  for (const axis of VISION_AXES) out[axis] = readAxis(byAxis.get(axis) ?? [], now);
  return out;
}

/** Axe le moins sûr (le défi du jour le vise) ; à égalité, l'ordre des axes. */
export function leastConfidentAxis(profile: VisionProfile): VisionAxis {
  let best: VisionAxis = VISION_AXES[0];
  for (const axis of VISION_AXES) if (profile[axis].confidence < profile[best].confidence) best = axis;
  return best;
}

/** Côté d'un axe, pour les formulations : en dessous de 20 en valeur absolue, la personne est « entre les deux ». */
export const AXIS_SIDES = ['low', 'mid', 'high'] as const;
export type AxisSide = (typeof AXIS_SIDES)[number];
export const MID_BAND = 20;
export const sideOf = (value: number): AxisSide => (value <= -MID_BAND ? 'low' : value >= MID_BAND ? 'high' : 'mid');

/** Un profil sert à l'appariement s'il est un peu connu : au moins 3 axes avec une confiance non nulle. */
/** Répartition d'un axe en 5 tranches égales de −100 à +100 (statistiques de l'administration). */
export const VISION_BUCKETS = 5;
export const visionBucketOf = (value: number): number => Math.min(VISION_BUCKETS - 1, Math.max(0, Math.floor((value + 100) / (200 / VISION_BUCKETS))));

export const isMatchable = (profile: VisionProfile): boolean => VISION_AXES.filter((a) => profile[a].confidence > 0).length >= 3;

// ── Le test de vision ─────────────────────────────────────────────────────────

/** Effet d'un choix : une valeur sur un ou deux axes (le texte est dans `@blowy/content`, par identifiant). */
export type ChoiceEffect = Partial<Record<VisionAxis, number>>;
export interface VisionQuestion {
  id: string;
  choices: readonly [ChoiceEffect, ChoiceEffect];
}

/** 12 situations à deux choix ; chaque axe est visé par au moins deux d'entre elles (foyer et rythme trois). */
export const VISION_TEST: readonly VisionQuestion[] = [
  { id: 'dimanche', choices: [{ rythme: -70 }, { rythme: 70 }] },
  { id: 'enfants', choices: [{ foyer: 80 }, { foyer: -80 }] },
  { id: 'mutation', choices: [{ ancrage: 75, elan: 30 }, { ancrage: -75 }] },
  { id: 'heritage', choices: [{ cap: 75 }, { cap: -75 }] },
  { id: 'promotion', choices: [{ elan: 75 }, { elan: -75 }] },
  { id: 'vacances', choices: [{ cap: -65, rythme: 25 }, { cap: 65 }] },
  { id: 'appartement', choices: [{ foyer: 70, cap: 25 }, { foyer: -70 }] },
  { id: 'vendredi', choices: [{ rythme: 75 }, { rythme: -75 }] },
  { id: 'cinq_ans', choices: [{ ancrage: -70, foyer: 25 }, { ancrage: 70 }] },
  { id: 'projet', choices: [{ elan: 70, rythme: 20 }, { elan: -70 }] },
  { id: 'soirees', choices: [{ foyer: 65, rythme: -30 }, { foyer: -65, rythme: 30 }] },
  { id: 'quartier', choices: [{ rythme: -60, ancrage: -30 }, { rythme: 60 }] },
];
export const VISION_TEST_IDS = VISION_TEST.map((q) => q.id);

/**
 * Le test est soit pas passé (aucune réponse : la personne est inscrite mais n'a pas de suggestions tant qu'elle ne
 * l'a pas fait), soit complet : chaque situation une fois, aucune inconnue.
 */
export function testAnswersState(answers: readonly { questionId: string }[]): 'none' | 'complete' | 'unknown_question' | 'incomplete' {
  if (answers.length === 0) return 'none';
  if (answers.some((a) => !VISION_TEST_IDS.includes(a.questionId))) return 'unknown_question';
  const ids = new Set(answers.map((a) => a.questionId));
  return ids.size === answers.length && ids.size === VISION_TEST_IDS.length ? 'complete' : 'incomplete';
}

export interface VisionAnswer {
  questionId: string;
  choice: 0 | 1;
}

/** Observations tirées des réponses au test (une réponse inconnue est ignorée ; la dernière réponse à une question compte). */
export function testSignals(answers: readonly VisionAnswer[], at: string): VisionSignal[] {
  const last = new Map<string, 0 | 1>();
  for (const a of answers) last.set(a.questionId, a.choice);
  const out: VisionSignal[] = [];
  for (const q of VISION_TEST) {
    const choice = last.get(q.id);
    if (choice === undefined) continue;
    for (const axis of VISION_AXES) {
      const value = q.choices[choice][axis];
      if (value !== undefined) out.push({ axis, value, source: 'test', at });
    }
  }
  return out;
}

// ── Qui on est, qui on cherche ───────────────────────────────────────────────

export const GENDERS = ['femme', 'homme', 'non_binaire', 'non_dit'] as const;
export type Gender = (typeof GENDERS)[number];
/** Des potes, plus, ou les deux. */
export const SEEKINGS = ['potes', 'plus', 'les_deux'] as const;
export type Seeking = (typeof SEEKINGS)[number];
/** Pour « plus » : qui la personne veut rencontrer. Donnée sensible : sert au filtre, n'est jamais montrée aux autres. */
export const WHOMS = ['femmes', 'hommes', 'tout_le_monde'] as const;
export type Whom = (typeof WHOMS)[number];
export const LOCALES = ['fr', 'en', 'es', 'pt', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];

export interface Seeker {
  gender: Gender;
  seeking: Seeking;
  /** Null quand la personne ne cherche que des potes. */
  whom: Whom | null;
}

/** Façon dont deux personnes peuvent se rencontrer. */
export type MatchMode = 'potes' | 'plus';

const accepts = (whom: Whom | null, gender: Gender): boolean =>
  whom === 'tout_le_monde' || (whom === 'femmes' && gender === 'femme') || (whom === 'hommes' && gender === 'homme');
const wantsMoreWith = (a: Seeker, b: Seeker): boolean => a.seeking !== 'potes' && accepts(a.whom, b.gender);
const openToFriends = (s: Seeker): boolean => s.seeking !== 'plus';

/**
 * Filtre « ce que chacun cherche » : « plus » seulement si c'est réciproque (chacun cherche plus, et le sexe de
 * l'autre correspond à qui il veut rencontrer) ; sinon « potes » si les deux sont ouverts à des potes ; sinon rien.
 * Une personne qui n'a pas dit son sexe n'entre dans « plus » qu'avec quelqu'un qui cherche « tout le monde ».
 */
export function matchMode(a: Seeker, b: Seeker): MatchMode | null {
  if (wantsMoreWith(a, b) && wantsMoreWith(b, a)) return 'plus';
  if (openToFriends(a) && openToFriends(b)) return 'potes';
  return null;
}

// ── Compatibilité ────────────────────────────────────────────────────────────

/** En dessous, personne n'est proposé (spéc. §4). */
export const MATCH_THRESHOLD = 70;
/** Écart sur un axe au-delà duquel la proximité vaut 0 (deux pôles opposés à 75 sont déjà « rien en commun »). */
export const CLOSENESS_SPAN = 150;
/** Un axe peu connu compte quand même un peu : sinon deux profils neufs n'auraient aucun score. */
export const MIN_AXIS_TRUST = 0.15;
/** Foyer : compte peu entre potes, double pour « plus ». */
export const AXIS_WEIGHTS: Readonly<Record<MatchMode, Readonly<Record<VisionAxis, number>>>> = {
  potes: { foyer: 0.25, ancrage: 1, elan: 1, rythme: 1, cap: 1 },
  plus: { foyer: 2, ancrage: 1, elan: 1, rythme: 1, cap: 1 },
};

/** Proximité sur un axe, de 0 à 1. */
export const closeness = (a: number, b: number): number => Math.max(0, 1 - Math.abs(a - b) / CLOSENESS_SPAN);
/** Confiance commune sur un axe, de MIN_AXIS_TRUST à 1 (moyenne géométrique : il faut que les deux soient sûrs). */
export const axisTrust = (a: AxisReading, b: AxisReading): number => Math.max(MIN_AXIS_TRUST, Math.sqrt(a.confidence * b.confidence) / 100);

export interface CommonPoint {
  axis: VisionAxis;
  /** Côté partagé (moyenne des deux). */
  side: AxisSide;
}
export interface ToExplore {
  axis: VisionAxis;
  mine: AxisSide;
  theirs: AxisSide;
}
export interface Compatibility {
  /** De 0 à 100. Jamais montré seul : toujours avec l'explication. */
  score: number;
  mode: MatchMode;
  /** Les 3 axes les plus proches. */
  common: readonly [CommonPoint, CommonPoint, CommonPoint];
  /** L'axe le plus éloigné parmi les deux autres. */
  explore: ToExplore;
}

/** Score de 0 à 100 : proximité sur les 5 axes, pondérée par la confiance commune et le poids de l'axe selon le mode. */
export function visionScore(me: VisionProfile, other: VisionProfile, mode: MatchMode): number {
  let sum = 0;
  let weight = 0;
  for (const axis of VISION_AXES) {
    const w = AXIS_WEIGHTS[mode][axis] * axisTrust(me[axis], other[axis]);
    sum += w * closeness(me[axis].value, other[axis].value);
    weight += w;
  }
  return weight > 0 ? Math.round((100 * sum) / weight) : 0;
}

/**
 * Compatibilité et explication (« 3 points communs, 1 différence à explorer »).
 * Classement des axes : proximité décroissante, puis poids × confiance décroissant, puis ordre des axes.
 */
export function compatibilityOf(me: VisionProfile, other: VisionProfile, mode: MatchMode): Compatibility {
  const ranked = VISION_AXES.map((axis, index) => ({
    axis,
    index,
    close: closeness(me[axis].value, other[axis].value),
    weight: AXIS_WEIGHTS[mode][axis] * axisTrust(me[axis], other[axis]),
  })).sort((a, b) => b.close - a.close || b.weight - a.weight || a.index - b.index);
  const [c1, c2, c3, r1, r2] = ranked as [(typeof ranked)[number], (typeof ranked)[number], (typeof ranked)[number], (typeof ranked)[number], (typeof ranked)[number]];
  const common = (r: (typeof ranked)[number]): CommonPoint => ({ axis: r.axis, side: sideOf((me[r.axis].value + other[r.axis].value) / 2) });
  // Différence à explorer : la plus grande des deux restantes (r2 est la moins proche, sauf égalité où r1 l'emporte par l'ordre).
  const far = r2.close < r1.close ? r2 : r1.close < r2.close ? r1 : r1.weight >= r2.weight ? r1 : r2;
  return {
    score: visionScore(me, other, mode),
    mode,
    common: [common(c1), common(c2), common(c3)],
    explore: { axis: far.axis, mine: sideOf(me[far.axis].value), theirs: sideOf(other[far.axis].value) },
  };
}

// ── Filtres durs ─────────────────────────────────────────────────────────────

export interface MatchPerson extends Seeker {
  id: string;
  birthdate: Day;
  vision: VisionProfile;
}

export interface MatchContext {
  today: Day;
  /** Personnes bloquées dans un sens ou dans l'autre. */
  blocked: ReadonlySet<string>;
  /** Distance entre le centre de recherche de la personne et la zone de l'autre (null : inconnue). */
  distanceKm: number | null;
  /** Rayon de recherche ; null : la zone ne filtre pas (amis d'amis). */
  radiusKm: number | null;
}

/**
 * Appariement complet : filtres durs (soi, blocages, 18+, ce que chacun cherche, zone), puis profil assez connu,
 * puis seuil. Rend null si l'autre ne doit pas être présenté.
 */
export function match(me: MatchPerson, other: MatchPerson, ctx: MatchContext): Compatibility | null {
  if (me.id === other.id || ctx.blocked.has(other.id)) return null;
  if (ageOn(me.birthdate, ctx.today) < MIN_AGE || ageOn(other.birthdate, ctx.today) < MIN_AGE) return null;
  if (ctx.radiusKm !== null && (ctx.distanceKm === null || ctx.distanceKm > ctx.radiusKm)) return null;
  const mode = matchMode(me, other);
  if (!mode) return null;
  if (!isMatchable(me.vision) || !isMatchable(other.vision)) return null;
  const c = compatibilityOf(me.vision, other.vision, mode);
  return c.score >= MATCH_THRESHOLD ? c : null;
}

// ── Géographie ───────────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Zone d'une personne sur la carte (gratuit : on ne voit que la sienne). */
export const ZONE_RADIUS_KM = 1.5;
/** Rayon des rencontres proches autour du centre de recherche. */
export const MATCH_RADIUS_KM = 20;
/** Maille d'arrondi des positions montrées (~300 m). */
export const GRID_METERS = 300;
/** Maille grossière des silhouettes floues au-delà de la zone (~2 km). */
export const BLUR_GRID_METERS = 2000;
/** Maille de l'index géographique (degrés) : la recherche ne lit que les cellules autour du centre. */
export const CELL_DEGREES = 0.1;
/** Heures passées ailleurs avant que la zone du domicile ne déménage. */
export const HOME_MOVE_HOURS = 72;

const EARTH_KM = 6371;
const M_PER_DEG_LAT = 111_320;
const rad = (d: number): number => (d * Math.PI) / 180;

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const round6 = (v: number): number => Math.round(v * 1e6) / 1e6;

/** Centre de la maille de `meters` qui contient le point (les longitudes se resserrent avec la latitude). */
export function snapToGrid(p: GeoPoint, meters: number): GeoPoint {
  const latStep = meters / M_PER_DEG_LAT;
  const lat = (Math.floor(p.lat / latStep) + 0.5) * latStep;
  const lngStep = meters / (M_PER_DEG_LAT * Math.max(0.01, Math.cos(rad(lat))));
  const lng = (Math.floor(p.lng / lngStep) + 0.5) * lngStep;
  return { lat: round6(lat), lng: round6(lng) };
}

/** Graine (FNV-1a) → nombre dans [0, 1[ : même graine, même valeur. */
export function unitFromSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (const ch of seed) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x1_0000_0000;
}

/**
 * Position montrée aux autres : centre de la maille de ~300 m, décalé d'au plus 35 % de la maille dans chaque sens
 * par une graine stable (la personne ne « saute » pas d'un affichage à l'autre). Jamais la position exacte.
 */
export function shownPosition(p: GeoPoint, seed: string): GeoPoint {
  const center = snapToGrid(p, GRID_METERS);
  const latStep = GRID_METERS / M_PER_DEG_LAT;
  const lngStep = GRID_METERS / (M_PER_DEG_LAT * Math.max(0.01, Math.cos(rad(center.lat))));
  const jLat = (unitFromSeed(`${seed}|lat`) - 0.5) * 0.7 * latStep;
  const jLng = (unitFromSeed(`${seed}|lng`) - 0.5) * 0.7 * lngStep;
  return { lat: round6(center.lat + jLat), lng: round6(center.lng + jLng) };
}

/** Clé de cellule de l'index géographique. */
export const cellOf = (p: GeoPoint): string => `${Math.floor(p.lat / CELL_DEGREES)}:${Math.floor(p.lng / CELL_DEGREES)}`;

/** Cellules qui couvrent le cercle (centre, rayon) : la recherche de candidats ne lit que celles-ci. */
export function cellsAround(center: GeoPoint, radiusKm: number): string[] {
  const dLat = (radiusKm * 1000) / M_PER_DEG_LAT;
  const dLng = (radiusKm * 1000) / (M_PER_DEG_LAT * Math.max(0.01, Math.cos(rad(center.lat))));
  const out: string[] = [];
  for (let i = Math.floor((center.lat - dLat) / CELL_DEGREES); i <= Math.floor((center.lat + dLat) / CELL_DEGREES); i++) {
    for (let j = Math.floor((center.lng - dLng) / CELL_DEGREES); j <= Math.floor((center.lng + dLng) / CELL_DEGREES); j++) out.push(`${i}:${j}`);
  }
  return out;
}

/** Zone du domicile : là où la personne se trouve d'habitude (arrondie à ~300 m), pas sa position du moment. */
export interface HomeState {
  home: GeoPoint | null;
  /** Autre endroit observé, qui deviendra la zone s'il dure. */
  candidate: GeoPoint | null;
  candidateSince: string | null;
}

export const NO_HOME: HomeState = Object.freeze({ home: null, candidate: null, candidateSince: null });

/** Hors de la zone du domicile (sert à confirmer une sortie). Sans domicile connu : non. */
export const isAwayFromHome = (home: GeoPoint | null, at: GeoPoint): boolean => home !== null && distanceKm(home, at) > ZONE_RADIUS_KM;

/**
 * Nouvelle position relevée (app ouverte). La zone ne bouge pas pour une sortie : elle ne déménage que si
 * la personne est vue au même autre endroit pendant au moins 72 h.
 */
export function updateHome(state: HomeState, fix: GeoPoint, at: string): HomeState {
  const snapped = snapToGrid(fix, GRID_METERS);
  if (!state.home) return { home: snapped, candidate: null, candidateSince: null };
  if (distanceKm(state.home, fix) <= ZONE_RADIUS_KM) return { home: state.home, candidate: null, candidateSince: null };
  if (state.candidate && state.candidateSince && distanceKm(state.candidate, fix) <= ZONE_RADIUS_KM) {
    const hours = (new Date(at).getTime() - new Date(state.candidateSince).getTime()) / 3_600_000;
    if (hours >= HOME_MOVE_HOURS) return { home: state.candidate, candidate: null, candidateSince: null };
    return state;
  }
  return { home: state.home, candidate: snapped, candidateSince: at };
}

/** Centre de recherche : la ville choisie (Blowy+) ou, sinon, la zone du domicile. */
export const matchingCenter = (home: GeoPoint | null, chosen: GeoPoint | null, canChangeCity: boolean): GeoPoint | null =>
  canChangeCity && chosen ? chosen : home;
