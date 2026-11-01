/**
 * Base « bouton 3D » : surface colorée + ombre dure décalée, qui s'enfonce au toucher
 * (translateY = profondeur, ombre supprimée). Haptique déléguée à l'app via `onPressIn`.
 * Toujours ≥ 44 pt de cible tactile.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { hard, touch } from '../foundations/theme';

export interface Pressable3DProps extends Omit<PressableProps, 'style' | 'children'> {
  background: string;
  shadowColor: string;
  depth?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function Pressable3D({ background, shadowColor, depth = 5, radius = 18, style, children, disabled, onPressIn, onPressOut, ...rest }: Pressable3DProps) {
  const [down, setDown] = useState(false);
  const pressed = down && !disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={6}
      onPressIn={(e) => {
        setDown(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setDown(false);
        onPressOut?.(e);
      }}
      style={[
        { minHeight: touch.minTarget, minWidth: touch.minTarget, borderRadius: radius, backgroundColor: background, opacity: disabled ? 0.5 : 1 },
        pressed ? { transform: [{ translateY: depth - 1 }] } : hard(depth, shadowColor),
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
