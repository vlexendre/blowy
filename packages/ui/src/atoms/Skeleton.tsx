import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';

import { Shimmer } from '../motion/Shimmer';
import { radius as radii } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** Rayon (`tokens.radius`) ou `circle`. Défaut `sm`. */
  radius?: keyof typeof radii | 'circle';
  /** Décalage du reflet (ms) pour désynchroniser des blocs voisins. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** Bloc de chargement : un reflet glisse dessus (`Shimmer`) ; fixe si « réduire les animations » ou hors écran. */
export function Skeleton({ width = '100%', height = 16, radius = 'sm', delay, style }: SkeletonProps) {
  const r = radius === 'circle' ? height / 2 : radii[radius];
  return <Shimmer width={width} height={height} radius={r} delay={delay} style={style} />;
}
