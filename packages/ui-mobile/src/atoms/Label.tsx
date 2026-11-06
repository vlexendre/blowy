/** `.lbl` : 11 px, 800 (rendu 700), interlettrage .14em, capitales. */
import { Text as RNText, type StyleProp, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { color } from '../foundations/theme';
import { labelStyle } from './styles';

export interface LabelProps extends Omit<RNTextProps, 'style'> {
  color?: string;
  /** `tagline` = « pets & potes » (.12em) ; `lbl` par défaut. */
  variant?: 'lbl' | 'tagline';
  style?: StyleProp<TextStyle>;
}


export function Label({ color: ink = color.muted, variant = 'lbl', style, ...rest }: LabelProps) {
  return <RNText maxFontSizeMultiplier={1.6} {...rest} style={[labelStyle(variant, ink), style]} />;
}
