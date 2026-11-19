/**
 * Donner envie de Minimoa+ sans rien inventer (docs/DESIR.md). Règles pures : le jour courant est un paramètre.
 *
 * - « Vu de loin » : de vraies personnes compatibles, comptées, jamais montrées (`farSummary`).
 * - Collections saisonnières : une vraie date de fin, tenue par le serveur ; ceux qui ont eu Minimoa+ pendant la
 *   collection gardent ses objets, les autres ne peuvent plus les avoir (`COLLECTIONS`, `itemAvailable`).
 * - Moments clés : une seule proposition forte par moment (première rencontre réussie, 7 jours de série, deuxième jour
 *   avec son minimoa), jamais deux en moins de `STRONG_GAP_DAYS` jours, jamais le jour de l'inscription (`plusMomentDue`).
 * - Déclencheurs : chaque ouverture de la feuille dit d'où elle vient (`PLUS_TRIGGERS`), pour mesurer la conversion.
 */
import { type Day, daysBetween } from './days';
import type { CounterRow } from './growth';
import { ITEM_SLOTS, type Outfit, WINTER_ITEM_IDS } from './items';

// ── Déclencheurs de la feuille ──────────────────────────────────────────────

/**
 * D'où la feuille Minimoa+ a été ouverte (la « raison » de l'app). Gardé tel quel dans les compteurs du jour
 * (`growth_counters.source`, 20 caractères au plus) : ouvertures, essais et paiements par déclencheur.
 */
export const PLUS_TRIGGERS = [
  'generic',
  'onboarding',
  'premium_item',
  'map',
  'change_city',
  'habits_limit',
  'rename',
  'detailed_review',
  'jokers',
  'encounters',
  // Désir (docs/DESIR.md)
  'far_away',
  'try_on',
  'worn_by',
  'collection',
  'moment_first_link',
  'moment_streak_7',
  'moment_second_day',
] as const;
export type PlusTrigger = (typeof PLUS_TRIGGERS)[number];
export const isPlusTrigger = (v: unknown): v is PlusTrigger => typeof v === 'string' && (PLUS_TRIGGERS as readonly string[]).includes(v);

// ── Vu de loin ──────────────────────────────────────────────────────────────

/** Compatibilité à partir de laquelle on parle d'une « très forte » compatibilité (« dont 3 à plus de 85 % »). */
export const STRONG_MATCH = 85;

export interface FarSummary {
  /** Personnes réelles, compatibles, qu'on ne te montre pas encore. */
  count: number;
  /** Dont celles à `STRONG_MATCH` % ou plus. */
  strong: number;
  /** Meilleure compatibilité parmi elles (null s'il n'y a personne). */
  best: number | null;
}

/** Résumé honnête d'une liste de compatibilités (déjà filtrées par l'Audience et les règles des rencontres). */
export function farSummary(scores: readonly number[]): FarSummary {
  if (scores.length === 0) return { count: 0, strong: 0, best: null };
  return { count: scores.length, strong: scores.filter((s) => s >= STRONG_MATCH).length, best: Math.max(...scores) };
}

// ── Collections saisonnières ────────────────────────────────────────────────

export const COLLECTION_IDS = ['hiver_2026'] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

export interface SeasonalCollection {
  id: CollectionId;
  /** Objets premium de la collection (ordre de la vitrine). */
  items: readonly string[];
  /** Premier et dernier jour (inclus, heure de Paris) où Minimoa+ les donne. */
  from: Day;
  until: Day;
}

/**
 * Les collections et leurs dates. Une date de fin est une promesse : on ne la repousse pas (sinon la rareté serait
 * fausse). Après `until`, ses objets ne sont plus donnés ; ceux qui les ont eus (Minimoa+ pendant la collection) les
 * gardent, portables tant que Minimoa+ est actif, comme tous les objets premium.
 */
export const COLLECTIONS: readonly SeasonalCollection[] = [{ id: 'hiver_2026', items: WINTER_ITEM_IDS, from: '2026-11-01', until: '2027-01-31' }];

const COLLECTION_OF = new Map<string, SeasonalCollection>(COLLECTIONS.flatMap((c) => c.items.map((id) => [id, c] as const)));
export const collectionOfItem = (itemId: string): SeasonalCollection | null => COLLECTION_OF.get(itemId) ?? null;
export const collectionOpen = (c: SeasonalCollection, today: Day): boolean => today >= c.from && today <= c.until;

/** La collection en cours (la plus proche de sa fin s'il y en a deux) et les jours qui restent, fin comprise. */
export function currentCollection(today: Day): { collection: SeasonalCollection; daysLeft: number } | null {
  const open = COLLECTIONS.filter((c) => collectionOpen(c, today)).sort((a, b) => a.until.localeCompare(b.until))[0];
  return open ? { collection: open, daysLeft: daysBetween(today, open.until) + 1 } : null;
}

/**
 * Un objet peut-il être à quelqu'un aujourd'hui ? Hors collection : oui. D'une collection : pendant la collection, ou
 * s'il a été gardé (`kept` : objets reçus pendant la collection, `pet_items`).
 */
export function itemAvailable(itemId: string, today: Day, kept: ReadonlySet<string>): boolean {
  const c = collectionOfItem(itemId);
  return !c || collectionOpen(c, today) || kept.has(itemId);
}

/** Objets à garder maintenant pour une personne avec Minimoa+ : ceux des collections en cours qu'elle n'a pas encore. */
export function collectionItemsToKeep(plus: boolean, today: Day, kept: ReadonlySet<string>): string[] {
  if (!plus) return [];
  return COLLECTIONS.filter((c) => collectionOpen(c, today)).flatMap((c) => c.items.filter((id) => !kept.has(id)));
}

/** Tenue sans les objets d'une collection finie qui n'ont pas été gardés. Même objet rendu si rien ne change. */
export function withoutUnavailable(outfit: Outfit, today: Day, kept: ReadonlySet<string>): Outfit {
  if (ITEM_SLOTS.every((slot) => !outfit[slot] || itemAvailable(outfit[slot] as string, today, kept))) return outfit;
  const out: Outfit = {};
  for (const slot of ITEM_SLOTS) {
    const id = outfit[slot];
    if (id && itemAvailable(id, today, kept)) out[slot] = id;
  }
  return out;
}

// ── Moments clés ────────────────────────────────────────────────────────────

/**
 * Moments de valeur après lesquels Minimoa+ peut être proposé, une fois chacun. `second_day` (19 nov. 2026) : la
 * feuille ne s'ouvre plus à la fin de l'inscription ; elle peut s'ouvrir une fois au deuxième jour (jusqu'au quatrième),
 * quand la personne a eu le temps de voir ce que l'app gratuite fait.
 */
export const PLUS_MOMENTS = ['first_link', 'streak_7', 'second_day'] as const;
export type PlusMoment = (typeof PLUS_MOMENTS)[number];
export const isPlusMoment = (v: unknown): v is PlusMoment => typeof v === 'string' && (PLUS_MOMENTS as readonly string[]).includes(v);
/**
 * Moments que connaît une app qui ne dit rien (versions d'avant `second_day`) : un moment inconnu ferait échouer la
 * lecture de sa réponse. L'app dit les moments qu'elle sait ouvrir (`PlusMomentBody.accepts`).
 */
export const LEGACY_PLUS_MOMENTS: readonly PlusMoment[] = ['first_link', 'streak_7'];
/** Le moment « deuxième jour » : du jour 2 au jour 2 + `MOMENT_FRESH_DAYS` après l'inscription. */
export const SECOND_DAY = 2;

/** Jours au moins entre deux propositions fortes (feuille ouverte d'elle-même). */
export const STRONG_GAP_DAYS = 3;
/** Le moment compte s'il a eu lieu il y a au plus tant de jours (après, ce n'est plus « juste après »). */
export const MOMENT_FRESH_DAYS = 2;
/** Série du défi du jour qui fait le moment « 7 jours ». */
export const MOMENT_STREAK = 7;

/** Clés du journal (`lifecycle_messages`) : une par moment, une par jour de proposition forte. */
export const plusMomentKey = (m: PlusMoment): string => `plus_moment:${m}`;
export const plusStrongKey = (day: Day): string => `plus_strong:${day}`;

export interface PlusMomentFacts {
  today: Day;
  plus: boolean;
  /** Jour d'inscription (heure de Paris). */
  createdOn: Day;
  /** Clés déjà réservées par cette personne dans le journal. */
  keys: ReadonlySet<string>;
  /** Jour du premier lien de la personne (le plus ancien encore connu), null sans lien. */
  firstLinkOn: Day | null;
  /** Nombre de liens (vivants ou fantômes). */
  links: number;
  /** Série du défi du jour, et jour du dernier défi fait. */
  streak: number;
  streakDay: Day | null;
  /** Moments que l'app sait ouvrir (défaut : `LEGACY_PLUS_MOMENTS`). */
  accepts?: readonly PlusMoment[];
}

/** Dernière proposition forte (jour), d'après le journal. */
function lastStrong(keys: ReadonlySet<string>): Day | null {
  let last: Day | null = null;
  for (const k of keys) {
    if (!k.startsWith('plus_strong:')) continue;
    const d = k.slice('plus_strong:'.length);
    if (!last || d > last) last = d;
  }
  return last;
}

/**
 * Le moment à saluer d'une proposition Minimoa+ maintenant, ou null. Jamais avec Minimoa+, jamais le jour de
 * l'inscription (la première session sert à découvrir les gens), jamais deux fois le même moment, jamais moins de
 * `STRONG_GAP_DAYS` jours après une autre proposition forte, et seulement juste après le moment.
 */
export function plusMomentDue(f: PlusMomentFacts): PlusMoment | null {
  if (f.plus || daysBetween(f.createdOn, f.today) < 1) return null;
  const accepts = f.accepts ?? LEGACY_PLUS_MOMENTS;
  const last = lastStrong(f.keys);
  if (last && daysBetween(last, f.today) < STRONG_GAP_DAYS) return null;
  const fresh = (d: Day | null): boolean => d !== null && daysBetween(d, f.today) >= 0 && daysBetween(d, f.today) <= MOMENT_FRESH_DAYS;
  // Première rencontre réussie : le tout premier lien, tout récent.
  if (accepts.includes('first_link') && !f.keys.has(plusMomentKey('first_link')) && f.links === 1 && fresh(f.firstLinkOn)) return 'first_link';
  // Une semaine de défis d'affilée (la série est encore vivante).
  if (
    accepts.includes('streak_7') &&
    !f.keys.has(plusMomentKey('streak_7')) &&
    f.streak >= MOMENT_STREAK &&
    f.streak < MOMENT_STREAK + MOMENT_FRESH_DAYS + 1 &&
    fresh(f.streakDay)
  )
    return 'streak_7';
  // Deuxième jour avec son minimoa (la feuille n'est plus proposée à l'inscription) : une fois, du jour 2 au jour 4.
  const age = daysBetween(f.createdOn, f.today);
  if (accepts.includes('second_day') && !f.keys.has(plusMomentKey('second_day')) && age >= SECOND_DAY && age <= SECOND_DAY + MOMENT_FRESH_DAYS) return 'second_day';
  return null;
}


// ── Mesure ──────────────────────────────────────────────────────────────────

export interface PlusTriggerRow {
  trigger: string;
  opens: number;
  trials: number;
  paid: number;
  /** (essais + paiements) / ouvertures ; null sans ouverture. */
  rate: number | null;
}

/** Conversion par déclencheur, d'après les compteurs du jour (`plus_open`, `plus_trial`, `plus_paid`). */
export function plusTriggerReport(counters: readonly CounterRow[]): PlusTriggerRow[] {
  const by = new Map<string, { opens: number; trials: number; paid: number }>();
  for (const c of counters) {
    if (c.metric !== 'plus_open' && c.metric !== 'plus_trial' && c.metric !== 'plus_paid') continue;
    const row = by.get(c.source) ?? { opens: 0, trials: 0, paid: 0 };
    if (c.metric === 'plus_open') row.opens += c.count;
    else if (c.metric === 'plus_trial') row.trials += c.count;
    else row.paid += c.count;
    by.set(c.source, row);
  }
  return [...by.entries()]
    .map(([trigger, r]) => ({ trigger: trigger || 'unknown', ...r, rate: r.opens > 0 ? (r.trials + r.paid) / r.opens : null }))
    .sort((a, b) => b.opens - a.opens || a.trigger.localeCompare(b.trigger));
}
