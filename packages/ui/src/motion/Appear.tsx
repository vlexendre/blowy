import { Children, isValidElement, type ReactNode, useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { ease, fadeTo, useReducedMotion } from '../lib/motion';
import { motion } from '../theme';

export type AppearFrom = 'below' | 'above' | 'left' | 'right' | 'none';

export interface AppearProps {
  children?: ReactNode;
  /** Attente avant l'entrée (ms). */
  delay?: number;
  /** Côté d'où l'élément arrive. Défaut `below` (monte de `distance`). */
  from?: AppearFrom;
  /** Distance parcourue (pt). Défaut 12. */
  distance?: number;
  /** Échelle de départ. Défaut 0,98. */
  scale?: number;
  /** Durée (ms). Défaut `motion.base`. */
  duration?: number;
  /**
   * Clé unique de l'élément : il ne s'anime qu'à sa toute première apparition dans la session
   * (une ligne recyclée ou remontée en défilant arrive sans animation).
   */
  once?: string;
  /** Changer cette valeur rejoue l'entrée (ex. l'onglet affiché). */
  replay?: string | number;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

/** Clés déjà apparues (listes) : partagées par toute l'app, bornées. */
const SEEN = new Set<string>();
const SEEN_MAX = 2000;
function markSeen(key: string): boolean {
  if (SEEN.has(key)) return true;
  if (SEEN.size > SEEN_MAX) SEEN.clear();
  SEEN.add(key);
  return false;
}

/** Oublie les clés vues (tests, déconnexion). */
export function resetAppearMemory(): void {
  SEEN.clear();
}

/**
 * Entrée d'un élément : fondu + petit glissement + légère échelle. Avec « réduire les animations » : fondu court seul.
 * La mise en page au repos est inchangée (transformations seulement).
 */
export function Appear({
  children,
  delay = 0,
  from = 'below',
  distance = 12,
  scale = 0.98,
  duration = motion.base,
  once,
  replay,
  style,
  pointerEvents,
}: AppearProps) {
  const reduced = useReducedMotion();
  const seenAtMount = useRef(once ? markSeen(once) : false);
  const p = useSharedValue(seenAtMount.current ? 1 : 0);
  const o = useSharedValue(seenAtMount.current ? 1 : 0);
  const first = useRef(true);
  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    if (isFirst && seenAtMount.current) return;
    if (!isFirst && replay === undefined) return;
    if (reduced) {
      p.value = 1;
      o.value = 0;
      o.value = withDelay(Math.min(delay, motion.fast), fadeTo(1, motion.fast));
      return;
    }
    p.value = 0;
    o.value = 0;
    p.value = withDelay(delay, withTiming(1, { duration, easing: ease.out }));
    o.value = withDelay(delay, withTiming(1, { duration: duration * 0.7 }));
  }, [replay, reduced, delay, duration, p, o]);
  const animated = useAnimatedStyle(() => {
    const k = 1 - p.value;
    const dx = from === 'left' ? -distance : from === 'right' ? distance : 0;
    const dy = from === 'below' ? distance : from === 'above' ? -distance : 0;
    return {
      opacity: o.value,
      transform: [{ translateX: dx * k }, { translateY: dy * k }, { scale: 1 - (1 - scale) * k }],
    };
  });
  return (
    <Animated.View style={[style, animated]} pointerEvents={pointerEvents}>
      {children}
    </Animated.View>
  );
}

/** Décalage d'un élément dans une cascade : `step` par rang, plafonné à `max` (le reste arrive d'un bloc). */
export function staggerDelay(index: number, step: number = motion.stagger, max: number = motion.staggerMax): number {
  return Math.min(index, max) * step;
}

export interface StaggerProps extends Omit<AppearProps, 'children' | 'once'> {
  children?: ReactNode;
  /** Décalage entre deux enfants (ms). Défaut `motion.stagger`. */
  step?: number;
  /** Rang au-delà duquel tout arrive d'un bloc. Défaut `motion.staggerMax` (8). */
  max?: number;
  /** Préfixe de clé : avec lui, chaque enfant (par sa `key`) ne s'anime qu'à sa première apparition. */
  onceKey?: string;
  /** Style de l'enveloppe de chaque enfant (ex. `{ flex: 1 }` dans une rangée). */
  itemStyle?: StyleProp<ViewStyle>;
}

/** Cascade : chaque enfant entre avec `Appear`, décalé de `step`. */
export function Stagger({ children, delay = 0, step = motion.stagger, max = motion.staggerMax, onceKey, itemStyle, ...rest }: StaggerProps) {
  const items = Children.toArray(children);
  return (
    <>
      {items.map((child, i) => {
        const key = isValidElement(child) && child.key != null ? String(child.key) : String(i);
        return (
          <Appear key={key} {...rest} delay={delay + staggerDelay(i, step, max)} once={onceKey ? `${onceKey}:${key}` : undefined} style={itemStyle}>
            {child}
          </Appear>
        );
      })}
    </>
  );
}
