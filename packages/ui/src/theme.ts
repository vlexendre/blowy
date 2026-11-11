/**
 * Extension locale des jetons (@blowy/tokens) pour les besoins propres aux composants.
 * Toute couleur de packages/ui vient d'ici ou de @blowy/tokens : aucun hexadécimal ailleurs.
 */
import { color, type GradientName, gradient, radius, space, speciesColor, speciesGradient, type } from '@blowy/tokens';

export { color, gradient, radius, space, speciesColor, speciesGradient, type };
export type { GradientName };

/** Jetons absents de @blowy/tokens (à remonter si l'app ou le site en ont besoin). */
export const extra = {
  /** Cœurs des vies (maquettes : `.hearts i`). */
  heart: '#FF3D6E',
  /** Fond des remplissages de photo en attente (dégradé « ciel » des maquettes). */
  sky: '#5CE1FF',
} as const;

/** `#RRGGBB` + opacité → `rgba()`. Sert aux voiles blancs / sombres des maquettes (rgba(255,255,255,.1)…). */
export function alpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Voiles récurrents (blanc ou encre sur un fond). */
export const veil = {
  line: alpha(color.white, 0.08),
  hairline: alpha(color.white, 0.07),
  glass: alpha(color.white, 0.1),
  glassStrong: alpha(color.white, 0.14),
  track: alpha(color.white, 0.12),
  off: alpha(color.white, 0.18),
  text: alpha(color.white, 0.85),
  scrim: alpha(color.night, 0.7),
  darkGlass: alpha(color.dark, 0.35),
  darkLabel: alpha(color.dark, 0.55),
} as const;

/** Couleur d'encre (texte) à utiliser sur chaque dégradé. */
export const onGradient: Record<GradientName, string> = {
  accent: color.dark,
  orange: color.dark,
  coral: color.white,
  violet: color.white,
  rose: color.dark,
  wine: color.white,
  night: color.white,
};

/** Opacités partagées. `dim` = la partie estompée des titres (`.dim` des maquettes). */
export const opacity = { dim: 0.38, mute: 0.7, disabled: 0.4, ghost: 0.5 } as const;

/** Tailles d'interaction et de composants. */
export const size = {
  touch: 44,
  button: { sm: 40, md: 48, lg: 56 },
  tabBar: 66,
  heart: 14,
  border: 1,
  ring: 2,
} as const;

/** Ombres portées (iOS / web) + élévation Android. */
export const shadow = {
  soft: { shadowColor: color.night, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  lift: { shadowColor: color.night, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
} as const;

/** Durées et ressorts des micro-animations. */
export const motion = {
  press: { damping: 18, stiffness: 420, mass: 0.6 },
  pop: { damping: 14, stiffness: 180 },
  fast: 160,
  base: 240,
  slow: 420,
  breath: 1300,
} as const;
