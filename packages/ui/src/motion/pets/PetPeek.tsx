import type { Mood, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, type StyleProp, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type PetPose, petImage, RENDER_RATIO } from '../../assets/pets';
import { hapticFor } from '../../lib/haptics';
import { ease, fadeTo, springs, useMotionActive, useReducedMotion } from '../../lib/motion';
import { motion, size as sizes, space } from '../../theme';
import { HostPortal } from '../MotionHost';
import { useSeed } from '../seed';

/** Bord d'où le pet passe la tête : coins bas (au-dessus de la barre d'onglets), côtés, ou suspendu en haut. */
export type PeekEdge = 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top';

/** Marges à ne jamais couvrir, depuis chaque bord de la fenêtre (en-tête, barre d'onglets, clavier…). */
export interface PeekSafeArea {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface PetPeekProps {
  species: Species;
  /** Humeur (buste). Défaut `neutre`. */
  mood?: Mood | PetPose;
  /** Bords possibles, dans l'ordre de préférence ; touché, il se cache et ressort au suivant (cache-cache). Défaut les deux coins bas. */
  edges?: readonly PeekEdge[];
  /** Le pet est là ; faux : il se cache. Défaut vrai. */
  visible?: boolean;
  /** Largeur du buste (pt). Défaut 92. */
  size?: number;
  /** Position le long d'un côté ou du haut (0 = début, 1 = fin de la zone sûre). Défaut 0,6. */
  along?: number;
  /** Zones à ne pas couvrir. Défaut : sous l'en-tête (zone sûre + 60) et au-dessus de la barre d'onglets flottante. */
  safe?: PeekSafeArea;
  /** Touché, il se cache puis ressort ailleurs. Défaut vrai (sinon `onPress` seul). */
  hideAndSeek?: boolean;
  /** Graine du hasard (id du pet). */
  seed?: string;
  /** Il se cache tout seul après ce délai (ms) : apparitions brèves (retour dans l'app, changement d'onglet). */
  duration?: number;
  onPress?: () => void;
  /** Appelé quand il a fini de se cacher. */
  onHidden?: () => void;
  /**
   * Sur place : le pet sort du bas de son propre cadre (largeur `size`), qui rogne le reste. Pour un état vide,
   * au-dessus d'un titre. Sinon (défaut), il est rendu dans le calque du `MotionHost`, au bord de la fenêtre.
   */
  inline?: boolean;
  /** Libellé lu ; sans lui, le pet est décoratif (ignoré par le lecteur d'écran). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Hauteur de la barre d'onglets flottante (onglets 54 + 2 × 6 + 2 × 1). */
const TAB_BAR = 68;
/** Haut du contenu dessiné dans un buste (fraction de la hauteur) ; part visible quand il passe la tête. */
const CONTENT_TOP = 0.17;
const SHOWN = 0.44;
const ROTATE: Record<PeekEdge, number> = { 'bottom-left': 0, 'bottom-right': 0, left: 90, right: -90, top: 180 };

interface Unit {
  left: number;
  top: number;
  rotate: number;
}

/** Cadre (largeur `size`, hauteur `depth`) posé contre un bord, tourné pour que son bas regarde le bord. */
function placeUnit(edge: PeekEdge, w: number, depth: number, win: { width: number; height: number }, safe: Required<PeekSafeArea>, along: number): Unit {
  const rotate = ROTATE[edge];
  switch (edge) {
    case 'bottom-left':
      return { left: safe.left + space.md, top: win.height - safe.bottom - depth, rotate };
    case 'bottom-right':
      return { left: win.width - safe.right - space.md - w, top: win.height - safe.bottom - depth, rotate };
    case 'top': {
      const span = win.width - safe.left - safe.right - w;
      return { left: safe.left + span * along, top: safe.top, rotate };
    }
    case 'left':
    case 'right': {
      const span = win.height - safe.top - safe.bottom - w;
      const cy = safe.top + w / 2 + span * along;
      const cx = edge === 'left' ? safe.left + depth / 2 : win.width - safe.right - depth / 2;
      return { left: cx - w / 2, top: cy - depth / 2, rotate };
    }
  }
}

/**
 * Un pet qui passe la tête par un bord de l'écran (cache-cache) : il sort, regarde autour de lui, se cache si on
 * le touche et ressort ailleurs. Il ne capte que les touchers sur lui-même et reste hors des zones sûres
 * (en-tête, barre d'onglets, clavier) : il ne couvre ni bouton ni champ. Rien avec « réduire les animations »
 * sauf un fondu (il apparaît et disparaît sans bouger).
 */
export function PetPeek({
  species,
  mood = 'neutre',
  edges = ['bottom-right', 'bottom-left'],
  visible = true,
  size = 92,
  along = 0.6,
  safe,
  hideAndSeek = true,
  seed: seedId,
  duration,
  onPress,
  onHidden,
  inline = false,
  accessibilityLabel,
  style,
}: PetPeekProps) {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const seed = useSeed(seedId, 'peek');
  const [edgeIndex, setEdgeIndex] = useState(0);
  const [face, setFace] = useState<Mood | PetPose>('surpris');
  const [hidden, setHidden] = useState(false);
  const p = useSharedValue(0);
  const look = useSharedValue(0);
  const h = size / RENDER_RATIO;
  const depth = h * (SHOWN + 0.08);
  const edge = edges[edgeIndex % Math.max(1, edges.length)] ?? 'bottom-right';
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const show = useCallback(() => {
    clear();
    setHidden(false);
    setFace('surpris');
    if (reduced) {
      setFace(mood);
      p.value = fadeTo(1, motion.fast);
      return;
    }
    p.value = withSpring(1, springs.plush);
    // Il regarde à gauche, à droite, puis prend son air.
    look.value = withDelay(
      motion.scene,
      withSequence(
        withTiming(-1, { duration: 380, easing: ease.inOut }),
        withDelay(260, withTiming(1, { duration: 520, easing: ease.inOut })),
        withSpring(0, springs.soft),
      ),
    );
    later(motion.scene + 900, () => setFace(mood));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, mood, p, look]);

  const hide = useCallback(
    (then?: () => void) => {
      clear();
      cancelAnimation(look);
      look.value = withTiming(0, { duration: motion.fast });
      p.value = reduced ? fadeTo(0, motion.fast) : withTiming(0, { duration: 150, easing: ease.in });
      later(reduced ? motion.fast : 170, () => {
        setHidden(true);
        then?.();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced, p, look],
  );

  // Apparition / disparition demandées.
  useEffect(() => {
    if (visible && active) show();
    else hide(onHidden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, active]);
  useEffect(() => {
    if (!visible || !duration) return;
    const id = setTimeout(() => hide(onHidden), duration);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, duration]);

  const press = () => {
    hapticFor('press');
    onPress?.();
    if (!hideAndSeek) return;
    hide(() => {
      // Ressort ailleurs, un peu plus tard (jamais au même bord deux fois de suite).
      const next = edges.length > 1 ? edges.indexOf(seed.pick(edges, edge)) : edgeIndex;
      later(seed.range(900, 1800), () => {
        setEdgeIndex(Math.max(0, next));
        show();
      });
    });
  };

  const rise = (CONTENT_TOP + SHOWN) * h;
  const img = useAnimatedStyle(() => ({
    opacity: reduced ? p.value : 1,
    transform: [{ translateY: reduced ? -rise : -rise * p.value }, { translateX: look.value * size * 0.06 }, { rotate: `${look.value * 9}deg` }],
  }));

  const s: Required<PeekSafeArea> = {
    top: safe?.top ?? insets.top + 60,
    bottom: safe?.bottom ?? Math.max(insets.bottom, space.lg) + TAB_BAR + space.xs,
    left: safe?.left ?? 0,
    right: safe?.right ?? 0,
  };
  const unit = inline ? null : placeUnit(edge, size, depth, win, s, along);
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'button' as const, accessibilityLabel }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  const body = (
    <View
      pointerEvents="box-none"
      style={[
        styles.clip,
        { width: size, height: depth },
        unit ? { position: 'absolute', left: unit.left, top: unit.top, transform: [{ rotate: `${unit.rotate}deg` }] } : null,
        inline ? style : null,
      ]}
    >
      {hidden && !inline ? null : (
        <Animated.View style={[styles.img, { width: size, height: h, top: depth, transformOrigin: '50% 80%' }, img]}>
          <Pressable onPress={press} hitSlop={sizes.border} style={StyleSheet.absoluteFill} {...a11y}>
            <Image source={petImage(species, face)} contentFit="contain" style={StyleSheet.absoluteFill} transition={120} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
  if (inline) return body;
  return <HostPortal>{body}</HostPortal>;
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  img: { position: 'absolute', left: 0 },
});
