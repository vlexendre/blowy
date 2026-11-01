import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useA11yPrefs } from '../foundations/accessibility';
import { color, radius } from '../foundations/theme';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  fill?: string;
  track?: string;
  height?: number;
  /** Marque « en attente » (hachures absentes en RN : bord pointillé + opacité). */
  pending?: boolean;
}

/** Barre de progression animée (jauges, Lien). Pas d'information par la couleur seule : valeur lue par le parent. */
export function ProgressBar({ value, fill = color.coral, track = color.creamDeep, height = 10, pending }: ProgressBarProps) {
  const { reduceMotion } = useA11yPrefs();
  const w = useSharedValue(0);
  const v = Math.max(0, Math.min(1, value));
  useEffect(() => {
    w.value = reduceMotion ? v : withTiming(v, { duration: 900 });
  }, [v, reduceMotion, w]);
  const anim = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={[styles.track, { height, backgroundColor: track }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View style={[styles.fill, { backgroundColor: fill }, pending && styles.pending, anim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  pending: { opacity: 0.55, borderWidth: 1, borderStyle: 'dashed', borderColor: color.ink },
});
