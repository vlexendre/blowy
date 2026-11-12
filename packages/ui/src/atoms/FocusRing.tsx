import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { alpha, color, motion, size } from '../theme';

export interface FocusRingProps {
  /** Le champ a le focus (et pas d'erreur). */
  on: boolean;
  /** Rayon du cadre du champ. */
  radius: number;
}

const HALO = 3;

/**
 * Le champ « s'allume » au focus : bordure jaune en fondu par-dessus la bordure de repos, et un halo qui se pose
 * en se resserrant autour du cadre. À placer en dernier enfant du cadre (position absolue, ne capte rien).
 * Animations réduites : fondu de la bordure seul.
 */
export function FocusRing({ on, radius }: FocusRingProps) {
  const reduced = useReducedMotion();
  const lit = useSharedValue(on ? 1 : 0);
  const halo = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      lit.value = fadeTo(on ? 1 : 0, motion.fast);
      halo.value = 0;
      return;
    }
    lit.value = withTiming(on ? 1 : 0, { duration: on ? motion.fast : motion.instant, easing: ease.out });
    halo.value = on ? withSpring(1, springs.soft) : withTiming(0, { duration: motion.instant });
  }, [on, reduced, lit, halo]);
  const border = useAnimatedStyle(() => ({ opacity: lit.value }));
  const glow = useAnimatedStyle(() => ({ opacity: halo.value * 0.9, transform: [{ scaleX: 1.04 - 0.04 * halo.value }, { scaleY: 1.12 - 0.12 * halo.value }] }));
  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.halo, { borderRadius: radius + HALO }, glow]} />
      <Animated.View pointerEvents="none" style={[styles.border, { borderRadius: radius }, border]} />
    </>
  );
}

const styles = StyleSheet.create({
  // Le cadre a déjà sa bordure de repos (1 pt) : la bordure allumée la recouvre exactement.
  border: { position: 'absolute', top: -size.border, left: -size.border, right: -size.border, bottom: -size.border, borderWidth: size.border, borderColor: color.accent },
  halo: {
    position: 'absolute',
    top: -size.border - HALO,
    left: -size.border - HALO,
    right: -size.border - HALO,
    bottom: -size.border - HALO,
    borderWidth: HALO,
    borderColor: alpha(color.accent, 0.22),
  },
});
