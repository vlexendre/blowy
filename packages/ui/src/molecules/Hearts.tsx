import { MAX_LIVES } from '@blowy/domain';
import { useEffect, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { hapticFor } from '../lib/haptics';
import { useInk } from '../lib/ink';
import { ease, fadeTo, springs, useMotionActive, useReducedMotion } from '../lib/motion';
import { extra, motion, size as sizes } from '../theme';

export interface HeartsProps {
  /** Vies restantes. */
  lives: number;
  max?: number;
  /** Taille d'un cœur. Défaut 14. */
  size?: number;
  /** Lien fantôme : tous les cœurs éteints. */
  ghost?: boolean;
  /**
   * Vies montrées au premier rendu, avant d'aller vers `lives` (ex. 0 après « ranimer » : les cœurs reviennent un à
   * un). Défaut : `lives` (aucune animation à l'apparition).
   */
  from?: number;
  /** Vie en danger : le dernier cœur allumé bat (deux battements, une pause), tant que l'écran est visible. */
  beat?: boolean;
  /** Libellé lu (« 5 vies sur 7 ») ; défaut « 5/7 ». */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** `clip-path` des cœurs de la maquette (`.hearts i`, 14 × 13). */
const HEART = 'M7 13 C2 9 0 6.5 0 4 A3.6 3.6 0 0 1 7 2.6 A3.6 3.6 0 0 1 14 4 C14 6.5 12 9 7 13 Z';
const OFF = 0.2;
/** Décalage entre deux cœurs qui reviennent. */
const RETURN_STEP = 110;

/**
 * Les vies d'un lien : n cœurs pleins sur 7, les perdus estompés.
 * Un cœur perdu se brise (deux moitiés qui tombent) ; un cœur regagné revient en « pop », un par un.
 */
export function Hearts({ lives, max = MAX_LIVES, size = sizes.heart, ghost, from, beat, accessibilityLabel, style }: HeartsProps) {
  const ink = useInk();
  const clamp = (n: number) => Math.max(0, Math.min(max, n));
  const on = clamp(ghost ? 0 : lives);
  // Vies du rendu précédent : point de départ des cœurs qui changent.
  const prev = useRef(from === undefined ? on : clamp(from));
  const before = prev.current;
  useEffect(() => {
    prev.current = on;
  }, [on]);
  const h = (size * 13) / 14;
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? `${on}/${max}`} style={[styles.row, { gap: Math.max(2, Math.round(size / 5)) }, style]}>
      {Array.from({ length: max }, (_, i) => (
        <Heart
          key={i}
          lit={i < on}
          was={i < before}
          // Regagnés : de gauche à droite ; perdus : du dernier au premier.
          order={i < on ? i - before : before - 1 - i}
          last={i === on - 1}
          returning={on - before}
          beat={!!beat && i === on - 1}
          size={size}
          height={h}
          ink={ink}
        />
      ))}
    </View>
  );
}

function Heart({
  lit,
  was,
  order,
  last,
  returning,
  beat,
  size,
  height,
  ink,
}: {
  lit: boolean;
  was: boolean;
  order: number;
  last: boolean;
  returning: number;
  beat: boolean;
  size: number;
  height: number;
  ink: string;
}) {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const s = useSharedValue(1);
  const o = useSharedValue(was ? 1 : OFF);
  const [breaking, setBreaking] = useState(0);
  const beating = useRef(false);

  // Allumé / éteint : pop au retour, brisure au départ.
  useEffect(() => {
    if (lit === was) return;
    const delay = Math.max(0, order) * RETURN_STEP;
    if (lit) {
      if (reduced) {
        o.value = withDelay(delay, fadeTo(1, motion.fast));
        return;
      }
      o.value = withDelay(delay, withTiming(1, { duration: motion.instant }));
      s.value = withDelay(delay, withSequence(withTiming(0.3, { duration: 0 }), withTiming(1.3, { duration: motion.fast, easing: ease.out }), withSpring(1, springs.pop)));
      const t = setTimeout(() => hapticFor(last && returning > 1 ? 'success' : 'select'), delay);
      return () => clearTimeout(t);
    }
    // Perdu : le cœur plein disparaît, ses deux moitiés tombent ; il reste le cœur éteint.
    if (reduced) {
      o.value = fadeTo(OFF, motion.base);
      return;
    }
    o.value = withDelay(delay, withTiming(OFF, { duration: motion.instant }));
    const t = setTimeout(() => setBreaking((n) => n + 1), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lit]);

  // Battement (vie en danger) : « boum-boum », pause ; en pause hors écran, rien si animations réduites.
  useEffect(() => {
    if (!beat || reduced || !active) {
      // Ne coupe que son propre battement (pas un « pop » de retour en cours).
      if (beating.current) {
        cancelAnimation(s);
        s.value = withTiming(1, { duration: motion.fast });
      }
      beating.current = false;
      return;
    }
    beating.current = true;
    const up = (to: number, d: number) => withTiming(to, { duration: d, easing: ease.out });
    s.value = withRepeat(withSequence(up(1.28, 110), up(1, 120), up(1.18, 100), up(1, 160), withTiming(1, { duration: 1100 })), -1);
    return () => cancelAnimation(s);
  }, [beat, reduced, active, s]);

  const animated = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <View style={{ width: size, height }}>
      <Animated.View style={animated}>
        <Svg width={size} height={height} viewBox="0 0 14 13">
          <Path d={HEART} fill={lit ? extra.heart : ink} />
        </Svg>
      </Animated.View>
      {breaking ? <Broken key={breaking} size={size} height={height} onDone={() => setBreaking(0)} /> : null}
    </View>
  );
}

/** Une moitié du cœur brisé : petite fêlure (écart de 1 pt), puis chute en arc en tournant. */
function halfStyle(p: number, side: -1 | 1, size: number) {
  'worklet';
  const crack = Math.min(1, p / 0.18);
  const fall = Math.max(0, (p - 0.18) / 0.82);
  return {
    opacity: 1 - fall,
    transform: [
      { translateX: side * (crack + fall * size * 0.35) },
      { translateY: fall * fall * size * 0.9 - Math.sin(fall * Math.PI) * size * 0.15 },
      { rotate: `${side * (crack * 8 + fall * 28)}deg` },
    ],
  };
}

/** Cœur brisé : les deux moitiés s'écartent en tournant, tombent et s'effacent. */
function Broken({ size, height, onDone }: { size: number; height: number; onDone: () => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 620, easing: ease.in });
    const id = setTimeout(onDone, 660);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const left = useAnimatedStyle(() => halfStyle(t.value, -1, size));
  const right = useAnimatedStyle(() => halfStyle(t.value, 1, size));
  const w = size / 2;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.row]}>
      <Animated.View style={[styles.half, { width: w, height, transformOrigin: '100% 100%' }, left]}>
        <Svg width={size} height={height} viewBox="0 0 14 13">
          <Path d={HEART} fill={extra.heart} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.half, { width: w, height, transformOrigin: '0% 100%' }, right]}>
        <Svg width={size} height={height} viewBox="0 0 14 13" style={{ marginLeft: -w }}>
          <Path d={HEART} fill={extra.heart} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  half: { overflow: 'hidden' },
});
