/**
 * Base « bouton 3D » (`.btn` + `.b1/.b2/.b3/.bl`) : surface colorée + ombre dure `0 <depth>px 0`.
 * Appui (`.btn:active`) : translateY(4 px) et ombre supprimée. Haptique déléguée à l'app via
 * `onPressIn`. Cible tactile ≥ 44 pt.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { press } from '../foundations/theme';
import { pressable3DStyle } from './styles';

export interface Pressable3DProps extends Omit<PressableProps, 'style' | 'children'> {
  background: string;
  shadowColor: string;
  /** Épaisseur de l'ombre dure (5 boutons, 4 cartes, 3 lignes). */
  depth?: number;
  /** Enfoncement à l'appui (4 boutons `.btn`, 3 `.row/.act/.opt`). */
  pressDepth?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}


export function Pressable3D({ background, shadowColor, depth = 5, pressDepth, radius = 18, style, children, disabled, onPressIn, onPressOut, ...rest }: Pressable3DProps) {
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
      style={[pressable3DStyle(background, shadowColor, depth, pressDepth ?? (depth > 0 ? Math.min(press.depth, depth) : 0), radius, pressed, !!disabled), style]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
