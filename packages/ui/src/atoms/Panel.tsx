import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { InkProvider } from '../lib/ink';
import { type GradientName, gradient as gradients, onGradient, radius as radii, space } from '../theme';

export interface PanelProps {
  children?: ReactNode;
  /** Dégradé vertical de `tokens.gradient`. Défaut `accent`. */
  gradient?: GradientName;
  radius?: 'md' | 'lg' | 'xl';
  /** Marge intérieure (`tokens.space`). Défaut `lg`. */
  padding?: 'none' | 'md' | 'lg' | 'xl';
  /** Laisse déborder le contenu (pet qui sort du panneau). Défaut : rogné. */
  overflow?: boolean;
  /** Encre du texte ; défaut adaptée au dégradé. */
  ink?: string;
  style?: StyleProp<ViewStyle>;
}

/** Grand panneau arrondi en dégradé (`.panel`). Le texte enfant prend l'encre adaptée. */
export function Panel({ children, gradient = 'accent', radius = 'xl', padding = 'lg', overflow = false, ink, style }: PanelProps) {
  const r = radii[radius];
  return (
    <View style={[{ borderRadius: r, padding: padding === 'none' ? 0 : space[padding] }, !overflow && styles.clip, style]}>
      <LinearGradient colors={gradients[gradient]} style={[StyleSheet.absoluteFill, { borderRadius: r }]} />
      <InkProvider value={ink ?? onGradient[gradient]}>{children}</InkProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
