import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

import { Avatar } from '../atoms/Avatar';
import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { hitSlopFor } from '../lib/styles';
import { springs, useReducedMotion } from '../lib/motion';
import { color, petTint, veil } from '../theme';
import type { PetLook } from '../types';

export interface MinimoaSwitchProps {
  /** Ton minimoa (son visage dans le rond). */
  pet: PetLook;
  /** Vrai : les minimoas parlent dans ce chat. */
  on: boolean;
  onToggle: () => void;
  /** Libellé lu, qui dit l'état (« Minimoas activés dans ce chat. Toucher pour les couper. »). */
  accessibilityLabel: string;
  disabled?: boolean;
  size?: number;
}

/**
 * Interrupteur compact des minimoas d'un chat (en-tête du lien) : le visage de ton minimoa dans un rond à sa couleur ;
 * coupé, il pâlit et une petite barre le traverse. Au changement, il fait un petit « pop » (fondu si animations réduites).
 */
export function MinimoaSwitch({ pet, on, onToggle, accessibilityLabel, disabled, size = 40 }: MinimoaSwitchProps) {
  const reduced = useReducedMotion();
  const pop = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) return;
    pop.value = withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, springs.pop));
  }, [on, reduced, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const tint = petTint[pet.species];
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      haptic="selection"
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlopFor(size)}
      scaleTo={0.9}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, borderColor: on ? tint : veil.off }]}
    >
      <Animated.View style={style}>
        <Avatar size={size - 6} pet={pet} hidden bg={on ? tint : veil.glass} dimmed={!on} />
      </Animated.View>
      {!on ? (
        <View pointerEvents="none" style={styles.mute}>
          <Glyph name="close" size={10} color={color.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, backgroundColor: veil.track },
  mute: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.danger,
    borderWidth: 2,
    borderColor: color.night,
  },
});
