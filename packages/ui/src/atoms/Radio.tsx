import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { color, extra, motion, radius } from '../theme';

export interface RadioProps {
  selected: boolean;
}

/**
 * Bouton radio des maquettes (`.rad`) : anneau de 22, jaune et pastille pleine quand choisi. Décoratif : la ligne
 * porte le rôle. La pastille arrive en « pop » et l'anneau passe au jaune en fondu (fondu seul si animations réduites).
 */
export function Radio({ selected }: RadioProps) {
  const reduced = useReducedMotion();
  const s = useSharedValue(selected ? 1 : 0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) s.value = fadeTo(selected ? 1 : 0, motion.fast);
    else s.value = selected ? withSpring(1, springs.pop) : withTiming(0, { duration: motion.instant });
  }, [selected, reduced, s]);
  const dot = useAnimatedStyle(() => ({ opacity: Math.min(1, s.value * 2), transform: [{ scale: reduced ? 1 : s.value }] }));
  const ring = useAnimatedStyle(() => ({ opacity: Math.min(1, s.value) }));
  return (
    <View accessible={false} style={styles.ring}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.ringOn, ring]} />
      <Animated.View style={[styles.dot, dot]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, borderColor: extra.radioOff, alignItems: 'center', justifyContent: 'center' },
  // Anneau jaune posé sur l'anneau éteint (même bord), pour le fondu.
  ringOn: { margin: -2, borderRadius: radius.pill, borderWidth: 2, borderColor: color.accent },
  // `radial-gradient(circle, #FFB800 0 45%, transparent 50%)` sur 18 pt intérieurs : ≈ 11 pt.
  dot: { width: 11, height: 11, borderRadius: radius.pill, backgroundColor: color.accent },
});
