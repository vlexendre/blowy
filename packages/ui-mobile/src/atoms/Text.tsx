import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { color, textStyle, type TextVariant } from '../foundations/theme';

export type TextColor = 'ink' | 'inkSoft' | 'muted' | 'white' | 'coral' | 'violet' | 'lime' | 'danger' | 'success' | 'sunShadow';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextColor;
  align?: 'left' | 'center' | 'right';
}

const COLOR: Record<TextColor, string> = {
  ink: color.ink,
  inkSoft: color.inkSoft,
  muted: color.muted,
  white: color.white,
  coral: color.coral,
  violet: color.violet,
  lime: color.lime,
  danger: color.danger,
  success: color.success,
  sunShadow: color.sunShadow,
};

/** Les titres display limitent l'agrandissement pour rester dans l'écran ; le corps suit la police système. */
const MAX_SCALE: Partial<Record<TextVariant, number>> = { displayXL: 1.3, displayL: 1.35, displayM: 1.5, button: 1.5, caption: 1.6 };

export function Text({ variant = 'body', tone = 'ink', align, style, ...rest }: TextProps) {
  const isHeading = variant.startsWith('display');
  return (
    <RNText
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={MAX_SCALE[variant] ?? 2}
      {...rest}
      style={[textStyle[variant], { color: COLOR[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}
