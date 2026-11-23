import { Text as RNText, type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { useInk } from '../lib/ink';
import { countRunWords, normalizeRuns, revealTokens } from '../lib/runs';
import { DISPLAY_SCALE, displayLeading, displaySize, displayTracking } from '@blowy/tokens';

import { alpha, opacity, type } from '../theme';
import type { TitleContent, TitleSegment } from '../types';
import { fitLineHeight, scaleCap } from './Text';

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

/** Chasse des capitales d'Allo ExtraBold (em, mesurée), pour estimer la largeur d'une ligne de titre sans la rendre. */
const ALLO: Record<string, number> = {
  A: 0.754, B: 0.656, C: 0.736, D: 0.715, E: 0.607, F: 0.576, G: 0.751, H: 0.735, I: 0.275, J: 0.581, K: 0.724, L: 0.558, M: 0.926,
  N: 0.752, O: 0.768, P: 0.643, Q: 0.776, R: 0.652, S: 0.646, T: 0.658, U: 0.712, V: 0.752, W: 1.046, X: 0.748, Y: 0.734, Z: 0.666,
  '.': 0.341, ',': 0.341, '!': 0.347, '?': 0.565, ':': 0.341, '’': 0.319, "'": 0.343, ' ': 0.209, '-': 0.458, '%': 0.968, '+': 0.665,
  '0': 0.677, '1': 0.429, '2': 0.623, '3': 0.642, '4': 0.674, '5': 0.619, '6': 0.647, '7': 0.574, '8': 0.65, '9': 0.647,
};
const glyphEm = (ch: string): number => (ALLO[ch] ?? ALLO[ch.normalize('NFD')[0] ?? ''] ?? 0.7) + displayTracking;

/**
 * Largeur de la ligne la plus longue d'un titre, par point de taille « de maquette » (la taille passée à `Title`) :
 * multiplier par la taille donne des points.
 */
export function titleWidthEm(text: TitleContent): number {
  const raw = typeof text === 'string' ? text : text.map((s) => s.text).join('');
  return Math.max(0, ...raw.toUpperCase().split('\n').map((line) => [...line.trim()].reduce((w, ch) => w + glyphEm(ch), 0))) * DISPLAY_SCALE;
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

/** Titre en capitales (Allo ExtraBold), avec sa partie estompée. `size` est une taille de maquette (`displaySize`). */
export function Title({ text, variant = 'h1', size, color, center, numberOfLines, style, accessibilityLabel, reveal }: TitleProps) {
  const contextInk = useInk();
  const ink = color ?? contextInk;
  const segments = typeof text === 'string' ? [{ text }] : text;
  // Un seul `Text` parent ; espaces des jointures au début du morceau suivant (voir `lib/runs`).
  const runs = normalizeRuns(segments);
  const fontSize = size === undefined ? type[variant].fontSize : displaySize(size);
  const metrics = { fontSize, lineHeight: Math.round(fontSize * displayLeading), letterSpacing: fontSize * displayTracking };
  const dimColor = alpha(ink, opacity.dim);
  const composed = [type[variant], styles.base, { color: ink }, metrics, center && styles.center, style];
  return (
    <RNText
      maxFontSizeMultiplier={Math.min(1.5, scaleCap(fontSize) ?? 1.5)}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? segments.map((s) => s.text).join('')}
      numberOfLines={numberOfLines}
      // Un titre ne se touche pas : `fitLineHeight` agrandit son cadre vers le haut (iOS, web) et il couvrirait
      // les boutons juste au-dessus (la croix de Minimoa+).
      pointerEvents="none"
      style={[composed, fitLineHeight(composed, { lines: numberOfLines })]}
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
