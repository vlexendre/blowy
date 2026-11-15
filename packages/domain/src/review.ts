/**
 * Monde d'exemple du compte de revue d'Apple (App Review 2.1(a)) : personnes fictives, visibles de ce seul compte,
 * construites pour être compatibles avec lui quoi qu'il ait répondu (sexe, ce qu'il cherche, vision). Pur : l'API
 * écrit les lignes (marquées `review_world`) ; ici, seulement le plan.
 */
import type { Gender, GeoPoint, Seeker, Seeking, VisionAxis, Whom } from './vision';
import { VISION_AXES, clampVision, unitFromSeed } from './vision';
import type { Species } from './pet';

/** Rôle d'une personne fictive dans le monde d'exemple. */
export type ReviewRole =
  /** Lien ouvert avec une conversation (répliques des minimoas de chaque rôle) et l'accord de lecture donné par l'autre. */
  | 'link_active'
  /** Lien en danger : il ne reste que 2 vies. */
  | 'link_danger'
  /** A salué le compte de revue (rencontre à accepter). */
  | 'wave'
  /** Compatible, dans la zone (épingle sur la carte, proposée en rencontre). */
  | 'nearby'
  /** Compatible, au-delà de la zone (compteur « plus loin » de la carte gratuite). */
  | 'farther';

export interface ReviewFixturePlan {
  slot: number;
  role: ReviewRole;
  displayName: string;
  gender: Gender;
  seeking: Seeking;
  whom: Whom | null;
  birthdate: string;
  species: Species;
  petName: string;
  /** Écart de vision avec le compte de revue, axe par axe (un axe plus éloigné : la « différence à explorer »). */
  visionDelta: Readonly<Record<VisionAxis, number>>;
  /** Distance au centre du compte de revue (km) et direction (degrés). */
  distanceKm: number;
  bearing: number;
  /** Personne fictive liée à celle-ci (amis d'amis : proposée même sans position). */
  friendOfSlot: number | null;
}

const NAMES: Readonly<Record<Gender, readonly string[]>> = {
  femme: ['Léa', 'Inès', 'Chloé', 'Jade', 'Zoé', 'Manon', 'Clara', 'Emma'],
  homme: ['Malo', 'Yanis', 'Noé', 'Hugo', 'Tom', 'Lucas', 'Nathan', 'Théo'],
  non_binaire: ['Sasha', 'Charlie', 'Alex', 'Eden', 'Noa', 'Lou', 'Andrea', 'Robin'],
  non_dit: ['Sasha', 'Charlie', 'Alex', 'Eden', 'Noa', 'Lou', 'Andrea', 'Robin'],
};
const PETS: readonly { species: Species; name: string }[] = [
  { species: 'suzie', name: 'Suzie' },
  { species: 'gaston', name: 'Gaston' },
  { species: 'pia', name: 'Pia' },
  { species: 'nino', name: 'Plume' },
  { species: 'suzie', name: 'Mona' },
  { species: 'gaston', name: 'Basile' },
  { species: 'pia', name: 'Olga' },
  { species: 'nino', name: 'Ziggy' },
];
const BIRTHDATES = ['1998-04-12', '1996-09-30', '2000-01-21', '1994-06-02', '1992-02-17', '1999-11-08', '1990-08-23', '1997-03-14'];

const ROLES: readonly { role: ReviewRole; km: number; bearing: number; friendOf: number | null }[] = [
  { role: 'link_active', km: 0.8, bearing: 40, friendOf: null },
  { role: 'link_danger', km: 2.4, bearing: 200, friendOf: null },
  { role: 'wave', km: 0.6, bearing: 300, friendOf: null },
  { role: 'nearby', km: 0.4, bearing: 120, friendOf: 0 },
  { role: 'nearby', km: 1.1, bearing: 250, friendOf: 1 },
  { role: 'farther', km: 4, bearing: 80, friendOf: null },
  { role: 'farther', km: 7, bearing: 160, friendOf: null },
  { role: 'farther', km: 12, bearing: 330, friendOf: null },
];
/** Écarts de vision : proches sur trois ou quatre axes, un axe plus loin (score au-dessus de 80 dans tous les cas). */
const DELTAS: readonly (readonly number[])[] = [
  [8, -10, 5, 12, 40],
  [-12, 6, 35, -8, 10],
  [5, 38, -6, 10, -12],
  [-6, 4, 10, 36, -8],
  [34, -8, 6, -10, 12],
  [10, 12, -36, 6, -4],
  [-8, -30, 10, 8, 6],
  [12, 6, -8, -10, 38],
];

/** Sexe des personnes fictives : ceux que le compte de revue accepte, et variés quand il accepte tout le monde. */
function gendersFor(reviewer: Seeker): readonly Gender[] {
  if (reviewer.seeking !== 'potes' && reviewer.whom === 'femmes') return ['femme'];
  if (reviewer.seeking !== 'potes' && reviewer.whom === 'hommes') return ['homme'];
  return ['femme', 'homme', 'non_binaire', 'femme', 'homme', 'femme', 'homme', 'non_binaire'];
}

/**
 * Plan des 8 personnes fictives, compatibles avec le compte de revue : elles cherchent « les deux » et « tout le
 * monde » (le filtre réciproque passe donc toujours dans leur sens), leur sexe est l'un de ceux que le compte accepte.
 */
export function reviewWorldPlan(reviewer: Seeker): ReviewFixturePlan[] {
  const genders = gendersFor(reviewer);
  const used = new Map<Gender, number>();
  return ROLES.map((r, slot) => {
    const gender = genders[slot % genders.length] ?? 'femme';
    const n = used.get(gender) ?? 0;
    used.set(gender, n + 1);
    const pet = PETS[slot] ?? PETS[0]!;
    const deltas = DELTAS[slot] ?? DELTAS[0]!;
    const visionDelta = Object.fromEntries(VISION_AXES.map((axis, i) => [axis, deltas[i] ?? 0])) as Record<VisionAxis, number>;
    return {
      slot,
      role: r.role,
      displayName: NAMES[gender][n % NAMES[gender].length] ?? 'Sasha',
      gender,
      seeking: 'les_deux',
      whom: 'tout_le_monde',
      birthdate: BIRTHDATES[slot] ?? '1996-01-01',
      species: pet.species,
      petName: pet.name,
      visionDelta,
      distanceKm: r.km,
      bearing: r.bearing,
      friendOfSlot: r.friendOf,
    };
  });
}

/** Vision d'une personne fictive : celle du compte de revue, décalée (bornée à ±100). */
export function fixtureVision(reviewer: Readonly<Record<VisionAxis, number>>, delta: Readonly<Record<VisionAxis, number>>): Record<VisionAxis, number> {
  return Object.fromEntries(
    VISION_AXES.map((axis) => {
      const base = reviewer[axis];
      // Au bord (±100), l'écart part vers l'intérieur : il reste réel.
      const d = Math.abs(base + delta[axis]) > 100 ? -delta[axis] : delta[axis];
      return [axis, clampVision(base + d)];
    }),
  ) as Record<VisionAxis, number>;
}

const M_PER_DEG_LAT = 111_320;

/** Point à `km` de `center` dans la direction `bearing` (degrés, 0 = nord), à plat (petites distances). */
export function offsetPoint(center: GeoPoint, km: number, bearing: number): GeoPoint {
  const rad = (bearing * Math.PI) / 180;
  const dLat = (km * 1000 * Math.cos(rad)) / M_PER_DEG_LAT;
  const dLng = (km * 1000 * Math.sin(rad)) / (M_PER_DEG_LAT * Math.max(0.01, Math.cos((center.lat * Math.PI) / 180)));
  return { lat: Math.round((center.lat + dLat) * 1e6) / 1e6, lng: Math.round((center.lng + dLng) * 1e6) / 1e6 };
}

/** Identifiant stable d'une personne fictive (même monde, même place : même identifiant), au format UUID v4. */
export function reviewFixtureId(world: string, slot: number): string {
  const hex = [0, 1, 2, 3].map((k) => Math.floor(unitFromSeed(`blowy-review|${world}|${slot}|${k}`) * 0x1_0000_0000).toString(16).padStart(8, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Centre par défaut quand le compte de revue n'a ni position ni zone choisie (Paris). */
export const REVIEW_DEFAULT_CENTER: GeoPoint = Object.freeze({ lat: 48.8566, lng: 2.3522 });
