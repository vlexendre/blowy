import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { InkProvider } from '../lib/ink';
import { hitSlopFor } from '../lib/styles';
import { color, opacity, veil } from '../theme';
import { Badge } from './Badge';
import { Glyph, type GlyphName } from './Glyph';
import { Pressable } from './Pressable';

/** `back` : rond de retour des maquettes (`.back`, blanc à 12 %). */
export type IconButtonVariant = 'glass' | 'back' | 'accent' | 'dark' | 'white' | 'plain';

export interface IconButtonProps {
  /** Libellé lu par le lecteur d'écran (obligatoire : le bouton n'a pas de texte). */
  label: string;
  onPress?: () => void;
  glyph?: GlyphName;
  /** Contenu libre à la place du pictogramme (ex. `<Icon name="cadeau" />`). */
  icon?: ReactNode;
  variant?: IconButtonVariant;
  /** Diamètre visuel ; la zone de toucher fait au moins 44. Défaut 44. */
  size?: number;
  badge?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BG: Record<IconButtonVariant, { bg: string; ink: string }> = {
  glass: { bg: veil.glass, ink: color.white },
  back: { bg: veil.track, ink: color.white },
  accent: { bg: color.accent, ink: color.dark },
  dark: { bg: color.dark, ink: color.white },
  white: { bg: color.white, ink: color.dark },
  plain: { bg: 'transparent', ink: color.white },
};

/** Bouton rond à pictogramme (retour, +, fermer, envoyer). */
export function IconButton({ label, onPress, glyph, icon, variant = 'glass', size = 44, badge, disabled, style }: IconButtonProps) {
  const v = BG[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={hitSlopFor(size)}
      scaleTo={0.9}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: v.bg }, disabled && styles.disabled, style]}
    >
      <InkProvider value={v.ink}>{glyph ? <Glyph name={glyph} size={Math.round(size * 0.4)} /> : icon}</InkProvider>
      {badge ? (
        <View style={styles.badge} pointerEvents="none">
          <Badge count={badge} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: opacity.disabled },
  badge: { position: 'absolute', top: -4, right: -4 },
});
