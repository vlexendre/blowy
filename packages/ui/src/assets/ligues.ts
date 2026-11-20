/** Les 5 badges de ligue (Plume → Étoile), générés pour la maquette V7. Metro exige des chemins littéraux. */
import type { LeagueTier } from '@blowy/domain';
import type { Src } from './pets';

const LEAGUE_IMAGES: Record<LeagueTier, Src> = {
  plume: require('../../assets/ligues/plume.webp'),
  pompon: require('../../assets/ligues/pompon.webp'),
  houppette: require('../../assets/ligues/houppette.webp'),
  couronne: require('../../assets/ligues/couronne.webp'),
  etoile: require('../../assets/ligues/etoile.webp'),
};

export const leagueImage = (tier: LeagueTier): Src => LEAGUE_IMAGES[tier];
