import type { TypeName } from '@blowy/tokens';
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';

import { useInk } from '../lib/ink';
import { alpha, color, opacity, type } from '../theme';

export interface TextProps extends RNTextProps {
  /** Style typographique de `tokens.type`. Défaut : `body`. */
  variant?: TypeName;
  /** Couleur explicite ; sinon l'encre du conteneur (blanc sur la nuit, sombre sur un panneau clair). */
  color?: string;
  /** Partie estompée (opacité 0,38), comme `.dim` des maquettes. */
  dim?: boolean;
  /** Texte secondaire (`.mute`). */
  muted?: boolean;
  center?: boolean;
  /** Taille de police personnalisée ; l'interlignage suit la proportion du variant. */
  size?: number;
}

export function Text({ variant = 'body', color: tint, dim, muted, center, size, style, ...rest }: TextProps) {
  const ink = useInk();
  const base = type[variant];
  const fg = tint ?? (muted ? (ink === color.white ? color.mute : alpha(ink, opacity.mute)) : ink);
  const sized = size ? { fontSize: size, lineHeight: Math.round(size * (base.lineHeight / base.fontSize)) } : null;
  return <RNText {...rest} style={[base, { color: fg }, sized, dim && styles.dim, center && styles.center, style]} />;
}

const styles = StyleSheet.create({
  dim: { opacity: opacity.dim },
  center: { textAlign: 'center' },
});
