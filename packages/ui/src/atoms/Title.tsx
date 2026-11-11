import { Text as RNText, type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { useInk } from '../lib/ink';
import { alpha, opacity, type } from '../theme';
import type { TitleContent } from '../types';

export interface TitleProps {
  /** Texte ou segments `[{ text, dim? }]` ; `\n` dans un segment force un retour à la ligne. */
  text: TitleContent;
  variant?: 'hero' | 'h1' | 'h2' | 'h3';
  /** Corps personnalisé (ex. 64 pour « CHATS · 5 ») ; interlignage serré comme les maquettes. */
  size?: number;
  color?: string;
  center?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

/** Titre Anton en capitales, avec sa partie estompée. */
export function Title({ text, variant = 'h1', size, color, center, numberOfLines, style, accessibilityLabel }: TitleProps) {
  const contextInk = useInk();
  const ink = color ?? contextInk;
  const segments = typeof text === 'string' ? [{ text }] : text;
  const sized = size ? { fontSize: size, lineHeight: Math.round(size * 1.02) } : null;
  const dimColor = alpha(ink, opacity.dim);
  return (
    <RNText
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? segments.map((s) => s.text).join('')}
      numberOfLines={numberOfLines}
      style={[type[variant], styles.base, { color: ink }, sized, center && styles.center, style]}
    >
      {segments.map((s, i) => (
        <RNText key={i} style={s.dim ? { color: dimColor } : null}>
          {s.text}
        </RNText>
      ))}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
  center: { textAlign: 'center' },
});
