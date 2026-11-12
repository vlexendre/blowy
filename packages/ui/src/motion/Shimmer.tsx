import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { type DimensionValue, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { useMotionActive, useReducedMotion } from '../lib/motion';
import { alpha, color, veil } from '../theme';

export interface ShimmerProps {
  width?: DimensionValue;
  height?: number;
  /** Rayon en points. */
  radius?: number;
  /** Fond du bloc. Défaut voile blanc 10 %. */
  base?: string;
  /** Reflet qui passe. Défaut blanc 9 %. */
  shine?: string;
  /** Durée d'un passage (ms). Défaut 1300. */
  duration?: number;
  /** Décalage du premier passage (ms) pour désynchroniser plusieurs blocs. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** Largeur du reflet relative au bloc. */
const BAND = 0.6;

/**
 * Bloc de chargement avec un reflet qui glisse (squelettes). La boucle s'arrête hors écran ;
 * avec animations réduites, le bloc reste fixe.
 */
export function Shimmer({
  width = '100%',
  height = 16,
  radius = 8,
  base = veil.glass,
  shine = alpha(color.white, 0.09),
  duration = 1300,
  delay = 0,
  style,
}: ShimmerProps) {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const w = useSharedValue(0);
  const t = useSharedValue(0);
  const run = active && !reduced;
  useEffect(() => {
    if (!run) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, false));
    return () => cancelAnimation(t);
  }, [run, duration, delay, t]);
  const band = useAnimatedStyle(() => {
    const span = w.value * (1 + BAND);
    return { opacity: run ? 1 : 0, transform: [{ translateX: -w.value * BAND + t.value * span }] };
  });
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => {
        w.value = e.nativeEvent.layout.width;
      }}
      style={[{ width, height, borderRadius: radius, backgroundColor: base, overflow: 'hidden' }, style]}
    >
      <Animated.View pointerEvents="none" style={[styles.band, { width: `${BAND * 100}%` }, band]}>
        <LinearGradient
          colors={[alpha(color.white, 0), shine, alpha(color.white, 0)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, bottom: 0, left: 0 },
});
