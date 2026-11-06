/**
 * Style `.d` des maquettes : Bricolage Grotesque 800, largeur 85 %, opsz = taille, interlettrage
 * −0,03 em, interligne 0,95. Le texte est écrit tel quel (pas de mise en capitales automatique,
 * « blowy. » est en minuscules). Pour les mots « tampon » inclinés, voir <Stamp>.
 */
import { Text as RNText, type StyleProp, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { color } from '../foundations/theme';
import { displayTextStyle } from './styles';

export interface DisplayTextProps extends Omit<RNTextProps, 'style'> {
  /** Taille en px (une instance opsz existe pour chaque taille de `opticalSizes.display`). */
  size: number;
  color?: string;
  /** Interligne relatif (0,95 par défaut ; quelques titres utilisent 0,9 / 0,92 / 1). */
  lineHeight?: number;
  /** Interlettrage en em (−0,03 par défaut ; logo `.logo` : −0,04). */
  letterSpacingEm?: number;
  /** Rôle titre pour les lecteurs d'écran (vrai par défaut). */
  heading?: boolean;
  style?: StyleProp<TextStyle>;
}


export function DisplayText({ size, color: ink = color.ink, lineHeight, letterSpacingEm, heading = true, style, ...rest }: DisplayTextProps) {
  return <RNText accessibilityRole={heading ? 'header' : undefined} maxFontSizeMultiplier={1.3} {...rest} style={[displayTextStyle(size, ink, lineHeight, letterSpacingEm), style]} />;
}
