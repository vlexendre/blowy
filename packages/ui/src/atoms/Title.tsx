import { Text as RNText, type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { useInk } from '../lib/ink';
import { alpha, opacity, type } from '../theme';
import type { TitleContent, TitleSegment } from '../types';
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
  /**
   * Nombre de mots montrés (titre qui s'écrit mot à mot, voir `useReveal` et `countWords`) ; les suivants gardent
   * leur place en encre transparente (rien ne saute). Défaut : tout.
   */
  reveal?: number;
}

/** Nombre de mots d'un titre (pour `reveal`). */
export function countWords(text: TitleContent): number {
  const segments = typeof text === 'string' ? [{ text }] : text;
  return segments.reduce((n, s) => n + s.text.split(/\s+/).filter(Boolean).length, 0);
}

/** Titre Anton en capitales, avec sa partie estompée. */
export function Title({ text, variant = 'h1', size, color, center, numberOfLines, style, accessibilityLabel, reveal }: TitleProps) {
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
      {reveal === undefined
        ? segments.map((s, i) => (
            <RNText key={i} style={s.color ? { color: s.color } : s.dim ? { color: dimColor } : null}>
              {s.text}
            </RNText>
          ))
        : revealSegments(segments, reveal, dimColor)}
    </RNText>
  );
}

/** Segments découpés en mots ; au-delà de `count`, encre transparente (la mise en page ne bouge pas). */
function revealSegments(segments: readonly TitleSegment[], count: number, dimColor: string) {
  let seen = 0;
  return segments.map((s, i) => {
    const tint = s.color ?? (s.dim ? dimColor : undefined);
    return (
      <RNText key={i} style={tint ? { color: tint } : null}>
        {s.text.split(/(\s+)/).map((t, j) => {
          if (!t || /^\s+$/.test(t)) return t;
          const hidden = seen++ >= count;
          return hidden ? (
            <RNText key={j} style={styles.hidden}>
              {t}
            </RNText>
          ) : (
            t
          );
        })}
      </RNText>
    );
  });
}

const styles = StyleSheet.create({
  hidden: { color: 'transparent' },
  base: { includeFontPadding: false },
  center: { textAlign: 'center' },
});
