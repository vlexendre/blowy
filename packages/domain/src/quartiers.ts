/**
 * Ouvrir son quartier (docs/VIRALITE.md, boucle 3) : Minimoa ouvre quartier par quartier. Chaque quartier a un vrai
 * compteur (inscriptions confirmées par e-mail, désinscriptions déduites) et s'ouvre à un seuil (50 par défaut, réglé
 * dans l'administration). Inviter fait avancer **son** quartier ; les 3 premiers inviteurs du quartier reçoivent l'objet
 * « Fondateur » à l'ouverture.
 *
 * Vie privée : on ne demande jamais une position précise. Un quartier est choisi dans une liste ou trouvé par son code
 * postal. Dans l'app, la zone de la personne (déjà arrondie à ~300 m) est rapprochée du centre de quartier le plus
 * proche, sans rien enregistrer de plus. Pur : ni horloge ni aléa.
 */
import { type GeoPoint, distanceKm } from './vision';

export const DEFAULT_OPEN_THRESHOLD = 50;
export const MIN_OPEN_THRESHOLD = 1;
export const MAX_OPEN_THRESHOLD = 100_000;
/** Nombre de fondateurs par quartier (objet de garde-robe « Fondateur »). */
export const FOUNDERS_PER_ZONE = 3;
/** Une inscription non confirmée est effacée après ce délai. */
export const UNCONFIRMED_KEEP_DAYS = 7;

export type ZoneCountry = 'fr' | 'be' | 'nl' | 'pt' | 'es';

export interface Zone {
  /** `paris-11`, `lyon-3`, `bordeaux`, `cp-38000`. */
  id: string;
  /** Ville (nom français ; traduit par `cityName` côté contenu). */
  city: string;
  /** Arrondissement (Paris, Lyon, Marseille) ; null pour une ville entière ou un code postal. */
  district: number | null;
  /** Code postal d'une zone hors liste (`cp-…`). */
  postalCode: string | null;
  country: ZoneCountry;
  /** Centre approximatif (mairie d'arrondissement, centre-ville) ; null pour une zone par code postal. */
  center: GeoPoint | null;
  /** Rayon de rattachement d'une position de l'app au centre (km). */
  radiusKm: number;
}

const arr = (city: string, slug: string, centers: readonly (readonly [number, number])[], radiusKm: number): Zone[] =>
  centers.map(([lat, lng], i) => ({ id: `${slug}-${i + 1}`, city, district: i + 1, postalCode: null, country: 'fr', center: { lat, lng }, radiusKm }));

const city = (id: string, name: string, country: ZoneCountry, lat: number, lng: number, radiusKm = 10): Zone => ({
  id,
  city: name,
  district: null,
  postalCode: null,
  country,
  center: { lat, lng },
  radiusKm,
});

/** Quartiers de la liste : arrondissements de Paris, Lyon, Marseille, et grandes villes entières. */
export const ZONES: readonly Zone[] = [
  ...arr(
    'Paris',
    'paris',
    [
      [48.86, 2.341], [48.8687, 2.3428], [48.863, 2.3601], [48.8543, 2.3576], [48.8445, 2.3496],
      [48.8491, 2.3328], [48.8562, 2.3122], [48.8727, 2.3125], [48.8771, 2.3375], [48.8761, 2.3607],
      [48.859, 2.38], [48.835, 2.4213], [48.8283, 2.3622], [48.8292, 2.3266], [48.8401, 2.2934],
      [48.8604, 2.262], [48.8873, 2.3067], [48.8925, 2.3484], [48.887, 2.3848], [48.8634, 2.4011],
    ],
    2.5,
  ),
  ...arr(
    'Lyon',
    'lyon',
    [
      [45.7676, 4.8344], [45.7485, 4.827], [45.76, 4.86], [45.779, 4.827], [45.759, 4.803],
      [45.77, 4.852], [45.742, 4.841], [45.735, 4.869], [45.774, 4.806],
    ],
    3,
  ),
  ...arr(
    'Marseille',
    'marseille',
    [
      [43.299, 5.384], [43.311, 5.365], [43.312, 5.38], [43.306, 5.4], [43.292, 5.397], [43.287, 5.38],
      [43.283, 5.36], [43.25, 5.385], [43.245, 5.43], [43.277, 5.425], [43.288, 5.48], [43.307, 5.44],
      [43.35, 5.43], [43.345, 5.39], [43.36, 5.35], [43.36, 5.315],
    ],
    4,
  ),
  city('toulouse', 'Toulouse', 'fr', 43.6045, 1.444),
  city('bordeaux', 'Bordeaux', 'fr', 44.8378, -0.5792),
  city('lille', 'Lille', 'fr', 50.6292, 3.0573),
  city('nantes', 'Nantes', 'fr', 47.2184, -1.5536),
  city('nice', 'Nice', 'fr', 43.7102, 7.262),
  city('montpellier', 'Montpellier', 'fr', 43.6108, 3.8767),
  city('strasbourg', 'Strasbourg', 'fr', 48.5734, 7.7521),
  city('rennes', 'Rennes', 'fr', 48.1173, -1.6778),
  city('bruxelles', 'Bruxelles', 'be', 50.8503, 4.3517),
  city('amsterdam', 'Amsterdam', 'nl', 52.3676, 4.9041),
  city('lisbonne', 'Lisbonne', 'pt', 38.7223, -9.1393),
  city('madrid', 'Madrid', 'es', 40.4168, -3.7038, 14),
  city('barcelone', 'Barcelone', 'es', 41.3874, 2.1686),
];

/** Villes de la liste (dans l'ordre), pour le premier menu. */
export const ZONE_CITIES: readonly string[] = [...new Set(ZONES.map((z) => z.city))];

/** Codes postaux des villes entières de la liste. */
const CITY_POSTAL: Readonly<Record<string, string>> = {
  '31000': 'toulouse', '31100': 'toulouse', '31200': 'toulouse', '31300': 'toulouse', '31400': 'toulouse', '31500': 'toulouse',
  '33000': 'bordeaux', '33100': 'bordeaux', '33200': 'bordeaux', '33300': 'bordeaux', '33800': 'bordeaux',
  '59000': 'lille', '59160': 'lille', '59260': 'lille', '59777': 'lille', '59800': 'lille',
  '44000': 'nantes', '44100': 'nantes', '44200': 'nantes', '44300': 'nantes',
  '06000': 'nice', '06100': 'nice', '06200': 'nice', '06300': 'nice',
  '34000': 'montpellier', '34070': 'montpellier', '34080': 'montpellier', '34090': 'montpellier',
  '67000': 'strasbourg', '67100': 'strasbourg', '67200': 'strasbourg',
  '35000': 'rennes', '35200': 'rennes', '35700': 'rennes',
};

export const ZONE_ID_RE = /^(?:[a-z]+(?:-\d{1,2})?|cp-\d{5})$/;

/** Le quartier d'un identifiant : un de la liste, ou une zone par code postal (`cp-38000`). */
export function zoneById(id: string): Zone | null {
  const known = ZONES.find((z) => z.id === id);
  if (known) return known;
  const m = /^cp-(\d{5})$/.exec(id);
  return m ? zoneOfPostalCode(m[1] as string) : null;
}

/**
 * Le quartier d'un code postal français : arrondissement de Paris (75001-75020, 75116), Lyon (69001-69009), Marseille
 * (13001-13016), une ville de la liste, sinon une zone à son code postal. Null si ce n'est pas un code postal.
 */
export function zoneOfPostalCode(raw: string): Zone | null {
  const cp = raw.replace(/\s+/g, '');
  if (!/^\d{5}$/.test(cp) || cp === '00000') return null;
  const n = Number(cp.slice(3));
  if (cp === '75116') return zoneById('paris-16');
  if (cp.startsWith('750') && n >= 1 && n <= 20) return zoneById(`paris-${n}`);
  if (cp.startsWith('6900') && n >= 1 && n <= 9) return zoneById(`lyon-${n}`);
  if (cp.startsWith('130') && n >= 1 && n <= 16) return zoneById(`marseille-${n}`);
  const named = CITY_POSTAL[cp];
  if (named) return zoneById(named);
  return { id: `cp-${cp}`, city: '', district: null, postalCode: cp, country: 'fr', center: null, radiusKm: 0 };
}

/** Le quartier d'une position déjà arrondie (app) : le centre le plus proche dans son rayon, sinon null. */
export function zoneOfPoint(p: GeoPoint): Zone | null {
  let best: { zone: Zone; km: number } | null = null;
  for (const z of ZONES) {
    if (!z.center) continue;
    const km = distanceKm(p, z.center);
    if (km <= z.radiusKm && (!best || km < best.km)) best = { zone: z, km };
  }
  return best?.zone ?? null;
}

export interface ZoneProgress {
  count: number;
  threshold: number;
  /** Personnes qu'il manque (0 si ouvert ou seuil atteint). */
  missing: number;
  open: boolean;
}

export function zoneProgress(count: number, threshold: number, openedAt: string | null): ZoneProgress {
  const c = Math.max(0, Math.floor(count));
  return { count: c, threshold, missing: openedAt ? 0 : Math.max(0, threshold - c), open: openedAt !== null };
}

/** Le quartier doit-il s'ouvrir maintenant (seuil atteint, pas encore ouvert) ? */
export const shouldOpen = (count: number, threshold: number, openedAt: string | null): boolean => openedAt === null && count >= threshold;

export const clampThreshold = (n: number): number => Math.min(MAX_OPEN_THRESHOLD, Math.max(MIN_OPEN_THRESHOLD, Math.round(n)));

/** Une invitation qui a abouti : qui a invité (`u:<compte>` ou `s:<inscription>`) et quand l'invité a confirmé. */
export interface ZoneInvite {
  inviter: string;
  confirmedAt: string;
}

/**
 * Les fondateurs : les premiers inviteurs du quartier, dans l'ordre de leur première invitation confirmée (égalité :
 * l'identifiant), chacun une fois.
 */
export function foundersOf(invites: readonly ZoneInvite[], max = FOUNDERS_PER_ZONE): string[] {
  const first = new Map<string, string>();
  for (const i of invites) {
    const at = first.get(i.inviter);
    if (!at || i.confirmedAt < at) first.set(i.inviter, i.confirmedAt);
  }
  return [...first.entries()]
    .sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[0].localeCompare(b[0])))
    .slice(0, max)
    .map(([k]) => k);
}

/** Code d'invitation d'une inscription au quartier (`N` + 7 caractères, distinct des autres codes). */
export const SIGNUP_CODE_RE = /^N[2-9A-HJ-NP-Z]{7}$/;
export const isSignupCode = (raw: string): boolean => SIGNUP_CODE_RE.test(raw.trim().toUpperCase());

/** Adresse e-mail plausible (la vraie vérification est la confirmation). Normalisée en minuscules. */
export const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();
export const isPlausibleEmail = (raw: string): boolean => /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i.test(raw.trim()) && raw.trim().length <= 254;
