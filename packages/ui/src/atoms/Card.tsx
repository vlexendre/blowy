import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { InkProvider } from '../lib/ink';
import { color, radius, size, space, veil } from '../theme';
import { Pressable } from './Pressable';

export interface CardProps {
  children?: ReactNode;
  /** `panel` : fond nuit relevé (défaut) ; `raised` : un cran plus clair ; `outline` : transparent bordé. */
  tone?: 'panel' | 'raised' | 'outline';
  /** Bordure d'accent (élément sélectionné ou mis en avant). */
  highlight?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Carte sombre bordée (`.card`). Devient touchable si `onPress` est fourni. */
export function Card({ children, tone = 'panel', highlight, padding = 'md', onPress, accessibilityLabel, style }: CardProps) {
  const s = [
    styles.base,
    tone === 'panel' && styles.panel,
    tone === 'raised' && styles.raised,
    { padding: padding === 'none' ? 0 : space[padding] + (padding === 'md' ? 2 : 0) },
    highlight ? { borderColor: highlight } : null,
    style,
  ];
  const body = <InkProvider value={color.white}>{children}</InkProvider>;
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} scaleTo={0.98} style={s}>
        {body}
      </Pressable>
    );
  }
  return <View style={s}>{body}</View>;
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, borderWidth: size.border, borderColor: veil.line },
  panel: { backgroundColor: color.panel },
  raised: { backgroundColor: color.card },
});
