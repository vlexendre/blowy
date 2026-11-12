import type { ReactNode } from 'react';
import { ActivityIndicator, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { haptic } from '../lib/haptics';
import { InkProvider } from '../lib/ink';
import { color, motion, opacity, size as sizes, veil } from '../theme';

export interface CareButtonProps {
  /** Le geste (« nourrir »). */
  label: string;
  /** Picto (`CareIcon`) ou élément libre ; il prend l'encre du disque (sombre sur jaune, blanc sinon). */
  icon: ReactNode;
  onPress?: () => void;
  /** Geste conseillé maintenant (`.care.hot` : disque jaune qui brille). */
  hot?: boolean;
  /** Le pet n'en veut pas (`canCare` faux) : estompé (`.care.off`) ; un appui le fait « non de la tête ». */
  refused?: boolean;
  /** Pourquoi il refuse (« il n'a plus faim. ») : lu par le lecteur d'écran. */
  refusedLabel?: string;
  /** Appui sur un geste refusé (pour afficher la raison ailleurs). */
  onRefusedPress?: () => void;
  /** Requête en cours. */
  loading?: boolean;
  /** Bouton inactif (ex. pendant un autre soin). */
  disabled?: boolean;
  /** Diamètre du disque. Défaut 64. */
  size?: number;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Bouton rond d'un soin (`.care` de V6-Accueil) : disque, libellé ; rebond et vibration à l'appui. */
export function CareButton({
  label,
  icon,
  onPress,
  hot,
  refused,
  refusedLabel,
  onRefusedPress,
  loading,
  disabled,
  size = 64,
  accessibilityHint,
  style,
}: CareButtonProps) {
  const reduced = useReducedMotion();
  const pop = useSharedValue(1);
  const shake = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }, { translateX: shake.value }] }));
  const inactive = disabled || loading;
  const lit = hot && !refused;
  const press = () => {
    if (refused) {
      haptic('warning');
      if (!reduced)
        shake.value = withSequence(
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 70 }),
          withTiming(-4, { duration: 60 }),
          withTiming(0, { duration: 50 }),
        );
      onRefusedPress?.();
      return;
    }
    haptic('medium');
    if (!reduced) pop.value = withSequence(withSpring(1.14, motion.press), withSpring(1, motion.pop));
    onPress?.();
  };
  const ink = lit ? color.dark : color.white;
  return (
    <Pressable
      onPress={press}
      disabled={inactive}
      haptic={false}
      scaleTo={0.92}
      accessibilityLabel={refused && refusedLabel ? `${label}, ${refusedLabel}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive || !!refused, busy: !!loading }}
      style={[styles.root, refused && styles.off, disabled && !loading && styles.inactive, style]}
    >
      <Animated.View style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }, lit ? styles.hot : null, anim]}>
        <InkProvider value={ink}>{loading ? <ActivityIndicator color={ink} /> : <View pointerEvents="none">{icon}</View>}</InkProvider>
      </Animated.View>
      <Text variant="bodyHeavy" size={12} center numberOfLines={1} color={color.white}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // `.care` : colonne, écart 6, libellé 12/800.
  root: { flex: 1, minWidth: sizes.touch, alignItems: 'center', gap: 6 },
  // `.care u` : disque 64 #221E3C, filet blanc 12 %.
  disc: { alignItems: 'center', justifyContent: 'center', backgroundColor: color.card, borderWidth: sizes.border, borderColor: veil.track },
  // `.care.hot u` : jaune, ombre 0 8 18 jaune 35 %.
  hot: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    shadowColor: color.accent,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  // `.care.off` : opacité .38.
  off: { opacity: opacity.dim },
  inactive: { opacity: opacity.disabled },
});
