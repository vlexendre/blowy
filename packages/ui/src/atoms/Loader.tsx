import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, type SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useInk } from '../lib/ink';
import { fadeTo, useMotionActive, useReducedMotion } from '../lib/motion';
import { color as palette, motion } from '../theme';

export interface LoaderProps {
  /** Couleur des boules. Défaut : l'encre courante (sombre sur un bouton jaune, blanche sur la nuit). `accent` : jaune Blowy. */
  color?: string | 'accent';
  /** Diamètre d'une boule (pt). Défaut 8. */
  size?: number;
  /** Libellé lu (« chargement »). Sans lui, l'élément est décoratif (le parent annonce `busy`). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Une boucle complète : chaque boule saute à son tour, puis un temps de repos. */
const PERIOD = 960;
/** Décalage d'une boule à la suivante (fraction de la période). */
const STEP = 0.16;
/** Part de la période où une boule est en l'air. */
const AIR = 0.42;

function Ball({ t, index, size, tint }: { t: SharedValue<number>; index: number; size: number; tint: string }) {
  const style = useAnimatedStyle(() => {
    const local = (t.value - index * STEP + 1) % 1;
    // En l'air : arc ; juste avant et juste après : écrasée contre le sol (peluche qui rebondit).
    const air = local < AIR ? Math.sin((local / AIR) * Math.PI) : 0;
    const land = local >= AIR && local < AIR + 0.1 ? Math.sin(((local - AIR) / 0.1) * Math.PI) : 0;
    const crouch = local > 0.94 ? Math.sin(((local - 0.94) / 0.06) * Math.PI) * 0.6 : 0;
    const squash = Math.max(land, crouch);
    return {
      opacity: 0.5 + 0.5 * Math.max(air, squash * 0.6),
      transform: [
        { translateY: -size * 0.95 * air + size * 0.12 * squash },
        { scaleX: 1 + 0.26 * squash - 0.08 * air },
        { scaleY: 1 - 0.24 * squash + 0.1 * air },
      ],
    };
  });
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint }, styles.ball, style]} />;
}

/**
 * Chargement en ligne (bouton, soin, action) : trois petites boules de poils qui rebondissent l'une après l'autre,
 * s'écrasent en touchant le sol et repartent. Remplace tout indicateur rotatif. Apparaît en fondu (pas de
 * clignotement pour une requête rapide). Fixe (trois boules en dégradé d'opacité) avec « réduire les animations »,
 * en pause hors écran et quand l'app passe en arrière-plan.
 */
export function Loader({ color, size = 8, accessibilityLabel, style }: LoaderProps) {
  const ink = useInk();
  const tint = color === 'accent' ? palette.accent : (color ?? ink);
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const t = useSharedValue(0);
  const fade = useSharedValue(0);
  const run = active && !reduced;
  useEffect(() => {
    fade.value = fadeTo(1, motion.fast);
  }, [fade]);
  useEffect(() => {
    if (!run) {
      cancelAnimation(t);
      // Au repos : la première boule est posée, les autres attendent (lecture « en cours » sans mouvement).
      t.value = 0.7;
      return;
    }
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: PERIOD, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [run, t]);
  const root = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Animated.View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'progressbar' : undefined}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      accessibilityElementsHidden={!accessibilityLabel}
      pointerEvents="none"
      style={[styles.row, { gap: size * 0.55, height: size * 2.2, paddingTop: size }, root, style]}
    >
      {reduced || !active ? (
        [1, 0.65, 0.35].map((o, i) => <View key={i} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint, opacity: o }, styles.ball]} />)
      ) : (
        [0, 1, 2].map((i) => <Ball key={i} t={t} index={i} size={size} tint={tint} />)
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  ball: { transformOrigin: '50% 100%' },
});
