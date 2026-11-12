import { useEffect } from 'react';
import { type SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useReducedMotion } from '../lib/motion';

/** Ressort de l'indicateur d'onglet : file, dépasse à peine, se pose. */
const SPRING = { damping: 19, stiffness: 230, mass: 0.8 } as const;

export interface Indicator {
  /** Position animée, en rang d'onglet (0, 1, 2… avec les valeurs intermédiaires pendant la course). */
  pos: SharedValue<number>;
  /** Rang visé. */
  target: SharedValue<number>;
}

/** Position d'un indicateur glissant (pilule d'onglet) qui suit `index` en ressort ; saut direct si animations réduites. */
export function useIndicator(index: number): Indicator {
  const reduced = useReducedMotion();
  const pos = useSharedValue(index);
  const target = useSharedValue(index);
  useEffect(() => {
    target.value = index;
    pos.value = reduced ? index : withSpring(index, SPRING);
  }, [index, reduced, pos, target]);
  return { pos, target };
}

/**
 * Style de la pilule : glisse de `step` pt par rang et s'étire pendant sa course (jusqu'à `stretch`, 12 % par défaut).
 * `step` = largeur d'un onglet + écart.
 */
export function useIndicatorStyle({ pos, target }: Indicator, step: number, stretch = 0.12) {
  return useAnimatedStyle(() => {
    const away = Math.min(1, Math.abs(target.value - pos.value));
    return { transform: [{ translateX: pos.value * step }, { scaleX: 1 + away * stretch }] };
  }, [step, stretch, pos, target]);
}

/** Opacité de l'encre « active » d'un onglet selon la distance de la pilule (fondu croisé pendant la course). */
export function useActiveInk({ pos }: Indicator, index: number) {
  const on = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - Math.abs(pos.value - index) * 1.6) }), [index, pos]);
  const off = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.abs(pos.value - index) * 1.6) }), [index, pos]);
  return { on, off };
}
