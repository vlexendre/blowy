/**
 * Résolveurs de style PURS des atomes (aucun import React Native à l'exécution) : valeurs exactes
 * des maquettes, testées sous Node (styles.test.ts). Les composants ne font que les appliquer.
 */
import type { TextStyle, ViewStyle } from 'react-native';
import { alpha, color, hard, radii, shadow3d, textSpec, tone, touch, type Tone } from '../foundations/theme';
import { bodyFont, displayFont, strongFont } from '../foundations/typography';

export type StampTone = 'ink' | 'lime';
export type ButtonVariant = 'b1' | 'b2' | 'b3' | 'lime' | 'link' | 'ghost' | 'danger' | 'violet' | 'primary' | 'secondary' | 'dark';
export type ButtonSize = 'lg' | 'md' | 'sm';

export const captionBox: ViewStyle = { alignSelf: 'center', backgroundColor: color.ink, borderRadius: radii.caption, paddingVertical: 9, paddingHorizontal: 13 };

type Solid = 'b1' | 'b2' | 'b3' | 'lime' | 'danger' | 'violet';
const ALIAS: Partial<Record<ButtonVariant, Solid>> = { primary: 'b1', dark: 'b2', secondary: 'b3' };

/** Fond, encre, ombre d'une variante pleine (valeurs exactes de la maquette). */
export const BUTTON_SURFACE: Record<Solid, { bg: string; fg: string; shadow: string }> = {
  b1: { bg: color.coral, fg: color.white, shadow: shadow3d.b1.color },
  b2: { bg: color.ink, fg: color.white, shadow: shadow3d.b2.color },
  b3: { bg: color.white, fg: color.ink, shadow: shadow3d.b3.color },
  lime: { bg: color.lime, fg: color.ink, shadow: shadow3d.bl.color },
  danger: { bg: tone.danger.bg, fg: tone.danger.fg, shadow: '#8E1A1A' },
  violet: { bg: tone.violet.bg, fg: tone.violet.fg, shadow: tone.violet.shadow },
};

const HEIGHT: Record<ButtonSize, number> = { lg: 56, md: 48, sm: 44 };
const FONT: Record<ButtonSize, number> = { lg: 18, md: 16, sm: 15 };

export function resolveButton(variant: ButtonVariant, size: ButtonSize = 'lg'): { kind: 'solid' | 'text'; box: ViewStyle; text: TextStyle; surface?: { bg: string; fg: string; shadow: string } } {
  if (variant === 'link' || variant === 'ghost') {
    const sp = variant === 'link' ? textSpec.link : textSpec.ghost;
    return {
      kind: 'text',
      box: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: variant === 'link' ? 20 : 0 },
      text: { ...bodyFont(sp.size, sp.weight, sp.letterSpacingEm), color: color.ink },
    };
  }
  const surface = BUTTON_SURFACE[ALIAS[variant] ?? (variant as Solid)];
  return {
    kind: 'solid',
    surface,
    box: { minHeight: HEIGHT[size], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
    text: { ...strongFont(FONT[size], textSpec.button.letterSpacingEm), textTransform: 'uppercase', color: surface.fg },
  };
}


/** Style de surface selon l'état (pur, testé). */
export function pressable3DStyle(background: string, shadowColor: string, depth: number, pressDepth: number, radius: number, pressed: boolean, disabled: boolean): ViewStyle {
  return {
    minHeight: touch.minTarget,
    minWidth: touch.minTarget,
    borderRadius: radius,
    backgroundColor: background,
    opacity: disabled ? 0.5 : 1,
    ...(pressed ? { transform: [{ translateY: pressDepth }] } : depth > 0 ? hard(depth, shadowColor) : null),
  };
}

export function stampStyle(tone: StampTone = 'ink', rotate?: number): ViewStyle {
  const ink = tone === 'ink';
  const sh = ink ? shadow3d.stampPet : shadow3d.stampLime;
  return {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ink ? color.ink : color.lime,
    borderRadius: ink ? radii.stampPet : radii.stampLime,
    paddingTop: ink ? 0 : 2,
    paddingHorizontal: 12,
    paddingBottom: 6,
    transform: [{ rotate: `${rotate ?? (ink ? -3 : -2)}deg` }],
    boxShadow: [{ offsetX: 0, offsetY: sh.y, blurRadius: 0, spreadDistance: 0, color: sh.color }],
  };
}

export function cardStyle(variant: 'card' | 'group' = 'card', highlighted = false): ViewStyle {
  return {
    backgroundColor: color.white,
    borderRadius: variant === 'card' ? radii.card : radii.group,
    overflow: variant === 'group' ? 'hidden' : 'visible',
    boxShadow: [{ offsetX: 0, offsetY: shadow3d.card.y, blurRadius: 0, spreadDistance: 0, color: shadow3d.card.color }],
    ...(highlighted ? { borderWidth: 3, borderColor: color.lime } : null),
  };
}

export function chipStyle(t: Tone, size: 'sm' | 'md', drop: 'soft' | 'strong' | 'none'): { box: ViewStyle; fg: string } {
  const tk = tone[t];
  const bg = t === 'white' ? color.white : tk.bg;
  const sh = drop === 'soft' ? shadow3d.chip : drop === 'strong' ? shadow3d.chipStrong : null;
  return {
    fg: tk.fg,
    box: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: radii.pill,
      paddingVertical: size === 'md' ? 6 : 5,
      paddingHorizontal: size === 'md' ? 12 : 10,
      backgroundColor: bg,
      ...(sh ? { boxShadow: [{ offsetX: 0, offsetY: sh.y, blurRadius: 0, spreadDistance: 0, color: sh.color }] } : null),
    },
  };
}

export function badgeStyle(kind: 'count' | 'plus', bg: string, ring: boolean): ViewStyle {
  return {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: bg,
    ...(kind === 'count' ? { minWidth: 16, height: 16, paddingHorizontal: 4 } : { height: 15, paddingHorizontal: 5 }),
    ...(ring ? { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 2, color: alpha.badgeRing }] } : null),
  };
}

export function labelStyle(variant: 'lbl' | 'tagline' = 'lbl', ink: string = color.muted): TextStyle {
  const sp = textSpec[variant];
  return { ...bodyFont(sp.size, sp.weight, sp.letterSpacingEm), textTransform: 'uppercase', color: ink };
}

export function displayTextStyle(size: number, ink: string = color.ink, lineHeight?: number, letterSpacingEm?: number): TextStyle {
  return { ...displayFont(size, { lineHeight, letterSpacingEm }), color: ink };
}
