import type { Mood, Species } from '@blowy/domain';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import type { PetPose } from '../../assets/pets';
import { PetImage } from '../../atoms/PetImage';
import { hapticFor } from '../../lib/haptics';
import { ease, fadeTo, springs, useReducedMotion } from '../../lib/motion';
import { motion } from '../../theme';
import { Burst, type BurstKind } from '../Burst';

/** Ce que fait le pet une fois sorti : cligner des yeux, regarder autour de lui, ou rien. */
export type PetRiseGesture = 'blink' | 'look' | 'none';

export interface PetRiseProps {
  species: Species;
  /** Vrai : il monte du bord bas de l'écran ; repassé à faux, il redescend s'y cacher. */
  up: boolean;
  /** Largeur du pet (pt). Défaut : déduite de `reach`. */
  size?: number;
  /** Part de la hauteur de l'écran qu'il occupe une fois sorti (sans `size`). Défaut 0,4 ; 1,1 × la largeur au plus. */
  reach?: number;
  /** Pose (buste). Défaut `neutre`. */
  mood?: Mood | PetPose;
  /** Geste joué une fois sorti. Défaut `blink`. */
  gesture?: PetRiseGesture;
  /** Attente entre l'arrivée et le geste (ms). Défaut 380. */
  gestureDelay?: number;
  /** Part du buste cachée sous le bord (0 à 0,8). Défaut 0,14. */
  sink?: number;
  /** Décalage horizontal depuis le centre (pt). */
  x?: number;
  /** Inclinaison (degrés). */
  tilt?: number;
  /** À incrémenter : petit bond de joie (réaction à une réponse). */
  hopKey?: number;
  /** Petite explosion au-dessus de sa tête quand il se pose (et à chaque `hopKey`). */
  celebrate?: BurstKind;
  accessibilityLabel?: string;
}

/** Le buste s'arrête à 84 % de sa toile (bas coupé) : la coupe reste sous le bord de l'écran. */
const BUST_END = 0.84;
/**
 * Montée : un seul petit dépassement (≈ 7 %), jamais assez pour montrer la coupe du buste au-dessus du bord
 * (le ressort `plush` dépasserait de ≈ 40 % sur une telle distance).
 */
const RISE = { damping: 16, stiffness: 150, mass: 1 } as const;

/**
 * Grand pet qui sort du bord bas de l'écran, rogné par ce bord : il monte en ressort, cligne des yeux ou regarde autour
 * de lui, puis redescend quand `up` repasse à faux. Décor : ne capte aucun toucher (`pointerEvents="none"`) ; à placer
 * dans un calque plein écran (`StageTemplate` → `stage`). Le clin d'œil passe par l'image « dodo » posée par-dessus
 * (opacité seulement, montée d'avance : rien à charger au moment de cligner). Animations réduites : fondus.
 */
export function PetRise({ species, up, size, reach = 0.4, mood = 'neutre', gesture = 'blink', gestureDelay = 380, sink = 0.14, x = 0, tilt = 0, hopKey, celebrate, accessibilityLabel }: PetRiseProps) {
  const [pop, setPop] = useState(0);
  const reduced = useReducedMotion();
  const win = useWindowDimensions();
  // Partie visible = toile × (1 − bas transparent − part enfoncée) : on en déduit la largeur.
  const visible = 1 - (1 - BUST_END) - BUST_END * sink;
  const w = Math.round(size ?? Math.min(win.width * 1.1, (reach * win.height * 0.9) / visible));
  const h = Math.round(w / 0.9);
  const away = h;
  const y = useSharedValue(away);
  const o = useSharedValue(reduced ? 0 : 1);
  const blink = useSharedValue(0);
  const turn = useSharedValue(0);
  const sy = useSharedValue(1);
  const was = useRef(false);

  useEffect(() => {
    if (reduced) {
      y.value = 0;
      o.value = fadeTo(up ? 1 : 0, motion.base);
      was.current = up;
      return;
    }
    o.value = 1;
    let landed: ReturnType<typeof setTimeout> | undefined;
    if (up && celebrate) landed = setTimeout(() => setPop((n) => n + 1), 300);
    if (up) {
      y.value = withSequence(withTiming(away, { duration: 0 }), withSpring(0, RISE));
      sy.value = withSequence(withTiming(1.05, { duration: 0 }), withDelay(260, withSequence(withTiming(0.95, { duration: 90, easing: ease.out }), withSpring(1, springs.plush))));
      if (gesture === 'blink') {
        // Deux battements rapprochés, comme un vrai clin d'œil de peluche.
        blink.value = withDelay(
          gestureDelay,
          withSequence(
            withTiming(1, { duration: 50 }),
            withDelay(70, withTiming(0, { duration: 60 })),
            withDelay(140, withTiming(1, { duration: 50 })),
            withDelay(60, withTiming(0, { duration: 60 })),
          ),
        );
      } else if (gesture === 'look') {
        turn.value = withDelay(
          gestureDelay,
          withSequence(
            withTiming(-1, { duration: 220, easing: ease.inOut }),
            withDelay(120, withTiming(1, { duration: 300, easing: ease.inOut })),
            withDelay(100, withSpring(0, springs.pop)),
          ),
        );
      }
    } else if (was.current) {
      blink.value = 0;
      turn.value = withTiming(0, { duration: motion.fast });
      y.value = withTiming(away, { duration: 280, easing: ease.in });
    }
    was.current = up;
    return () => clearTimeout(landed);
  }, [up, reduced, away, gesture, gestureDelay, celebrate, y, o, blink, turn, sy]);

  const lastHop = useRef(hopKey);
  useEffect(() => {
    if (hopKey === undefined || hopKey === lastHop.current) return;
    lastHop.current = hopKey;
    if (reduced) return;
    hapticFor('land');
    if (celebrate) setPop((n) => n + 1);
    y.value = withSequence(withTiming(-h * 0.08, { duration: 150, easing: ease.out }), withSpring(0, springs.plush));
    sy.value = withSequence(withTiming(1.06, { duration: 150, easing: ease.out }), withTiming(0.93, { duration: 110 }), withSpring(1, springs.plush));
  }, [hopKey, reduced, h, y, sy]);

  const body = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [
      { translateX: x + turn.value * w * 0.035 },
      { translateY: y.value },
      { rotate: `${tilt + turn.value * 6}deg` },
      { scaleY: sy.value },
    ],
  }));
  const shut = useAnimatedStyle(() => ({ opacity: blink.value }));
  // Le buste se pose sous le bord : sa coupe (84 % de la toile) et une part `sink` de son corps sont hors écran.
  const bottom = -Math.round(h * (1 - BUST_END) + h * BUST_END * sink);
  return (
    <View
      pointerEvents="none"
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      style={[styles.dock, { bottom }]}
    >
      <Animated.View style={[styles.feet, { width: w, height: h }, body]}>
        <PetImage species={species} mood={mood} size={w} />
        <Animated.View style={[StyleSheet.absoluteFill, shut]}>
          <PetImage species={species} mood="dodo" size={w} />
        </Animated.View>
        {celebrate ? <Burst kind={celebrate} trigger={pop} seed={species} spread={w * 0.45} style={[styles.burst, { left: w / 2, top: h * 0.12 }]} /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  feet: { transformOrigin: '50% 100%' },
  burst: { position: 'absolute' },
});
