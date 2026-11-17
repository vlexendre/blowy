/**
 * Registre typé des éléments de soin et de décor (packages/ui/assets/misc/*.webp, feutrine, fond transparent) :
 * nourriture, jeux, sieste et bain, habitat, récompenses. Metro exige des chemins littéraux : chaque `require` est écrit
 * en dur.
 */
import type { Src } from './pets';

export const CARE_PROPS = [
  // Nourriture (le gâteau : une gourmandise rare)
  'pomme', 'cookie', 'smoothie', 'gateau_part', 'cereales', 'carotte',
  // Jeux
  'balle', 'peluche', 'toupie', 'cerf_volant', 'bulles', 'pelote',
  // Sieste et bain
  'coussin', 'plaid', 'veilleuse', 'baignoire', 'canard', 'brosse',
  // Habitat et récompenses
  'tapis', 'plante', 'lampe', 'cadre', 'coffre', 'medaille',
] as const;
export type CareProp = (typeof CARE_PROPS)[number];

const PROP_IMAGES: Record<CareProp, Src> = {
  pomme: require('../../assets/misc/pomme.webp'),
  cookie: require('../../assets/misc/cookie.webp'),
  smoothie: require('../../assets/misc/smoothie.webp'),
  gateau_part: require('../../assets/misc/gateau_part.webp'),
  cereales: require('../../assets/misc/cereales.webp'),
  carotte: require('../../assets/misc/carotte.webp'),
  balle: require('../../assets/misc/balle.webp'),
  peluche: require('../../assets/misc/peluche.webp'),
  toupie: require('../../assets/misc/toupie.webp'),
  cerf_volant: require('../../assets/misc/cerf_volant.webp'),
  bulles: require('../../assets/misc/bulles.webp'),
  pelote: require('../../assets/misc/pelote.webp'),
  coussin: require('../../assets/misc/coussin.webp'),
  plaid: require('../../assets/misc/plaid.webp'),
  veilleuse: require('../../assets/misc/veilleuse.webp'),
  baignoire: require('../../assets/misc/baignoire.webp'),
  canard: require('../../assets/misc/canard.webp'),
  brosse: require('../../assets/misc/brosse.webp'),
  tapis: require('../../assets/misc/tapis.webp'),
  plante: require('../../assets/misc/plante.webp'),
  lampe: require('../../assets/misc/lampe.webp'),
  cadre: require('../../assets/misc/cadre.webp'),
  coffre: require('../../assets/misc/coffre.webp'),
  medaille: require('../../assets/misc/medaille.webp'),
};

/** Largeur / hauteur de chaque image (mesurée sur les fichiers). */
export const PROP_RATIO: Record<CareProp, number> = {
  pomme: 375 / 435, cookie: 386 / 359, smoothie: 334 / 477, gateau_part: 404 / 419, cereales: 419 / 402, carotte: 380 / 412,
  balle: 377 / 375, peluche: 357 / 437, toupie: 351 / 375, cerf_volant: 294 / 280, bulles: 392 / 440, pelote: 402 / 368,
  coussin: 455 / 350, plaid: 464 / 350, veilleuse: 348 / 414, baignoire: 476 / 413, canard: 369 / 376, brosse: 406 / 393,
  tapis: 496 / 337, plante: 422 / 438, lampe: 320 / 452, cadre: 414 / 410, coffre: 463 / 378, medaille: 325 / 449,
};

export const propImage = (name: CareProp): Src => PROP_IMAGES[name];

/** Ce que le soin porte vers le minimoa, tour à tour (le gâteau de temps en temps seulement). */
export const FEED_PROPS: readonly CareProp[] = ['pomme', 'cookie', 'smoothie', 'carotte', 'cereales'];
export const FEED_TREAT: CareProp = 'gateau_part';
export const PLAY_PROPS: readonly CareProp[] = ['balle', 'peluche', 'toupie', 'bulles', 'pelote'];

/**
 * L'objet d'un soin pour un tirage `n` (un compteur qui avance à chaque soin) : la nourriture tourne, le gâteau tombe
 * une fois sur sept ; les jeux tournent ; la sieste, le coussin ; le câlin n'a pas d'objet.
 */
export function careProp(action: 'feed' | 'play' | 'nap' | 'cuddle', n: number): CareProp | null {
  const i = Math.abs(Math.floor(n));
  if (action === 'feed') return i % 7 === 6 ? FEED_TREAT : (FEED_PROPS[i % FEED_PROPS.length] ?? 'pomme');
  if (action === 'play') return PLAY_PROPS[i % PLAY_PROPS.length] ?? 'balle';
  if (action === 'nap') return 'coussin';
  return null;
}
