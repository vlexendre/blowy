import type { MapPoint, ZoneMapProps } from '@blowy/ui';

export interface MapLayerProps extends ZoneMapProps {
  /** Gratuit : la caméra reste sur la zone. Minimoa+ : on peut glisser et zoomer. */
  free: boolean;
  /** Minimoa+ : la carte a bougé (centre et rayon visibles), pour relire ce qu'il y a là. */
  onRegionChange?: (at: { lat: number; lng: number; radiusKm: number }) => void;
  /** Où placer « toi » : le centre de ta zone (Minimoa+ peut regarder ailleurs ; toi, tu restes chez toi). Défaut : `center`. */
  mePosition?: MapPoint;
  /**
   * Change → la caméra revient sur la zone (`center`, `radiusKm`), en entier, avec une animation douce. Elle y revient
   * aussi d'elle-même quand la zone change (ville choisie, retour à sa zone) et à l'ouverture.
   */
  focusKey?: number;
  /** Zones sûres de l'écran (la marge de la carte d'Apple les compte déjà). */
  safeTop?: number;
  safeBottom?: number;
  /** Faux tant que l'en-tête et le pied ne sont pas mesurés : la caméra attend pour se caler. Défaut vrai. */
  measured?: boolean;
  /** Plusieurs personnes dans le même coin : libellé lu du groupe. */
  clusterA11y?: (count: number) => string;
  /** Toucher un groupe : par défaut on zoome dessus ; donné (gratuit), c'est cette action à la place. */
  onClusterPress?: () => void;
}
