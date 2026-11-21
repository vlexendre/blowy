import { displaySize, displayTracking, font, type TypeName } from '@blowy/tokens';
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
  /** Taille de police personnalisée ; l'interlignage suit la proportion du variant. Relevée à 13 pt au moins. */
  size?: number;
  /**
   * Seule exception au plancher de 13 pt : les libellés de la barre d'onglets (comme ceux d'iOS, 10 pt), toujours
   * doublés d'une icône. Ne pas l'utiliser ailleurs.
   */
  tabLabel?: boolean;
}

/**
 * Plancher de lisibilité : aucun texte de l'app sous 13 pt (règle du design, `docs/DESIGN.md`). Une taille plus petite
 * demandée par un composant est relevée ici, interlignage compris.
 */
export const MIN_TEXT_SIZE = 13;

/** Les styles de titre (Allo ExtraBold en capitales). */
export const isDisplayVariant = (v: TypeName): boolean => v === 'hero' || v === 'h1' || v === 'h2' || v === 'h3';

/**
 * Corps rendu d'un texte : une taille de titre écrite dans le code est une taille de maquette, rendue à
 * `DISPLAY_SCALE` près (voir `@blowy/tokens`).
 */
export const renderedSize = (variant: TypeName, size?: number): number =>
  size === undefined ? type[variant].fontSize : isDisplayVariant(variant) ? displaySize(size) : size;

/** Vrai dans un `Text` : un `Text` imbriqué n'est qu'un morceau de la phrase (pas de cadre à lui). */
const InText = createContext(false);

/** Vrai quand ce composant est rendu à l'intérieur d'un `Text` (morceau de phrase). */
export const useInText = (): boolean => useContext(InText);

export function Text({ variant = 'body', color: tint, dim, muted, center, size, tabLabel, style, children, ...rest }: TextProps) {
  const ink = useInk();
  const mute = useMute();
  const nested = useContext(InText);
  const base = type[variant];
  const fg = tint ?? (muted ? mute : ink);
  const wanted = renderedSize(variant, size);
  const px = tabLabel ? wanted : Math.max(MIN_TEXT_SIZE, wanted);
  const sized =
    size || wanted < MIN_TEXT_SIZE
      ? { fontSize: px, lineHeight: Math.round(px * (base.lineHeight / base.fontSize)), ...(isDisplayVariant(variant) ? { letterSpacing: px * displayTracking } : null) }
      : null;
  // Relevé au plancher : l'interlignage serré prévu pour la petite taille ferait chevaucher les lignes.
  const raised = px !== wanted ? { lineHeight: Math.round(px * 1.25) } : null;
  const composed = [base, { color: fg }, sized, dim && styles.dim, center && styles.center, style, raised];
  // Un morceau imbriqué ne reçoit pas le recadrage iOS (marges et marge intérieure de `fitLineHeight`) : seul le
  // parent a un cadre. Les espaces normales avant « ? ! : ; » deviennent insécables (voir `lib/runs`).
  const text = (
    // Grandit avec la taille de texte du système, mais au plus de 30 % : au-delà, les écrans denses débordent.
    <RNText maxFontSizeMultiplier={1.3} {...rest} style={nested ? inline(composed) : [composed, fitLineHeight(composed, { lines: rest.numberOfLines })]}>
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
const NATURAL_LINE: Record<string, number> = { [font.body]: 1.21, [font.bodyBold]: 1.21, [font.bodyHeavy]: 1.21 };
/** Marge de sécurité au-dessus des capitales accentuées des titres (É, À…), en em. */
const ACCENT_ROOM = 0.12;

/**
 * Allo ExtraBold, mesuré dans la police (2048 unités par em) : ascendante 1984, descendante 494 ; le haut des capitales
 * accentuées (É Ê È À Ô…) monte à 1982, la cédille de Ç descend à −416.
 */
const DISPLAY = { ascent: 1984 / 2048, descent: 494 / 2048, markTop: 1982 / 2048, markBottom: 416 / 2048 } as const;

/** Un titre : la police des titres en capitales (la même graisse en minuscules reste un texte ordinaire). */
const isDisplayStyle = (flat: TextStyle): boolean => flat.fontFamily === font.display && flat.textTransform === 'uppercase';
/** Pixel d'antialiasing en plus, au-dessus et au-dessous. */
const EDGE = 1;

const num = (...values: unknown[]): number => {
  for (const v of values) if (typeof v === 'number') return v;
  return 0;
};

export interface FitOptions {
  /**
   * Nombre de lignes du texte s'il est tronqué (`numberOfLines`). Sur le web, au-delà d'une ligne, la troncature
   * coupe au bas de la dernière ligne gardée : on n'agrandit alors pas le cadre vers le bas (la ligne suivante, cachée,
   * y apparaîtrait).
   */
  lines?: number;
}

/**
 * Interlignage plus serré que la police (titres à 1,02) : sans rien faire, le haut des glyphes est rogné.
 *
 * - iOS cale le texte en bas d'une ligne plus serrée que la police (React Native 0.88, sans décalage de ligne de base
 *   quand la ligne est comprimée) et rogne le haut des glyphes. On recentre chaque ligne comme le CSS des maquettes
 *   (demi-interlignage) et on agrandit le cadre dessiné vers le haut (marge intérieure) sans bouger la mise en page
 *   (marges négatives). La place gardée en haut (dépassement + `ACCENT_ROOM`) couvre les accents des capitales.
 * - Le web centre déjà chaque ligne (demi-interlignage) mais un texte tronqué (`numberOfLines`) coupe tout ce qui
 *   sort de sa boîte : les accents des capitales (« VOCÊ » devenait « VOCE ») et la cédille de Ç. On agrandit la
 *   boîte de ce qui dépasse, en haut et en bas, sans bouger la mise en page (marges négatives).
 */
export function fitLineHeight(style: StyleProp<TextStyle>, options: FitOptions = {}): TextStyle | null {
  const flat: TextStyle = StyleSheet.flatten(style) ?? {};
  const { fontSize, lineHeight } = flat;
  if (!fontSize || !lineHeight) return null;
  if (Platform.OS === 'web') return fitWebBox(flat, fontSize, lineHeight, options);
  if (Platform.OS !== 'ios') return null;
  const ratio = flat.fontFamily ? NATURAL_LINE[flat.fontFamily] : undefined;
  if (!ratio) return null;
  const overflow = ratio * fontSize - lineHeight;
  if (overflow <= 0) return null;
  const shift = overflow / 2;
  const room = overflow + (isDisplayStyle(flat) ? ACCENT_ROOM * fontSize : 0);
  return {
    paddingTop: num(flat.paddingTop, flat.paddingVertical, flat.padding) + room,
    marginTop: num(flat.marginTop, flat.marginVertical, flat.margin) - room + shift,
    marginBottom: num(flat.marginBottom, flat.marginVertical, flat.margin) - shift,
  };
}

/** Web : ce qui dépasse de la boîte d'un titre (lignes centrées par le navigateur), rendu à la boîte. */
function fitWebBox(flat: TextStyle, fontSize: number, lineHeight: number, { lines }: FitOptions): TextStyle | null {
  if (!isDisplayStyle(flat)) return null;
  const baseline = (lineHeight - (DISPLAY.ascent + DISPLAY.descent) * fontSize) / 2 + DISPLAY.ascent * fontSize;
  const top = Math.ceil(Math.max(0, DISPLAY.markTop * fontSize - baseline)) + EDGE;
  const bottom = lines !== undefined && lines > 1 ? 0 : Math.ceil(Math.max(0, baseline + DISPLAY.markBottom * fontSize - lineHeight)) + EDGE;
  return {
    paddingTop: num(flat.paddingTop, flat.paddingVertical, flat.padding) + top,
    paddingBottom: num(flat.paddingBottom, flat.paddingVertical, flat.padding) + bottom,
    marginTop: num(flat.marginTop, flat.marginVertical, flat.margin) - top,
    marginBottom: num(flat.marginBottom, flat.marginVertical, flat.margin) - bottom,
  };
}

const styles = StyleSheet.create({
  dim: { opacity: opacity.dim },
  center: { textAlign: 'center' },
});
