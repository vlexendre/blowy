/** Web : pas de carte native, la carte dessinée (mêmes données, mêmes couches). */
import { ZoneMap } from '@blowy/ui';

import type { MapLayerProps } from './MapLayer.types';

export type { MapLayerProps } from './MapLayer.types';

export function MapLayer({ free: _free, onRegionChange: _onRegionChange, ...props }: MapLayerProps) {
  return <ZoneMap {...props} />;
}
