import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Text } from '../atoms/Text';
import { ease, fadeTo, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { PopIn } from '../motion/PopIn';
import { alpha, color, motion, radius, space, veil } from '../theme';

export interface StepProgressProps {
  /** Étape courante, à partir de 1. */
  step: number;
  total: number;
  /** Étape courante en cours : son segment est jaune à 45 % (quiz de V6-Caractere). */
  pending?: boolean;
  /** Affiche « 1 / 4 » à droite. Défaut vrai. */
  showCount?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Avancement de l'inscription : segments jaunes + compteur. À l'arrivée sur une étape, son segment se remplit de
 * gauche à droite et le compteur fait « pop » ; revenir en arrière le vide. Animations réduites : fondu.
 */
export function StepProgress({ step, total, pending, showCount = true, accessibilityLabel, style }: StepProgressProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `${step} / ${total}`}
      accessibilityValue={{ min: 1, max: total, now: step }}
      style={[layout.row, styles.base, style]}
    >
      <View style={[layout.row, layout.grow, styles.segments]}>
        {Array.from({ length: total }, (_, i) => (
          <Segment key={i} done={i < step - 1 || (i === step - 1 && !pending)} current={i === step - 1 && !!pending} before={i < step - 1} />
        ))}
      </View>
      {showCount ? (
        <PopIn trigger={step} onMount={false} style={styles.count}>
          <Text variant="bodyHeavy" size={12} style={styles.countText}>{`${step} / ${total}`}</Text>
        </PopIn>
      ) : null}
    </View>
  );
}

/** Segment : piste blanche à 16 %, « en cours » jaune à 45 %, rempli en jaune (`scaleX` depuis la gauche). */
function Segment({ done, current, before }: { done: boolean; current: boolean; before: boolean }) {
  const reduced = useReducedMotion();
  // Les étapes déjà passées sont pleines d'emblée ; celle où l'on arrive se remplit.
  const fill = useSharedValue(before ? 1 : 0);
  const half = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      fill.value = fadeTo(done ? 1 : 0, motion.fast);
      half.value = fadeTo(current ? 1 : 0, motion.fast);
      return;
    }
    fill.value = withDelay(done ? 180 : 0, withTiming(done ? 1 : 0, { duration: done ? motion.slow : motion.base, easing: ease.out }));
    half.value = withDelay(current ? 180 : 0, withTiming(current ? 1 : 0, { duration: motion.base, easing: ease.out }));
  }, [done, current, reduced, fill, half]);
  const fillStyle = useAnimatedStyle(() => (reduced ? { opacity: fill.value } : { transform: [{ scaleX: fill.value }] }));
  const halfStyle = useAnimatedStyle(() => (reduced ? { opacity: half.value } : { transform: [{ scaleX: half.value }] }));
  return (
    <View style={styles.seg}>
      {/* Sur fond nuit, comme la maquette (et non par-dessus la piste blanche). */}
      <Animated.View style={[styles.layer, { backgroundColor: color.night }, halfStyle]}>
        <View style={[styles.layer, { backgroundColor: CURRENT }]} />
      </Animated.View>
      <Animated.View style={[styles.layer, { backgroundColor: color.accent }, fillStyle]} />
    </View>
  );
}

/** Segment à venir : blanc à 16 % (maquettes). */
const OFF = alpha(color.white, 0.16);
const CURRENT = alpha(color.accent, 0.45);

const styles = StyleSheet.create({
  base: { gap: space.md },
  segments: { gap: 5 },
  seg: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: OFF, overflow: 'hidden' },
  layer: { ...StyleSheet.absoluteFill, borderRadius: radius.pill, transformOrigin: 'left' },
  count: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: veil.track },
  countText: { lineHeight: 16 },
});
