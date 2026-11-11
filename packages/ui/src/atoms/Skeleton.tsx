import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useLoop } from '../lib/motion';
import { radius as radii, veil } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** Rayon (`tokens.radius`) ou `circle`. Défaut `sm`. */
  radius?: keyof typeof radii | 'circle';
  style?: StyleProp<ViewStyle>;
}

/** Bloc de chargement qui pulse doucement (fixe si « réduire les animations »). */
export function Skeleton({ width = '100%', height = 16, radius = 'sm', style }: SkeletonProps) {
  const t = useLoop(800);
  const pulse = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [0, 1], [0.55, 1]) }));
  const r = radius === 'circle' ? height / 2 : radii[radius];
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: r, backgroundColor: veil.glass }, pulse, style]}
    />
  );
}
