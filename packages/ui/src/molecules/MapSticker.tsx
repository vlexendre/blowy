import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useLoop, useReducedMotion } from '../lib/motion';
import { alpha, color, petTint, space } from '../theme';
import type { PetLook } from '../types';

export interface MapStickerProps {
  pet: PetLook;
  /** Puce sous le visage (prénom, « Toi »). */
  label: string;
  /** Choisi (fiche ouverte) : anneau jaune, un peu plus grand. */
  selected?: boolean;
  /** Toi : puce jaune et onde. */
  me?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
  /** Entrée : attente avant de se poser (ms) ; null = déjà posé (pas d'animation). */
  landDelay?: number | null;
  /** Désynchronise le flottement de deux autocollants (ms). */
  floatDelay?: number;
  /** Diamètre du visage. Défaut 56. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Un minimoa sur la carte (maquette V6-GCarte) : visage en autocollant cerclé de blanc, prénom en puce dessous.
 * Il se pose en rebondissant, flotte doucement au repos, sautille quand on le touche. Animations réduites : posé, fixe.
 */
export function MapSticker({ pet, label, selected, me, onPress, accessibilityLabel, landDelay = null, floatDelay = 0, size = 56, style }: MapStickerProps) {
  const reduced = useReducedMotion();
  const land = useSharedValue(landDelay === null ? 1 : 0);
  const o = useSharedValue(landDelay === null ? 1 : 0);
  const hop = useSharedValue(0);
  const float = useLoop(1700, !me, floatDelay);
  useEffect(() => {
    if (landDelay === null) return;
    if (reduced) {
      land.value = 1;
      o.value = withDelay(Math.min(landDelay, 240), fadeTo(1, 160));
      return;
    }
    o.value = withDelay(landDelay, withTiming(1, { duration: 120 }));
    land.value = withDelay(landDelay, withSpring(1, springs.plush));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const press = () => {
    onPress?.();
    if (reduced) return;
    hop.value = withSequence(withTiming(1, { duration: 150, easing: ease.out }), withTiming(0, { duration: 170, easing: Easing.in(Easing.quad) }), withTiming(0.3, { duration: 100 }), withTiming(0, { duration: 110 }));
    setTimeout(() => hapticFor('land'), 320);
  };
  const body = useAnimatedStyle(() => {
    const k = 1 - land.value;
    return {
      opacity: o.value,
      transform: [{ translateY: -22 * Math.sin(Math.min(1, Math.max(0, k)) * Math.PI) - 16 * hop.value - 3 * float.value }, { scale: 1 - 0.55 * k }],
    };
  });
  const tint = petTint[pet.species];
  const content = (
    <Animated.View style={[styles.col, body]}>
      <View style={[styles.face, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }, selected ? styles.faceOn : null]}>
        <Avatar size={size} pet={pet} hidden bg={me ? color.accent : tint} />
      </View>
      <View style={[styles.chip, me || selected ? styles.chipOn : null]}>
        <Text variant="bodyHeavy" size={13} color={color.dark} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
  if (!onPress) {
    return (
      <View style={style} accessible accessibilityLabel={accessibilityLabel} accessibilityRole="image">
        {content}
      </View>
    );
  }
  return (
    <Pressable onPress={press} haptic="selection" scaleTo={0.94} accessibilityLabel={accessibilityLabel} accessibilityState={{ selected: !!selected }} style={style}>
      {content}
    </Pressable>
  );
}

export interface MapBlobProps {
  /** Diamètre. Défaut 54. */
  size?: number;
  /** Désynchronise la pulsation (ms). */
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Une silhouette floue (quelqu'un, plus loin, sans identité) : trois disques pâles qui s'estompent vers le bord
 * et respirent lentement. Fixe si animations réduites.
 */
export function MapBlob({ size = 54, delay = 0, style }: MapBlobProps) {
  const t = useLoop(2200, true, delay);
  const breathe = useAnimatedStyle(() => ({ opacity: 0.65 + 0.35 * t.value, transform: [{ scale: 0.94 + 0.08 * t.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ width: size, height: size }, styles.blob, breathe, style]}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, backgroundColor: alpha(color.white, 0.06) }]} />
      <View style={[styles.ring, { width: size * 0.72, height: size * 0.72, borderRadius: size * 0.36, backgroundColor: alpha(color.white, 0.09) }]} />
      <View style={[styles.ring, { width: size * 0.44, height: size * 0.44, borderRadius: size * 0.22, backgroundColor: alpha(color.white, 0.14) }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  col: { alignItems: 'center', gap: space.xs },
  face: { alignItems: 'center', justifyContent: 'center', backgroundColor: color.white, shadowColor: color.night, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } },
  faceOn: { borderWidth: 3, borderColor: color.accent, transform: [{ scale: 1.1 }] },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: color.white, maxWidth: 110, transform: [{ rotate: '-3deg' }] },
  chipOn: { backgroundColor: color.accent },
  blob: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
});
