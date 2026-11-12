import { type ComponentRef, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, type View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ease, useReducedMotion } from '../lib/motion';
import { color as palette } from '../theme';
import { type Measurable, measureInWindow, type Rect, useMotionHost } from './MotionHost';

export interface RippleOptions {
  /** Couleur des ondes. Défaut blanc. */
  color?: string;
  /** Nombre d'ondes. Défaut 2. */
  rings?: number;
  /** Distance parcourue au-delà du bord (pt). Défaut 22. */
  reach?: number;
  /** Rayon des coins de la cible (pt). Défaut : pilule. */
  radius?: number;
}

const DURATION = 680;
const GAP = 150;

function Ring({ rect, color, reach, radius, delay, onEnd }: { rect: Rect; color: string; reach: number; radius: number; delay: number; onEnd?: () => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withTiming(1, { duration: DURATION, easing: ease.out }, (done) => {
        if (done && onEnd) scheduleOnRN(onEnd);
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => {
    const g = reach * t.value;
    return {
      opacity: t.value === 0 ? 0 : 0.75 * (1 - t.value),
      transform: [{ scaleX: 1 + (2 * g) / Math.max(1, rect.width) }, { scaleY: 1 + (2 * g) / Math.max(1, rect.height) }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ring, { left: rect.x, top: rect.y, width: rect.width, height: rect.height, borderRadius: radius, borderColor: color }, style]}
    />
  );
}

/**
 * Ondes qui partent du bord d'un bouton (« saluer ») au-dessus de tout l'écran : elles survivent au bouton s'il
 * disparaît juste après (l'action part d'abord). Rien avec animations réduites ou hors `MotionHost`.
 */
export function useRipple(): (target: Measurable | Rect, options?: RippleOptions) => void {
  const host = useMotionHost();
  const reduced = useReducedMotion();
  const hostRef = useRef(host);
  hostRef.current = host;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  return useMemo(
    () =>
      (target, { color = palette.white, rings = 2, reach = 22, radius }: RippleOptions = {}) => {
        const h = hostRef.current;
        if (!h || reducedRef.current) return;
        const isRect = typeof (target as Rect).width === 'number';
        void (isRect ? Promise.resolve(target as Rect) : measureInWindow(target as Measurable)).then((rect) => {
          if (!rect) return;
          let unmount: () => void = () => undefined;
          const r = radius ?? rect.height / 2;
          unmount = h.mount(
            <>
              {Array.from({ length: Math.max(1, rings) }, (_, i) => (
                <Ring key={i} rect={rect} color={color} reach={reach} radius={r} delay={i * GAP} onEnd={i === rings - 1 ? () => unmount() : undefined} />
              ))}
            </>,
          );
        });
      },
    [],
  );
}

/**
 * Point d'ancrage d'une onde : à poser sur la vue qui enveloppe le bouton (`<View {...anchor.props}>`). Sa place
 * est relevée à la mise en page et au toucher, donc connue même si l'action remplace le bouton tout de suite
 * (mise à jour optimiste). `anchor.target()` se passe à `ripple(…)`.
 */
export function useRippleAnchor() {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const rect = useRef<Rect | null>(null);
  return useMemo(() => {
    const capture = () =>
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width || height) rect.current = { x, y, width, height };
      });
    return {
      props: { ref, collapsable: false, onLayout: capture, onTouchStart: capture, onPointerDown: capture },
      /** Dernière place connue, sinon la vue (mesurée à l'appel). */
      target: (): Measurable | Rect => rect.current ?? ref,
    };
  }, []);
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 2 },
});
