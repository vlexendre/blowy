import { type ReactNode, useEffect, useRef } from 'react';
import { type GestureResponderEvent, Pressable as RNPressable, type PressableProps as RNPressableProps, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { haptic as fireHaptic, type HapticKind } from '../lib/haptics';
import { usePressFeedback } from '../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export interface PressableProps extends Omit<RNPressableProps, 'style' | 'children'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Échelle pendant l'appui (1 = aucune). Défaut `auto` : adaptée à la taille mesurée (≈ 7 pt d'écrasement :
   * un petit bouton s'enfonce plus qu'une grande carte, entre 0,9 et 0,985).
   */
  scaleTo?: number | 'auto';
  /** Opacité pendant l'appui (lignes de liste : 0,7). Défaut 1. */
  dimTo?: number;
  /** Quand cette valeur change (ex. `selected`), l'élément fait un petit rebond de confirmation. */
  bounceKey?: string | number | boolean | null;
  /** Retour haptique à l'appui ; `false` pour aucun. Défaut `light`. */
  haptic?: HapticKind | false;
}

/**
 * Base de tout élément touchable : s'enfonce vite au toucher (90 ms), revient en ressort avec un soupçon de rebond,
 * vibre légèrement ; désactivé, aucun mouvement. Atténuation seule avec « réduire les animations ».
 */
export function Pressable({ children, style, scaleTo = 'auto', dimTo = 1, bounceKey, haptic = 'light', onPressIn, onPressOut, onPress, onLayout, disabled, accessibilityRole = 'button', ...rest }: PressableProps) {
  const fb = usePressFeedback(scaleTo, StyleSheet.flatten(style)?.opacity ?? 1, dimTo);
  const lastBounce = useRef(bounceKey);
  useEffect(() => {
    if (lastBounce.current !== bounceKey) fb.bounce();
    lastBounce.current = bounceKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounceKey]);
  const press = (e: GestureResponderEvent) => {
    if (haptic) fireHaptic(haptic);
    onPress?.(e);
  };
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPress={onPress ? press : undefined}
      onLayout={(e) => {
        fb.onLayout?.(e);
        onLayout?.(e);
      }}
      onPressIn={(e) => {
        fb.pressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        fb.pressOut();
        onPressOut?.(e);
      }}
      style={[style, fb.animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
