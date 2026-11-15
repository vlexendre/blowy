import { Text as RNText, type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { useInk } from '../lib/ink';
import { countRunWords, normalizeRuns, revealTokens } from '../lib/runs';
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

/** Chasse des capitales d'Anton (em, mesurée), pour estimer la largeur d'une ligne de titre sans la rendre. */
const ANTON: Record<string, number> = {
  A: 0.49, B: 0.48, C: 0.47, D: 0.49, E: 0.41, F: 0.4, G: 0.48, H: 0.5, I: 0.23, J: 0.47, K: 0.47, L: 0.4, M: 0.75, N: 0.5, O: 0.49,
  P: 0.47, Q: 0.49, R: 0.48, S: 0.46, T: 0.4, U: 0.47, V: 0.47, W: 0.71, X: 0.48, Y: 0.45, Z: 0.41, '.': 0.23, ',': 0.24, '!': 0.23,
  '’': 0.23, "'": 0.23, ' ': 0.23, '-': 0.31, '%': 1.06, '+': 0.36, '1': 0.33,
};
const glyphEm = (ch: string): number => ANTON[ch] ?? ANTON[ch.normalize('NFD')[0] ?? ''] ?? 0.49;

/** Largeur (em) de la ligne la plus longue d'un titre. */
export function titleWidthEm(text: TitleContent): number {
  const raw = typeof text === 'string' ? text : text.map((s) => s.text).join('');
  return Math.max(0, ...raw.toUpperCase().split('\n').map((line) => [...line.trim()].reduce((w, ch) => w + glyphEm(ch) + 0.005, 0)));
}

/**
 * Corps d'un titre pour que sa ligne la plus longue tienne dans `width` (un mot ne se coupe jamais : « SOCIABLE » ne
 * doit pas passer sous le minimoa). Entre `min` et `max`.
 */
export function fitTitleSize(text: TitleContent, max: number, width: number, min = 34): number {
  const em = titleWidthEm(text);
  if (em <= 0 || width <= 0) return max;
  return Math.max(min, Math.min(max, Math.floor(width / em)));
}

/** Nombre de mots d'un titre (pour `reveal`). */
export function countWords(text: TitleContent): number {
  return countRunWords(typeof text === 'string' ? [{ text }] : text);
}

/** Titre Anton en capitales, avec sa partie estompée. */
export function Title({ text, variant = 'h1', size, color, center, numberOfLines, style, accessibilityLabel, reveal }: TitleProps) {
  const contextInk = useInk();
  const ink = color ?? contextInk;
  const segments = typeof text === 'string' ? [{ text }] : text;
  // Un seul `Text` parent ; espaces des jointures au début du morceau suivant (voir `lib/runs`).
  const runs = normalizeRuns(segments);
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
      // Un titre ne se touche pas : sur iOS, `fitLineHeight` agrandit son cadre vers le haut et il couvrirait
      // les boutons juste au-dessus (la croix de Blowy+).
      pointerEvents="none"
      style={[composed, fitLineHeight(composed)]}
    >
      {reveal === undefined
        ? runs.map((s, i) => {
            const tint = runTint(s, dimColor);
            return tint ? (
              <RNText key={i} style={{ color: tint }}>
                {s.text}
              </RNText>
            ) : (
              s.text
            );
          })
        : revealSegments(runs, reveal, dimColor)}
    </RNText>
  );
}

const runTint = (s: TitleSegment, dimColor: string): string | undefined => s.color ?? (s.dim ? dimColor : undefined);

/**
 * Mots un à un ; au-delà de `count`, encre transparente (la mise en page ne bouge pas). Chaque mot porte l'espace qui
 * le précède : aucun morceau ne finit par une espace, aucun n'est fait que d'espaces.
 */
function revealSegments(runs: readonly TitleSegment[], count: number, dimColor: string) {
  return revealTokens(runs).map((t, i) => {
    const hidden = t.word >= count;
    const tint = hidden ? 'transparent' : runTint(t.run, dimColor);
    return tint ? (
      <RNText key={i} style={{ color: tint }}>
        {t.text}
      </RNText>
    ) : (
      t.text
    );
  });
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
  center: { textAlign: 'center' },
});
