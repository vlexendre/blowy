/**
 * Texte Inter des maquettes V5, propriété CSS par propriété : `font-size`, `font-weight`
 * (800 rendu 700 : Inter n'est chargée que jusqu'à 700), `color`, `line-height` (multiplicateur ;
 * absent = `normal`), `letter-spacing` (em), capitales, alignement. Une seule instance de police
 * par graisse (jamais de gras synthétique).
 */
import { Text as RNText, type StyleProp, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { v5 } from '../foundations/theme';
import { bodyFont, type BodyWeight } from '../foundations/typography';

export interface BodyTextProps extends Omit<RNTextProps, 'style'> {
  size?: number;
  weight?: BodyWeight;
  color?: string;
  /** Interligne relatif (CSS `line-height: 1.45`) ; absent = `normal`. */
  lh?: number;
  /** Interlettrage en em. */
  ls?: number;
  upper?: boolean;
  align?: 'left' | 'center' | 'right';
  /** `white-space: nowrap` (une ligne, sans ellipse si `ellipsis` est faux). */
  nowrap?: boolean;
  ellipsis?: boolean;
  style?: StyleProp<TextStyle>;
}

export function bodyTextStyle({ size = 14, weight = 600, color = v5.ink, lh, ls, upper, align }: Pick<BodyTextProps, 'size' | 'weight' | 'color' | 'lh' | 'ls' | 'upper' | 'align'>): TextStyle {
  return {
    ...bodyFont(size, weight, ls ?? 0, lh !== undefined ? size * lh : undefined),
    color,
    ...(upper ? { textTransform: 'uppercase' as const } : null),
    ...(align ? { textAlign: align } : null),
  };
}

export function BodyText({ size, weight, color, lh, ls, upper, align, nowrap, ellipsis, style, numberOfLines, ...rest }: BodyTextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      numberOfLines={numberOfLines ?? (nowrap || ellipsis ? 1 : undefined)}
      ellipsizeMode={ellipsis ? 'tail' : 'clip'}
      {...rest}
      style={[bodyTextStyle({ size, weight, color, lh, ls, upper, align }), style]}
    />
  );
}
