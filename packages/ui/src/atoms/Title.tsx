import { Text as RNText, type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { useInk } from '../lib/ink';
import { alpha, opacity, type } from '../theme';
import type { TitleContent } from '../types';
import { fitLineHeight } from './Text';

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
  const fontSize = size ?? type[variant].fontSize;
  // `.d` des maquettes : interlignage .96, approche .005 em.
  const metrics = { fontSize, lineHeight: Math.round(fontSize * 0.96), letterSpacing: fontSize * 0.005 };
  const dimColor = alpha(ink, opacity.dim);
  const composed = [type[variant], styles.base, { color: ink }, metrics, center && styles.center, style];
  return (
    <RNText
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? segments.map((s) => s.text).join('')}
      numberOfLines={numberOfLines}
      style={[composed, fitLineHeight(composed)]}
    >
      {segments.map((s, i) => (
        <RNText key={i} style={s.color ? { color: s.color } : s.dim ? { color: dimColor } : null}>
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
