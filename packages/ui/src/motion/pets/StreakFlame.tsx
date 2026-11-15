import { useEffect, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Icon } from '../../atoms/Icon';
import { hapticFor } from '../../lib/haptics';
import { ease, fadeTo, springs, useLoop, useReducedMotion } from '../../lib/motion';
import { motion } from '../../theme';
import { Burst } from '../Burst';

export interface StreakFlameProps {
  /** Série en cours (jours). 0 : la mèche est éteinte (rien n'est dessiné). */
  streak: number;
  /** Côté de la flamme pour une série longue (100 jours) ; une série courte est plus petite. Défaut 64. */
  size?: number;
  /** Défi du jour pas encore fait : la flamme brûle plus bas (sans alarme). Défaut faux. */
  low?: boolean;
  /**
   * À changer pour rallumer la mèche (défi fait, palier) : elle part d'une braise, jaillit au-dessus de sa taille,
   * crépite d'étincelles puis se pose. Animations réduites : simple fondu.
   */
  igniteKey?: string | number | null;
  /** Vibration à l'allumage. Défaut vrai. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Taille relative de la flamme : 62 % à 1 jour, pleine à 100 jours (croissance lente, logarithmique). */
export function flameScale(streak: number): number {
  if (streak <= 0) return 0;
  return 0.62 + 0.38 * Math.min(1, Math.log(1 + streak) / Math.log(101));
}

/**
 * La mèche du minimoa qui brûle (V7 §7) : une flamme posée sur le haut de sa tête, qui grandit avec la série et
 * vacille doucement (boucle en pause hors écran). Elle se pose dans `PetActor` / `PetStage` via `crest` (elle suit
 * alors le corps), ou seule. Purement décorative : la série se lit ailleurs, en chiffres.
 */
export function StreakFlame({ streak, size = 64, low = false, igniteKey = null, haptic = true, style }: StreakFlameProps) {
  const reduced = useReducedMotion();
  const target = flameScale(streak) * (low ? 0.82 : 1);
  const grow = useSharedValue(target);
  const glow = useSharedValue(low ? 0.72 : 1);
  const flick = useLoop(motion.breath, streak > 0, 0);
  const [sparks, setSparks] = useState(0);
  const lastKey = useRef(igniteKey);

  useEffect(() => {
    glow.value = fadeTo(low ? 0.72 : 1, motion.slow);
    if (lastKey.current !== igniteKey && igniteKey !== null) {
      lastKey.current = igniteKey;
      if (haptic) hapticFor('success');
      if (reduced) {
        grow.value = withSequence(withTiming(0, { duration: 0 }), fadeTo(target, motion.base));
        return;
      }
      setSparks((n) => n + 1);
      grow.value = withSequence(
        withTiming(0.15, { duration: 0 }),
        withDelay(80, withTiming(target * 1.35, { duration: 320, easing: ease.out })),
        withSpring(target, springs.plush),
      );
      return;
    }
    grow.value = reduced ? target : withSpring(target, springs.pop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, igniteKey, reduced, low]);

  const flame = useAnimatedStyle(() => {
    const f = flick.value;
    return {
      opacity: glow.value * (grow.value > 0 ? 1 : 0),
      transform: [{ scale: grow.value }, { scaleY: 1 + 0.08 * f }, { scaleX: 1 - 0.04 * f }, { rotate: `${(f - 0.5) * 6}deg` }],
    };
  });

  if (streak <= 0) return null;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width: size, height: size }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.origin, flame]}>
        <Icon name="flamme" size={size} />
      </Animated.View>
      {reduced ? null : <Burst kind="sparkles" trigger={sparks} count={6} spread={size * 0.9} size={size * 0.16} seed={`flame:${String(igniteKey)}`} style={[styles.burst, { left: size / 2, top: size * 0.35 }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  // La flamme pousse depuis sa base (la mèche), pas depuis son centre.
  origin: { transformOrigin: '50% 92%' },
  burst: { position: 'absolute' },
});
