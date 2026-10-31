/**
 * Jetons de design Blowy — extraits de la maquette « V4 finale » (design/v4-reference).
 * Source unique pour mobile (ui-mobile), web et admin (ui-web). Contrastes vérifiés dans
 * design-tokens/src/contrast.test.ts.
 */
export const color = {
  cream: '#FFF7EC',
  creamDeep: '#F4EADC',
  creamShadow: '#EEDFCB',
  ink: '#16110D',
  inkSoft: '#5A5047',
  muted: '#8A7E70',
  mutedLight: '#A79C90',
  white: '#FFFFFF',
  coral: '#FF5A3C',
  coralShadow: '#C4341B',
  pink: '#FF3D7F',
  pinkShadow: '#B81F55',
  mango: '#FFB347',
  sun: '#FFE36E',
  sunShadow: '#C97A12',
  lime: '#C8F542',
  violet: '#7C3AED',
  violetDeep: '#4C1D95',
  violetShadow: '#2E1065',
  violetLight: '#EDE4FF',
  cyan: '#22D3EE',
  danger: '#D92D2D',
  success: '#2E9E4F',
} as const;

export type ColorToken = keyof typeof color;

export const space = { xxs: 4, xs: 6, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32 } as const;
export const radius = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 30, pill: 999 } as const;

/** Ombre « bouton 3D » : décalage vertical dur, aucune diffusion. */
export const hardShadow = {
  button: { offsetY: 5, colorFor: { coral: color.coralShadow, ink: '#000000', lime: color.ink, white: color.creamShadow } },
  card: { offsetY: 4, color: color.creamShadow },
} as const;

export const font = {
  display: 'Bricolage Grotesque',
  displayFallback: 'System',
  body: 'Inter',
  bodyFallback: 'System',
} as const;

export const type = {
  displayXL: { family: font.display, size: 48, weight: '800', letterSpacing: -1.4, lineHeight: 46 },
  displayL: { family: font.display, size: 36, weight: '800', letterSpacing: -1, lineHeight: 35 },
  displayM: { family: font.display, size: 24, weight: '800', letterSpacing: -0.7, lineHeight: 24 },
  button: { family: font.display, size: 18, weight: '800', letterSpacing: 0.2, lineHeight: 22 },
  body: { family: font.body, size: 14, weight: '600', letterSpacing: 0, lineHeight: 20 },
  small: { family: font.body, size: 12, weight: '600', letterSpacing: 0, lineHeight: 16 },
  label: { family: font.body, size: 11, weight: '800', letterSpacing: 1.5, lineHeight: 14 },
} as const;

export const touch = { minTarget: 44 } as const;
export const motion = { pop: 550, reaction: 3000 } as const;

/** Chrome UI translucide (barre d'onglets) avec repli opaque accessible. */
export const glass = { tint: 'rgba(255,247,236,0.72)', opaqueFallback: color.cream } as const;

export * from './contrast.js';
