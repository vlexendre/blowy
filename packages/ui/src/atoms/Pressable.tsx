import type { ReactNode } from 'react';
import { type GestureResponderEvent, Pressable as RNPressable, type PressableProps as RNPressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { haptic as fireHaptic, type HapticKind } from '../lib/haptics';
import { usePressFeedback } from '../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export interface PressableProps extends Omit<RNPressableProps, 'style' | 'children'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Échelle pendant l'appui (1 = aucune). Défaut 0,96. */
  scaleTo?: number;
  /** Retour haptique à l'appui ; `false` pour aucun. Défaut `light`. */
  haptic?: HapticKind | false;
}

/** Base de tout élément touchable : rétrécit au toucher, vibre légèrement, respecte « réduire les animations ». */
export function Pressable({ children, style, scaleTo = 0.96, haptic = 'light', onPressIn, onPressOut, onPress, disabled, accessibilityRole = 'button', ...rest }: PressableProps) {
  const fb = usePressFeedback(scaleTo);
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
