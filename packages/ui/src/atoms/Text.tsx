import { font, type TypeName } from '@blowy/tokens';
import { createContext, useContext } from 'react';
import { Platform, Text as RNText, type TextProps as RNTextProps, type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { useInk, useMute } from '../lib/ink';
import { frenchChildren } from '../lib/runs';
import { opacity, type } from '../theme';

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

/** Vrai dans un `Text` : un `Text` imbriqué n'est qu'un morceau de la phrase (pas de cadre à lui). */
const InText = createContext(false);

/** Vrai quand ce composant est rendu à l'intérieur d'un `Text` (morceau de phrase). */
export const useInText = (): boolean => useContext(InText);

export function Text({ variant = 'body', color: tint, dim, muted, center, size, style, children, ...rest }: TextProps) {
  const ink = useInk();
  const mute = useMute();
  const nested = useContext(InText);
  const base = type[variant];
  const fg = tint ?? (muted ? mute : ink);
  const sized = size ? { fontSize: size, lineHeight: Math.round(size * (base.lineHeight / base.fontSize)) } : null;
  const composed = [base, { color: fg }, sized, dim && styles.dim, center && styles.center, style];
  // Un morceau imbriqué ne reçoit pas le recadrage iOS (marges et marge intérieure de `fitLineHeight`) : seul le
  // parent a un cadre. Les espaces normales avant « ? ! : ; » deviennent insécables (voir `lib/runs`).
  const text = (
    <RNText {...rest} style={nested ? inline(composed) : [composed, fitLineHeight(composed)]}>
      {frenchChildren(children)}
    </RNText>
  );
  return nested ? text : <InText.Provider value>{text}</InText.Provider>;
}

/**
 * Style d'un morceau imbriqué : seulement les attributs de texte. L'interlignage et le cadre (marges, marges
 * intérieures) sont ceux du parent ; sinon une ligne change de hauteur quand un mot coloré y apparaît.
 */
function inline(style: StyleProp<TextStyle>): TextStyle {
  const { lineHeight: _lh, padding: _p, paddingTop: _pt, paddingBottom: _pb, paddingVertical: _pv, margin: _m, marginTop: _mt, marginBottom: _mb, marginVertical: _mv, ...text } =
    StyleSheet.flatten(style) ?? {};
  return text;
}

/** Hauteur de ligne naturelle d'iOS (ascendante + descendante, en em) des polices de l'app. */
const NATURAL_LINE: Record<string, number> = { [font.display]: 1.505, [font.body]: 1.2, [font.bodyBold]: 1.2, [font.bodyHeavy]: 1.2 };
/** Marge de sécurité au-dessus des capitales accentuées d'Anton (É, À…), en em. */
const ACCENT_ROOM = 0.25;

const num = (...values: unknown[]): number => {
  for (const v of values) if (typeof v === 'number') return v;
  return 0;
};

/**
 * iOS cale le texte en bas d'une ligne plus serrée que la police (Anton à .96) et rogne le haut des glyphes.
 * On recentre chaque ligne comme le CSS des maquettes (demi-interlignage) et on agrandit le cadre dessiné
 * vers le haut (marge intérieure) sans bouger la mise en page (marges négatives).
 */
export function fitLineHeight(style: StyleProp<TextStyle>): TextStyle | null {
  if (Platform.OS !== 'ios') return null;
  const flat: TextStyle = StyleSheet.flatten(style) ?? {};
  const ratio = flat.fontFamily ? NATURAL_LINE[flat.fontFamily] : undefined;
  const { fontSize, lineHeight } = flat;
  if (!ratio || !fontSize || !lineHeight) return null;
  const overflow = ratio * fontSize - lineHeight;
  if (overflow <= 0) return null;
  const shift = overflow / 2;
  const room = overflow + (flat.fontFamily === font.display ? ACCENT_ROOM * fontSize : 0);
  return {
    paddingTop: num(flat.paddingTop, flat.paddingVertical, flat.padding) + room,
    marginTop: num(flat.marginTop, flat.marginVertical, flat.margin) - room + shift,
    marginBottom: num(flat.marginBottom, flat.marginVertical, flat.margin) - shift,
  };
}

const styles = StyleSheet.create({
  dim: { opacity: opacity.dim },
  center: { textAlign: 'center' },
});
