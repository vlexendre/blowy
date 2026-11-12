import type { Mood, Species } from '@blowy/domain';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { type PetPose, petImage, RENDER_RATIO } from '../../assets/pets';
import { hapticFor } from '../../lib/haptics';
import { ease, fadeTo, springs, useMotionActive, useReducedMotion } from '../../lib/motion';
import { color, motion } from '../../theme';
import { SoftShadow } from './PetProps';

export interface PetEntranceProps {
  species: Species;
  /** Pose une fois arrivé. Défaut `debout`. */
  mood?: Mood | PetPose;
  /** Largeur du pet. Défaut 180. */
  size?: number;
  /** Couleur de la lueur qui s'allume derrière lui. Défaut l'accent. */
  glow?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Trois bonds de profil depuis la gauche, puis il se pose et se retourne. */
const RUN = 960;
const HOPS = 3;

/**
 * Entrée du pet (écran de lancement) : il arrive en courant de profil par la gauche (trois bonds), dérape, se pose
 * en s'écrasant, se tourne vers toi et respire ; la lueur derrière lui s'allume. Rien ne retarde la navigation :
 * l'animation est simplement coupée si l'écran change. Animations réduites : il apparaît en fondu, déjà posé.
 */
export function PetEntrance({ species, mood = 'debout', size = 180, glow = color.accent, accessibilityLabel, style }: PetEntranceProps) {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const [arrived, setArrived] = useState(reduced);
  const h = size / RENDER_RATIO;
  const x = useSharedValue(reduced ? 0 : -1);
  const hop = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const light = useSharedValue(0);
  const fade = useSharedValue(reduced ? 0 : 1);
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      fade.value = fadeTo(1, motion.base);
      light.value = fadeTo(1, motion.slow);
      return;
    }
    x.value = withTiming(0, { duration: RUN, easing: Easing.out(Easing.quad) });
    const one = RUN / HOPS;
    hop.value = withRepeat(
      withSequence(withTiming(1, { duration: one / 2, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: one / 2, easing: Easing.in(Easing.quad) })),
      HOPS,
    );
    light.value = withDelay(200, withTiming(1, { duration: motion.scene + 300, easing: ease.out }));
    // Arrivée : dérapage (penché), écrasement, puis ressort `plush`.
    sx.value = withDelay(RUN - 40, withSequence(withTiming(1.16, { duration: 80, easing: ease.out }), withSpring(1, springs.plush)));
    sy.value = withDelay(RUN - 40, withSequence(withTiming(0.84, { duration: 80, easing: ease.out }), withSpring(1, springs.plush)));
    const id = setTimeout(() => {
      setArrived(true);
      hapticFor('land');
    }, RUN + 60);
    return () => clearTimeout(id);
  }, [reduced, x, hop, sx, sy, light, fade]);

  useEffect(() => {
    if (!arrived || reduced || !active) {
      cancelAnimation(breath);
      return;
    }
    breath.value = withRepeat(
      withSequence(withTiming(1, { duration: motion.breath, easing: ease.inOut }), withTiming(0, { duration: motion.breath, easing: ease.inOut })),
      -1,
    );
    return () => cancelAnimation(breath);
  }, [arrived, reduced, active, breath]);

  const body = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateX: x.value * size * 1.6 },
      { translateY: -hop.value * size * 0.16 - breath.value * 4 },
      { rotate: `${x.value < 0 ? -6 * hop.value : 0}deg` },
      { scaleX: sx.value * (1 - 0.02 * breath.value) },
      { scaleY: sy.value * (1 + 0.03 * breath.value) * (1 - 0.06 * (1 - hop.value) * (x.value < 0 ? 1 : 0)) },
    ],
  }));
  const shadow = useAnimatedStyle(() => ({
    opacity: fade.value * (1 - hop.value * 0.5),
    transform: [{ translateX: x.value * size * 1.6 }, { scaleX: 1 - hop.value * 0.35 }],
  }));
  const lit = useAnimatedStyle(() => ({ opacity: light.value * 0.55, transform: [{ scale: 0.6 + 0.4 * light.value }] }));
  const glowW = size * 2.1;
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: h }, style]}
    >
      <Animated.View pointerEvents="none" style={[styles.abs, { width: glowW, height: glowW, left: (size - glowW) / 2, top: (h - glowW) / 2 }, lit]}>
        <Svg width={glowW} height={glowW}>
          <Defs>
            <RadialGradient id="entranceGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={glow} stopOpacity={0.55} />
              <Stop offset="0.5" stopColor={glow} stopOpacity={0.14} />
              <Stop offset="1" stopColor={glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={glowW / 2} cy={glowW / 2} rx={glowW / 2} ry={glowW / 2} fill="url(#entranceGlow)" />
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.abs, { left: size * 0.15, top: h * 0.9 }, shadow]}>
        <SoftShadow width={size * 0.7} height={size * 0.1} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.origin, body]}>
        {/* De profil en courant (l'image regarde à gauche : on la retourne), de face une fois arrivé. */}
        <Image source={petImage(species, arrived ? mood : 'cote')} contentFit="contain" style={[StyleSheet.absoluteFill, !arrived && styles.flip]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  origin: { transformOrigin: '50% 95%' },
  flip: { transform: [{ scaleX: -1 }] },
});
