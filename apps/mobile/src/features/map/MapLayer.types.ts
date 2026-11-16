import type { ZoneMapProps } from '@blowy/ui';

export interface MapLayerProps extends ZoneMapProps {
  /** Gratuit : la caméra reste sur la zone. Minimoa+ : on peut glisser et zoomer. */
  free: boolean;
  /** Minimoa+ : la carte a bougé (centre et rayon visibles), pour relire ce qu'il y a là. */
  onRegionChange?: (at: { lat: number; lng: number; radiusKm: number }) => void;
}
