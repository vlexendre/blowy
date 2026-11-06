/** Squelette `.sk` (chargement) : dégradé sable 400 px, rayon 14 ; animation shimmer coupée en mouvement réduit. */
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { v5, v5Gradient } from '../foundations/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height, radius = 14, style }: SkeletonProps) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width, height, borderRadius: radius, backgroundColor: v5.sand, backgroundImage: v5Gradient.skeleton, backgroundSize: '400px 100%' }, style]} />;
}
