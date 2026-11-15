import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { color, motion, radius, veil } from '../theme';

export interface AxisBarProps {
  /** De −100 à +100, 0 au centre. */
  value: number;
  /** De 0 à 100 : une valeur peu sûre est dessinée plus pâle. Défaut 100. */
  confidence?: number;
  /** Épaisseur. Défaut 8. */
  height?: number;
  color?: string;
  /** Attente avant de se remplir (cascade). */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Barre à deux pôles, remplie depuis le centre (sa vision, son style) : un trait au milieu, la part jaune s'étire
 * vers le pôle (échelle seulement, avec un léger rebond). Décorative : la valeur se dit dans le libellé du parent.
 */
export function AxisBar({ value, confidence = 100, height = 8, color: fill = color.accent, delay = 0, style }: AxisBarProps) {
  const reduced = useReducedMotion();
  const v = Math.max(-100, Math.min(100, value)) / 100;
  const s = useSharedValue(reduced ? Math.abs(v) : 0);
  useEffect(() => {
    s.value = reduced ? fadeTo(Math.abs(v), motion.fast) : withDelay(delay, withSpring(Math.abs(v), springs.pop));
  }, [v, reduced, delay, s]);
  const right = v >= 0;
  const bar = useAnimatedStyle(() => ({ transform: [{ scaleX: s.value }] }));
  const pale = 0.45 + 0.55 * Math.max(0, Math.min(100, confidence)) / 100;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View style={[styles.half, right ? styles.rightHalf : styles.leftHalf]}>
        <Animated.View style={[styles.fill, { backgroundColor: fill, opacity: pale, borderRadius: height / 2, transformOrigin: right ? 'left' : 'right' }, bar]} />
      </View>
      <View style={[styles.mid, { height: height + 8, top: -4 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { alignSelf: 'stretch', backgroundColor: veil.track, flexDirection: 'row' },
  half: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  rightHalf: { left: '50%' },
  leftHalf: { right: '50%' },
  fill: { flex: 1 },
  mid: { position: 'absolute', left: '50%', width: 2, marginLeft: -1, borderRadius: radius.pill, backgroundColor: color.mute },
});
