/**
 * Thème natif dérivé de @blowy/design-tokens. Aucune couleur n'est écrite en dur ailleurs
 * dans ui-mobile ou apps/mobile : tout passe par `color`, `tone` et `textStyle`.
 */
import { color, font, glass, hardShadow, motion, radius, space, touch, type } from '@blowy/design-tokens';
import type { TextStyle, ViewStyle } from 'react-native';

export { color, glass, motion, radius, space, touch };

/** Familles chargées par expo-font (noms exportés par @expo-google-fonts). */
export const fontFamily = {
  display: 'BricolageGrotesque_800ExtraBold',
  bodyRegular: 'Inter_400Regular',
  body: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  bodyHeavy: 'Inter_800ExtraBold',
} as const;
export const fontFallback = { display: font.displayFallback, body: font.bodyFallback } as const;

export type TextVariant = 'displayXL' | 'displayL' | 'displayM' | 'displayS' | 'button' | 'body' | 'bodyStrong' | 'small' | 'label' | 'caption';

const display = (size: number, lineHeight: number, letterSpacing: number): TextStyle => ({
  fontFamily: fontFamily.display,
  fontSize: size,
  lineHeight,
  letterSpacing,
  textTransform: 'uppercase',
});

/** Styles typographiques (taille de base ; la police dynamique est gérée par <Text>). */
export const textStyle: Readonly<Record<TextVariant, TextStyle>> = {
  displayXL: display(type.displayXL.size, type.displayXL.lineHeight, type.displayXL.letterSpacing),
  displayL: display(type.displayL.size, type.displayL.lineHeight, type.displayL.letterSpacing),
  displayM: display(type.displayM.size, type.displayM.lineHeight + 2, type.displayM.letterSpacing),
  displayS: { fontFamily: fontFamily.display, fontSize: 18, lineHeight: 20, letterSpacing: -0.4 },
  button: { fontFamily: fontFamily.display, fontSize: type.button.size, lineHeight: type.button.lineHeight, letterSpacing: type.button.letterSpacing, textTransform: 'uppercase' },
  body: { fontFamily: fontFamily.body, fontSize: type.body.size, lineHeight: type.body.lineHeight },
  bodyStrong: { fontFamily: fontFamily.bodyBold, fontSize: type.body.size, lineHeight: type.body.lineHeight },
  small: { fontFamily: fontFamily.body, fontSize: type.small.size, lineHeight: type.small.lineHeight },
  label: { fontFamily: fontFamily.bodyHeavy, fontSize: type.label.size, lineHeight: type.label.lineHeight, letterSpacing: type.label.letterSpacing, textTransform: 'uppercase' },
  caption: { fontFamily: fontFamily.bodyBold, fontSize: 10, lineHeight: 13, letterSpacing: 0.6, textTransform: 'uppercase' },
};

/** Tons sémantiques : fond, texte, ombre dure. */
export type Tone = 'coral' | 'ink' | 'lime' | 'white' | 'violet' | 'cream' | 'sun' | 'danger' | 'success';

export const tone: Readonly<Record<Tone, { bg: string; fg: string; shadow: string; accent: string }>> = {
  coral: { bg: color.coral, fg: color.white, shadow: hardShadow.button.colorFor.coral, accent: color.white },
  ink: { bg: color.ink, fg: color.white, shadow: hardShadow.button.colorFor.ink, accent: color.lime },
  lime: { bg: color.lime, fg: color.ink, shadow: hardShadow.button.colorFor.lime, accent: color.ink },
  white: { bg: color.white, fg: color.ink, shadow: hardShadow.button.colorFor.white, accent: color.coral },
  violet: { bg: color.violet, fg: color.white, shadow: color.violetShadow, accent: color.lime },
  cream: { bg: color.creamDeep, fg: color.ink, shadow: color.creamShadow, accent: color.coral },
  sun: { bg: color.sun, fg: color.ink, shadow: color.sunShadow, accent: color.ink },
  danger: { bg: color.danger, fg: color.white, shadow: color.coralShadow, accent: color.white },
  success: { bg: color.success, fg: color.white, shadow: color.ink, accent: color.white },
};

/** Ombre dure verticale (aucune diffusion), version RN 0.76+ `boxShadow`. */
export const hard = (offsetY: number, shadowColor: string): ViewStyle => ({
  boxShadow: [{ offsetX: 0, offsetY, blurRadius: 0, spreadDistance: 0, color: shadowColor }],
});

export const cardShadow = hard(hardShadow.card.offsetY, hardShadow.card.color);
export const buttonOffset = hardShadow.button.offsetY;

/** Voile sombre lisible sur les scènes (étiquettes de lieu). */
export const scrim = { strong: 'rgba(22,17,13,0.8)', medium: 'rgba(22,17,13,0.55)', overlay: 'rgba(22,17,13,0.45)', ground: 'rgba(90,30,0,0.22)', sheet: 'rgba(22,17,13,0.4)', floating: 'rgba(22,17,13,0.24)' } as const;
