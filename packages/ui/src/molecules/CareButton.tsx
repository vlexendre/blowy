import type { ReactNode } from 'react';
import { ActivityIndicator, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { ICON_NAMES, type IconName } from '../assets/pets';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { haptic } from '../lib/haptics';
import { color, motion, opacity, shadow, space, veil } from '../theme';

export interface CareButtonProps {
  /** Le geste (« nourrir »). */
  label: string;
  /** Icône 3D ou élément libre (image d'objet). */
  icon: IconName | ReactNode;
  onPress?: () => void;
  /** Le pet n'en veut pas (`canCare` faux) : bouton estompé ; un appui le fait « non de la tête ». */
  refused?: boolean;
  /** Pourquoi il refuse (« il n'a plus faim. »), sous le libellé. */
  refusedLabel?: string;
  /** Appui sur un geste refusé (pour afficher la raison ailleurs). */
  onRefusedPress?: () => void;
  /** Requête en cours. */
  loading?: boolean;
  /** Bouton inactif (aucune action possible, ex. pendant un autre soin). */
  disabled?: boolean;
  /** Diamètre du disque. Défaut 68. */
  size?: number;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const isIconName = (v: unknown): v is IconName => typeof v === 'string' && (ICON_NAMES as readonly string[]).includes(v);

/** Gros bouton rond d'un soin (nourrir, jouer, sieste, câlin) : rebond et vibration à l'appui. */
export function CareButton({ label, icon, onPress, refused, refusedLabel, onRefusedPress, loading, disabled, size = 68, accessibilityHint, style }: CareButtonProps) {
  const reduced = useReducedMotion();
  const pop = useSharedValue(1);
  const shake = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }, { translateX: shake.value }] }));
  const inactive = disabled || loading;
  const press = () => {
    if (refused) {
      haptic('warning');
      if (!reduced) shake.value = withSequence(withTiming(-6, { duration: 50 }), withTiming(6, { duration: 70 }), withTiming(-4, { duration: 60 }), withTiming(0, { duration: 50 }));
      onRefusedPress?.();
      return;
    }
    haptic('medium');
    if (!reduced) pop.value = withSequence(withSpring(1.14, motion.press), withSpring(1, motion.pop));
    onPress?.();
  };
  return (
    <Pressable
      onPress={press}
      disabled={inactive}
      haptic={false}
      scaleTo={0.9}
      accessibilityLabel={refused && refusedLabel ? `${label}, ${refusedLabel}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive || !!refused, busy: !!loading }}
      style={[styles.root, style]}
    >
      <Animated.View
        style={[
          styles.disc,
          shadow.soft,
          { width: size, height: size, borderRadius: size / 2 },
          refused ? styles.discRefused : styles.discReady,
          inactive && styles.inactive,
          anim,
        ]}
      >
        {loading ? <ActivityIndicator color={color.dark} /> : isIconName(icon) ? <Icon name={icon} size={Math.round(size * 0.56)} /> : icon}
      </Animated.View>
      <View style={styles.text}>
        <Text variant="bodyBold" size={13} center numberOfLines={1} muted={!!refused}>
          {label}
        </Text>
        {refused && refusedLabel ? (
          <Text variant="small" size={11} muted center numberOfLines={2}>
            {refusedLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space.xs + 2, minWidth: 72, flex: 1 },
  disc: { alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  discReady: { backgroundColor: color.accent, borderColor: color.white },
  discRefused: { backgroundColor: veil.glass, borderColor: veil.glassStrong },
  inactive: { opacity: opacity.disabled },
  text: { alignItems: 'center', gap: 1, minHeight: 32 },
});
