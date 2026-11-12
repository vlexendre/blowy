import { isValidElement, type ReactNode } from 'react';
import { ActivityIndicator, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { color, opacity, radius, size as sizes, space, veil } from '../theme';
import { Glyph, type GlyphName } from './Glyph';
import { Pressable } from './Pressable';
import { Text } from './Text';

export type ButtonVariant = 'accent' | 'white' | 'dark' | 'ghost' | 'glass' | 'danger' | 'link';
/** `chip` : pilule de 40 pt au libellé de puce (12 pt), comme « au hasard » dans un champ. */
export type ButtonSize = 'chip' | 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Pictogramme ou élément à gauche du libellé. */
  icon?: GlyphName | ReactNode;
  /** Pictogramme à droite (ex. `arrow`). */
  iconRight?: GlyphName;
  /** Élément libre à droite du libellé (puce « + » de Blowy+). */
  trailing?: ReactNode;
  /** Corps du libellé ; défaut 17 (14 en `sm`). */
  labelSize?: number;
  /** Complément estompé après le libellé (« (une seule fois) »). */
  hint?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Pleine largeur ; défaut : vrai sauf en `sm`. */
  block?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<ButtonVariant, { bg: string; ink: string; border?: string }> = {
  accent: { bg: color.accent, ink: color.dark },
  white: { bg: color.white, ink: color.dark },
  dark: { bg: color.dark, ink: color.white },
  ghost: { bg: veil.glass, ink: color.white, border: veil.glassStrong },
  glass: { bg: veil.track, ink: color.white },
  danger: { bg: color.danger, ink: color.white },
  /** Texte seul, gris (« pas cette fois » sous un bouton principal). */
  link: { bg: 'transparent', ink: color.mute },
};

const isGlyph = (v: unknown): v is GlyphName => typeof v === 'string';

/** Bouton pilule des maquettes (`.btn`). */
export function Button({ label, onPress, variant = 'accent', size = 'lg', icon, iconRight, trailing, labelSize, hint, loading, disabled, block, accessibilityLabel, accessibilityHint, style }: ButtonProps) {
  const v = VARIANTS[variant];
  const small = size === 'sm' || size === 'chip';
  const h = sizes.button[size === 'chip' ? 'sm' : size];
  const full = block ?? !small;
  const fontSize = labelSize ?? (size === 'chip' ? 12 : small ? 14 : 17);
  const off = disabled || loading;
  const glyphSize = small ? 14 : 18;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityLabel={accessibilityLabel ?? (hint ? `${label} ${hint}` : label)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      hitSlop={h < sizes.touch ? (sizes.touch - h) / 2 : undefined}
      style={[
        styles.base,
        { height: h, backgroundColor: v.bg, paddingHorizontal: size === 'chip' ? space.md + 2 : size === 'sm' ? space.lg : space.xl - 2 },
        v.border ? { borderWidth: sizes.border, borderColor: v.border } : null,
        full ? styles.block : styles.inline,
        disabled && !loading ? styles.disabled : null,
        style,
      ]}
    >
      <InkProvider value={v.ink}>
        {loading ? (
          <ActivityIndicator color={v.ink} />
        ) : (
          <View style={[layout.row, styles.content]}>
            {isGlyph(icon) ? <Glyph name={icon} size={glyphSize} /> : isValidElement(icon) ? icon : null}
            <Text variant="bodyHeavy" size={fontSize} numberOfLines={1}>
              {label}
              {hint ? <Text variant="body" size={fontSize} dim>{`  ${hint}`}</Text> : null}
            </Text>
            {iconRight ? <Glyph name={iconRight} size={glyphSize} /> : null}
            {trailing}
          </View>
        )}
      </InkProvider>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  block: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  content: { gap: space.sm + 2 },
  disabled: { opacity: opacity.disabled },
});
