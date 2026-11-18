/**
 * Plan du semis d'un environnement de test (docs/SEED-TEST.md) : qui, où, et ce qui se passe jour par jour. Pur et
 * déterministe : même graine, même jour, mêmes options → même plan (aucune horloge, aucun aléa hors de la graine).
 * L'exécution (`Seeder`) le rejoue ensuite par les vrais cas d'usage, dans l'ordre du temps.
 */
import { HABIT_IDS, seedText } from '@blowy/content';
import {
  CARE_ACTIONS,
  type CareAction,
  type Day,
  type Gauges,
  type Gender,
  type GeoPoint,
  type Locale,
  SPECIES,
  type Species,
  VISION_AXES,
  VISION_TEST,
  type VisionAnswer,
  type Zone,
  ZONES,
  offsetPoint,
  storedPoint,
  zoneOfPoint,
} from '@blowy/domain';
import { SEED_ID_PREFIX, seedEmail } from './guards';
import { NEUTRAL_NAMES, PET_NAMES, poolFor } from './names';

export interface SeedOptions {
  /** Villes (identifiant de la ville dans les quartiers : `paris`, `lyon`, `bruxelles`…) ; vide : toutes. */
  cities: readonly string[];
  /** Comptes par ville (Paris : trois fois plus, répartis sur ses arrondissements). */
  perCity: number;
  /** Graine du tirage. */
  seed: number;
}

export const DEFAULT_PER_CITY = 40;
export const PARIS_FACTOR = 3;
/** Jours couverts par l'activité simulée. */
export const SEED_DAYS = 20;

/** Ville d'un quartier : `paris-11` → `paris`, `bordeaux` → `bordeaux`. */
export const citySlugOf = (zoneId: string): string => zoneId.replace(/-\d+$/, '');
/** Villes proposées par le site (page « Ouvre ton quartier » et pages des villes), dans l'ordre. */
export const SEED_CITIES: readonly string[] = [...new Set(ZONES.map((z) => citySlugOf(z.id)))];

export interface PlannedPerson {
  slot: number;
  id: string;
  email: string;
  city: string;
  zone: string;
  locale: Locale;
  displayName: string;
  birthdate: Day;
  gender: Gender;
  species: Species;
  petName: string;
  quiz: Partial<Gauges>;
  visionAnswers: VisionAnswer[];
  habits: string[];
  /** Position déjà dans le quartier (l'API l'arrondit encore à l'enregistrement). */
  point: GeoPoint;
  discreet: boolean;
  /** Inscrit il y a ce nombre de jours. */
  createdDaysAgo: number;
  /** Minimoa+ (adaptateurs mémoire seulement : pas de reçu Apple fictif). */
  plus: boolean;
}

type At = { daysAgo: number; minute: number };
export type PlannedEvent = At &
  (
    | { kind: 'onboard'; who: number }
    | { kind: 'link'; a: number; b: number }
    | { kind: 'message'; a: number; b: number; from: number; body: string }
    | { kind: 'care'; who: number; action: CareAction }
    | { kind: 'daily'; who: number; choice: 0 | 1 }
    | { kind: 'group'; key: number; creator: number; members: number[]; name: string; habitId: string | null }
    | { kind: 'groupJoin'; key: number; who: number }
    | { kind: 'groupMessage'; key: number; who: number; body: string }
    | { kind: 'wave'; from: number; to: number }
  );

export interface PlannedSignup {
  id: string;
  email: string;
  locale: Locale;
  code: string;
  token: string;
  /** Rang (dans ce quartier) de l'inscription qui a invité. */
  invitedBy: number | null;
  createdDaysAgo: number;
  /** Minute du jour de l'inscription, puis délai de confirmation (minutes). */
  minute: number;
  confirmAfter: number;
}

export interface PlannedZone {
  zone: string;
  signups: PlannedSignup[];
  open: 'threshold' | 'admin' | null;
}

export interface SeedPlan {
  people: PlannedPerson[];
  /** Dans l'ordre du temps (du plus ancien au plus récent). */
  events: PlannedEvent[];
  zones: PlannedZone[];
}

// ── Tirage ─────────────────────────────────────────────────────────────────

/** Générateur pseudo-aléatoire à graine (mulberry32). */
export function rngOf(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

class Draw {
  private readonly ids = new Set<string>();
  private readonly codes = new Set<string>();
  constructor(readonly next: () => number) {}
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.next() * list.length)] as T;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  hex(n: number): string {
    let out = '';
    for (let i = 0; i < n; i++) out += Math.floor(this.next() * 16).toString(16);
    return out;
  }
  /** Identifiant du semis : UUID v4 valide, préfixe `5eed5eed-`. */
  uuid(): string {
    for (;;) {
      const id = `${SEED_ID_PREFIX}${this.hex(4)}-4${this.hex(3)}-8${this.hex(3)}-${this.hex(12)}`;
      if (!this.ids.has(id) && !id.startsWith(`${SEED_ID_PREFIX}0000-`)) {
        this.ids.add(id);
        return id;
      }
    }
  }
  /** Code d'une inscription de quartier (`N` + 7 caractères sans ambiguïté). */
  signupCode(): string {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    for (;;) {
      let code = 'N';
      for (let i = 0; i < 7; i++) code += alphabet[Math.floor(this.next() * alphabet.length)];
      if (!this.codes.has(code)) {
        this.codes.add(code);
        return code;
      }
    }
  }
  shuffle<T>(list: readonly T[]): T[] {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }
}

// ── Personnes ──────────────────────────────────────────────────────────────

function localeFor(d: Draw, country: Zone['country']): Locale {
  switch (country) {
    case 'be':
      return d.chance(0.35) ? 'nl' : 'fr';
    case 'nl':
      return d.chance(0.15) ? 'en' : 'nl';
    case 'pt':
      return d.chance(0.1) ? 'en' : 'pt';
    case 'es':
      return d.chance(0.1) ? 'en' : 'es';
    default:
      return d.chance(0.05) ? 'en' : 'fr';
  }
}

function genderFor(d: Draw): Gender {
  const r = d.next();
  return r < 0.47 ? 'femme' : r < 0.94 ? 'homme' : r < 0.98 ? 'non_binaire' : 'non_dit';
}

function birthdateFor(d: Draw, today: Day): Day {
  const year = Number(today.slice(0, 4)) - d.int(19, 44);
  return `${year}-${String(d.int(1, 12)).padStart(2, '0')}-${String(d.int(1, 28)).padStart(2, '0')}`;
}

/** Réponses au test de vision tirées d'un caractère (chaque personne penche d'un côté sur chaque axe, plus ou moins). */
function visionFor(d: Draw): VisionAnswer[] {
  const persona = Object.fromEntries(VISION_AXES.map((a) => [a, d.next() * 2 - 1])) as Record<(typeof VISION_AXES)[number], number>;
  return VISION_TEST.map((q) => {
    let score = 0;
    for (const axis of VISION_AXES) score += ((q.choices[0][axis] ?? 0) - (q.choices[1][axis] ?? 0)) * persona[axis];
    const p0 = 1 / (1 + Math.exp(-score / 40));
    return { questionId: q.id, choice: d.chance(p0) ? 0 : 1 };
  });
}

/** Un point dans le quartier : tiré dans son rayon, gardé si, une fois arrondi comme le fait l'API, il y reste. */
export function pointIn(d: Draw, zone: Zone): GeoPoint {
  const center = zone.center as GeoPoint;
  for (let i = 0; i < 12; i++) {
    const p = offsetPoint(center, zone.radiusKm * 0.7 * Math.sqrt(d.next()), d.next() * 360);
    if (zoneOfPoint(storedPoint(p))?.id === zone.id) return p;
  }
  return center;
}

function quizFor(d: Draw): Partial<Gauges> {
  const out: Partial<Gauges> = {};
  for (const k of ['social', 'play', 'tender', 'talk'] as const) if (d.chance(0.7)) out[k] = d.int(-30, 30);
  return out;
}

function person(d: Draw, slot: number, zone: Zone, today: Day): PlannedPerson {
  const locale = localeFor(d, zone.country);
  const gender = genderFor(d);
  const pool = poolFor(locale, zone.country);
  const first = gender === 'femme' ? d.pick(pool.femme) : gender === 'homme' ? d.pick(pool.homme) : d.pick(NEUTRAL_NAMES);
  const displayName = d.chance(0.25) ? `${first} ${d.pick([...'BCDFGLMNPRST'])}.` : first;
  const habitCount = d.chance(0.4) ? 0 : d.chance(0.66) ? 1 : 2;
  const id = d.uuid();
  return {
    slot,
    id,
    email: seedEmail(`${citySlugOf(zone.id)}-${slot}-${id.slice(9, 13)}`),
    city: citySlugOf(zone.id),
    zone: zone.id,
    locale,
    displayName,
    birthdate: birthdateFor(d, today),
    gender,
    species: d.pick(SPECIES),
    petName: d.pick(PET_NAMES),
    quiz: quizFor(d),
    visionAnswers: visionFor(d),
    habits: d.shuffle(HABIT_IDS).slice(0, habitCount),
    point: pointIn(d, zone),
    discreet: d.chance(0.07),
    createdDaysAgo: Math.min(SEED_DAYS, Math.floor(Math.pow(d.next(), 0.7) * (SEED_DAYS + 1))),
    plus: d.chance(0.1),
  };
}

// ── Plan ───────────────────────────────────────────────────────────────────

/** Villes demandées, vérifiées (une ville inconnue est une erreur claire). */
export function resolveCities(requested: readonly string[]): string[] {
  const wanted = requested.map((c) => c.trim().toLowerCase()).filter((c) => c.length > 0 && c !== 'all');
  if (wanted.length === 0) return [...SEED_CITIES];
  const unknown = wanted.filter((c) => !SEED_CITIES.includes(c));
  if (unknown.length > 0) throw new Error(`ville inconnue : ${unknown.join(', ')} (au choix : ${SEED_CITIES.join(', ')})`);
  return [...new Set(wanted)];
}

/**
 * Le plan complet. `today` : jour courant (Paris) ; `threshold` : seuil d'ouverture des quartiers (quelques quartiers
 * juste en dessous, un ou deux ouverts).
 */
export function buildPlan(options: SeedOptions, today: Day, threshold: number): SeedPlan {
  const d = new Draw(rngOf(options.seed));
  const cities = resolveCities(options.cities);
  const people: PlannedPerson[] = [];
  const events: PlannedEvent[] = [];
  const byCity = new Map<string, number[]>();

  for (const city of cities) {
    const zones = ZONES.filter((z) => citySlugOf(z.id) === city);
    const n = options.perCity * (city === 'paris' ? PARIS_FACTOR : 1);
    const members: number[] = [];
    for (let i = 0; i < n; i++) {
      const p = person(d, people.length, zones[i % zones.length] as Zone, today);
      members.push(p.slot);
      people.push(p);
      events.push({ kind: 'onboard', who: p.slot, daysAgo: p.createdDaysAgo, minute: d.int(0, 59) });
    }
    byCity.set(city, members);
  }

  for (const members of byCity.values()) planCity(d, people, members, events);
  for (const p of people) planRoutine(d, p, events);

  events.sort((x, y) => y.daysAgo - x.daysAgo || x.minute - y.minute);
  return { people, events, zones: planZones(d, cities, threshold) };
}

const pairKey = (a: number, b: number): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
const linesOf = (locale: Locale) => seedText.in(locale);

/** Liens (avec conversations), groupes et coucous en attente dans une ville. */
function planCity(d: Draw, people: PlannedPerson[], members: number[], events: PlannedEvent[]): void {
  if (members.length < 2) return;
  const linked = new Set<string>();
  const linksOf = new Map<number, { other: number; daysAgo: number }[]>();
  const p = (i: number) => people[i] as PlannedPerson;

  for (const a of members) {
    const want = d.pick([0, 0, 1, 1, 1, 2, 2, 3]);
    for (let k = 0, tries = 0; k < want && tries < 10; tries++) {
      const b = d.pick(members);
      if (b === a || linked.has(pairKey(a, b)) || (linksOf.get(b)?.length ?? 0) >= 4) continue;
      linked.add(pairKey(a, b));
      k++;
      const daysAgo = d.int(0, Math.min(14, p(a).createdDaysAgo, p(b).createdDaysAgo));
      events.push({ kind: 'link', a, b, daysAgo, minute: d.int(100, 199) });
      for (const [x, y] of [[a, b], [b, a]] as const) linksOf.set(x, [...(linksOf.get(x) ?? []), { other: y, daysAgo }]);
      // Conversation : certains jours l'un écrit, parfois l'autre répond (jours « à deux » et séries).
      const intensity = 0.25 + d.next() * 0.65;
      let minute = 200;
      for (let day = daysAgo; day >= 0; day--) {
        minute = 200 + d.int(0, 60);
        if (day === daysAgo) {
          events.push({ kind: 'message', a, b, from: a, body: d.pick(linesOf(p(a).locale).openers), daysAgo: day, minute });
          events.push({ kind: 'message', a, b, from: b, body: d.pick(linesOf(p(b).locale).replies), daysAgo: day, minute: minute + 30 });
          continue;
        }
        if (!d.chance(intensity)) continue;
        const [first, second] = d.chance(0.5) ? [a, b] : [b, a];
        events.push({ kind: 'message', a, b, from: first, body: d.pick(linesOf(p(first).locale).lines), daysAgo: day, minute });
        if (d.chance(intensity)) events.push({ kind: 'message', a, b, from: second, body: d.pick(linesOf(p(second).locale).replies), daysAgo: day, minute: minute + d.int(20, 200) });
      }
    }
  }

  // Groupes : une personne avec au moins deux liens invite deux ou trois d'entre eux.
  const creators = d.shuffle(members.filter((m) => (linksOf.get(m)?.length ?? 0) >= 2)).slice(0, Math.max(1, Math.floor(members.length / 12)));
  for (const creator of creators) {
    const chosen = d.shuffle(linksOf.get(creator) ?? []).slice(0, d.int(2, 3));
    if (chosen.length < 2) continue;
    const latest = Math.min(...chosen.map((c) => c.daysAgo));
    const daysAgo = Math.floor(latest / 2);
    const key = events.length;
    const habit = p(creator).habits[0] ?? null;
    const habitId = habit && d.chance(0.6) ? habit : null;
    events.push({ kind: 'group', key, creator, members: chosen.map((c) => c.other), name: d.pick(linesOf(p(creator).locale).groupNames), habitId, daysAgo, minute: 600 });
    const joinDay = Math.max(0, daysAgo - 1);
    const joined: number[] = [];
    for (const c of chosen) {
      if (!d.chance(0.8)) continue;
      joined.push(c.other);
      events.push({ kind: 'groupJoin', key, who: c.other, daysAgo: joinDay, minute: joinDay === daysAgo ? 650 + joined.length : 610 + joined.length });
    }
    for (const who of [creator, ...joined].slice(0, 3)) {
      events.push({ kind: 'groupMessage', key, who, body: d.pick(linesOf(p(who).locale).groupLines), daysAgo: joinDay, minute: 700 + d.int(0, 40) });
    }
  }

  // Coucous en attente, ces derniers jours.
  const waves = new Set<string>();
  const wanted = Math.ceil(members.length * 0.25);
  for (let tries = 0; waves.size < wanted && tries < wanted * 5; tries++) {
    const from = d.pick(members);
    const to = d.pick(members);
    if (from === to || linked.has(pairKey(from, to)) || waves.has(pairKey(from, to))) continue;
    waves.add(pairKey(from, to));
    events.push({ kind: 'wave', from, to, daysAgo: d.int(0, Math.min(2, p(from).createdDaysAgo, p(to).createdDaysAgo)), minute: d.int(960, 1000) });
  }
}

/** Soins au minimoa et défi du jour, certains jours (chacun son rythme). */
function planRoutine(d: Draw, p: PlannedPerson, events: PlannedEvent[]): void {
  const activity = 0.25 + d.next() * 0.65;
  for (let day = p.createdDaysAgo; day >= 0; day--) {
    if (!d.chance(activity)) continue;
    const gestures = d.int(1, 2);
    for (let g = 0; g < gestures; g++) events.push({ kind: 'care', who: p.slot, action: d.pick(CARE_ACTIONS), daysAgo: day, minute: d.int(760, 899) });
    if (d.chance(0.7)) events.push({ kind: 'daily', who: p.slot, choice: d.chance(0.5) ? 0 : 1, daysAgo: day, minute: d.int(900, 950) });
  }
}

/** Inscriptions « Ouvre ton quartier » : un quartier ouvert au seuil, un ouvert à la main, quelques-uns tout près. */
function planZones(d: Draw, cities: readonly string[], threshold: number): PlannedZone[] {
  const zones = d.shuffle(ZONES.filter((z) => cities.includes(citySlugOf(z.id))));
  const cap = Math.min(threshold, 150);
  const out: PlannedZone[] = [];
  zones.forEach((zone, i) => {
    let count = 0;
    let open: PlannedZone['open'] = null;
    if (i === 0) {
      count = cap + d.int(0, 8);
      open = threshold <= 150 ? 'threshold' : 'admin';
    } else if (i === 1) {
      count = d.int(15, 35);
      open = 'admin';
    } else if (i <= 4) {
      count = Math.max(1, cap - d.int(1, 6));
    } else if (d.chance(0.6)) {
      count = Math.min(cap - 1, 1 + Math.floor(d.next() * d.next() * 30));
    }
    if (count <= 0) return;
    const signups: PlannedSignup[] = [];
    const days = Array.from({ length: count }, () => d.int(1, SEED_DAYS)).sort((a, b) => b - a);
    for (let k = 0; k < count; k++) {
      const city = ZONES.find((z) => z.id === zone.id)?.country ?? 'fr';
      signups.push({
        id: d.uuid(),
        email: seedEmail(`quartier-${zone.id}-${k + 1}`),
        locale: localeFor(d, city),
        code: d.signupCode(),
        token: d.hex(40),
        invitedBy: k > 0 && d.chance(0.35) ? d.int(0, k - 1) : null,
        createdDaysAgo: days[k] as number,
        minute: d.int(0, 900),
        confirmAfter: d.int(5, 120),
      });
    }
    out.push({ zone: zone.id, signups, open });
  });
  return out;
}

/** Résumé d'un plan (sortie de `--dry-run`). */
export function planSummary(plan: SeedPlan): Record<string, number> {
  const count = (k: PlannedEvent['kind']) => plan.events.filter((e) => e.kind === k).length;
  return {
    accounts: plan.people.length,
    links: count('link'),
    messages: count('message'),
    groups: count('group'),
    waves: count('wave'),
    careActions: count('care'),
    dailyChallenges: count('daily'),
    habits: plan.people.reduce((n, p) => n + p.habits.length, 0),
    zones: plan.zones.length,
    signups: plan.zones.reduce((n, z) => n + z.signups.length, 0),
    openedZones: plan.zones.filter((z) => z.open).length,
  };
}
