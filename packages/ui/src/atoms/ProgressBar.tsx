import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useAnimatedNumber } from '../lib/motion';
import { color, motion, radius, veil } from '../theme';

export interface ProgressBarProps {
  /** Avancement de 0 à 1. */
  value: number;
  color?: string;
  trackColor?: string;
  /** Épaisseur. Défaut 10. */
  height?: number;
  /** Se remplit depuis 0 à l'apparition. Défaut vrai. */
  fillOnMount?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Barre d'avancement (xp avant le niveau suivant) : le remplissage glisse (transformations seulement) avec un léger
 * dépassement avant de se poser ; il part de 0 à l'apparition. Saut direct si animations réduites.
 */
export function ProgressBar({
  value,
  color: fill = color.accent,
  trackColor = veil.track,
  height = 10,
  fillOnMount = true,
  accessibilityLabel,
  style,
}: ProgressBarProps) {
  const ratio = Math.max(0, Math.min(1, value));
  const v = useAnimatedNumber(ratio, { duration: motion.slow, overshoot: 0.06, from: fillOnMount ? 0 : undefined });
  const w = useSharedValue(0);
  const bar = useAnimatedStyle(() => ({ opacity: w.value > 0 ? 1 : 0, transform: [{ translateX: (Math.min(1.02, v.value) - 1) * w.value }] }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      onLayout={(e) => {
        w.value = e.nativeEvent.layout.width;
      }}
      style={[styles.track, { height, backgroundColor: trackColor }, style]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fill }, bar]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: '100%', width: '100%', borderRadius: radius.pill },
});
