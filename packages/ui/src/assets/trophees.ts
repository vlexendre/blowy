/**
 * Les 18 trophées (6 familles × bronze, argent, or), générés pour la maquette V7. Metro exige des chemins littéraux.
 */
import type { TrophyFamily } from '@blowy/domain';
import type { Src } from './pets';

const TROPHY_IMAGES: Record<TrophyFamily, readonly [Src, Src, Src]> = {
  bonjour: [require('../../assets/trophees/bonjour_bronze.webp'), require('../../assets/trophees/bonjour_argent.webp'), require('../../assets/trophees/bonjour_or.webp')],
  serie: [require('../../assets/trophees/serie_bronze.webp'), require('../../assets/trophees/serie_argent.webp'), require('../../assets/trophees/serie_or.webp')],
  bavard: [require('../../assets/trophees/bavard_bronze.webp'), require('../../assets/trophees/bavard_argent.webp'), require('../../assets/trophees/bavard_or.webp')],
  communs: [require('../../assets/trophees/communs_bronze.webp'), require('../../assets/trophees/communs_argent.webp'), require('../../assets/trophees/communs_or.webp')],
  introspection: [require('../../assets/trophees/introspection_bronze.webp'), require('../../assets/trophees/introspection_argent.webp'), require('../../assets/trophees/introspection_or.webp')],
  explorateur: [require('../../assets/trophees/explorateur_bronze.webp'), require('../../assets/trophees/explorateur_argent.webp'), require('../../assets/trophees/explorateur_or.webp')],
};

/** Image d'un trophée ; `tier` 0 = bronze, 1 = argent, 2 = or. */
export const trophyImage = (family: TrophyFamily, tier: 0 | 1 | 2): Src => TROPHY_IMAGES[family][tier];
