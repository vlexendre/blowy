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
  /** Aperçu du dernier message dans la liste des chats (blanc teinté de lavande). */
  preview: '#D8D3EC',
  /** Dégradé rose pâle du niveau d'un lien (V6-Lien, `#FF8FC6 → #FFC4DF`). */
  roseLight: ['#FF8FC6', '#FFC4DF'] as const,
  /** Contour d'un bouton radio éteint (`.rad`). */
  radioOff: '#5A5480',
  /** Fond plein écran d'un lien fantôme (V6-Fantome). */
  ghost: ['#2A0F2E', '#8C1D4F'] as const,
  /** Disque de l'avatar fantôme et nom au-dessus de sa bulle. */
  ghostDisc: '#3A3550',
  ghostInk: '#E9E4FF',
  /** Corail clair des baisses (flèche ↓, puce « −5 bavard »). */
  coralSoft: '#FF8F6B',
  /** Plan stylisé du quartier (écran Carte, maquette V6-Carte). */
  map: {
    ground: '#0E0C1C',
    block: '#141127',
    street: '#231F40',
    avenue: '#2A2550',
    lane: '#1F1B3A',
    park: '#10271F',
    tree: '#15342A',
    water: '#16224A',
    waterLine: '#1D2C5E',
    label: '#4E4878',
    waterLabel: '#3D4F8C',
  },
  /** Rouge des lignes destructives (`.red` des réglages). */
  dangerSoft: '#FF6B6B',
  /** Piste d'un interrupteur éteint (`.sw.off`). */
  switchOff: '#3A3559',
  /** Silhouette de remplacement d'une photo absente (tête, fond). */
  skin: '#FFD9B8',
  wineDeep: '#8C1D4F',
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

/**
 * Création du pet (V6-Craft) : pastille et dégradé du panneau de chaque espèce,
 * dans la famille de son pelage (lime, rose, orange, violet).
 */
export const craft = {
  nino: { swatch: '#B9E53A', gradient: ['#D4FA5E', '#A9E61F'] },
  suzie: { swatch: color.rose, gradient: ['#FF8FC6', '#FFC4DF'] },
  gaston: { swatch: color.orange, gradient: gradient.orange },
  pia: { swatch: color.violet, gradient: gradient.violet },
} as const satisfies Record<keyof typeof speciesColor, { swatch: string; gradient: readonly [string, string] }>;

/** Grand panneau de Blowy+ (V6-Paywall) : prune vers lie-de-vin. */
export const plusGradient = ['#2A0F2E', extra.wineDeep] as const;

/**
 * Couleur d'un pet dans les conversations (disque d'avatar, nom au-dessus des bulles) :
 * toutes les maquettes mettent Nino en jaune d'accent, les autres à la couleur de leur pelage.
 */
export const petTint = { nino: color.accent, suzie: speciesColor.suzie, gaston: speciesColor.gaston, pia: speciesColor.pia } as const;
