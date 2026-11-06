/**
 * Typographie fidèle aux maquettes, sans dépendance React Native (testable sous Node).
 *
 * Les maquettes utilisent des polices VARIABLES (Bricolage Grotesque opsz/wdth/wght, Inter wght)
 * avec `font-optical-sizing:auto` : l'axe opsz suit la taille en px. RN natif ne règle pas les
 * axes : l'app charge des instances statiques générées (apps/mobile/scripts/fonts/build-fonts.py)
 * nommées ici. Une famille = une instance : ne jamais poser `fontWeight` (gras synthétique).
 */
import { bodyWeights, displayFace, opticalSizes } from '@blowy/design-tokens';

export type BodyWeight = 400 | 500 | 600 | 700 | 800;

const nearest = (list: readonly number[], size: number): number => {
  let best = list[0]!;
  for (const s of list)
    if (
      Math.abs(s - size) < Math.abs(best - size) ||
      (Math.abs(s - size) === Math.abs(best - size) && s > best)
    )
      best = s;
  return best;
};

/** Famille Bricolage `.d` (largeur 85 %, 800) dont l'opsz est le plus proche de `size`. */
export const displayFamily = (size: number): string =>
  `BricolageGrotesque-D${nearest(opticalSizes.display, Math.min(96, size))}`;
/** Famille Bricolage largeur normale 800 (boutons, `.act`, `.seg`, `.mini`). */
export const strongFamily = (size: number): string =>
  `BricolageGrotesque-B${nearest(opticalSizes.strong, size)}`;
/** Inter : les maquettes ne chargent que 400–700, une graisse 800 est rendue en 700. */
export const bodyFamily = (weight: BodyWeight = 400): string => {
  const w = Math.min(700, weight);
  return `Inter-${nearest(bodyWeights, w)}`;
};

/** Toutes les familles attendues par ui-mobile (l'app doit les charger, test d'app). */
export const ALL_FONT_FAMILIES: readonly string[] = [
  ...opticalSizes.display.map((s) => `BricolageGrotesque-D${s}`),
  ...opticalSizes.strong.map((s) => `BricolageGrotesque-B${s}`),
  ...bodyWeights.map((w) => `Inter-${w}`),
];

export interface FontSpec {
  fontFamily: string;
  fontSize: number;
  lineHeight?: number;
  letterSpacing?: number;
}

/** Style `.d` à la taille donnée : interlettrage −0,03 em, interligne 0,95 (valeurs non arrondies). */
export function displayFont(
  size: number,
  opts: { lineHeight?: number; letterSpacingEm?: number } = {},
): FontSpec {
  return {
    fontFamily: displayFamily(size),
    fontSize: size,
    lineHeight: size * (opts.lineHeight ?? displayFace.lineHeight),
    letterSpacing: size * (opts.letterSpacingEm ?? displayFace.letterSpacingEm),
  };
}

/** Texte Inter ; `lineHeight` absent = `normal` CSS (métriques de la police), comme dans les maquettes. */
export function bodyFont(
  size: number,
  weight: BodyWeight = 400,
  letterSpacingEm = 0,
  lineHeight?: number,
): FontSpec {
  const spec: FontSpec = { fontFamily: bodyFamily(weight), fontSize: size };
  if (letterSpacingEm) spec.letterSpacing = size * letterSpacingEm;
  if (lineHeight !== undefined) spec.lineHeight = lineHeight;
  return spec;
}

/** Bricolage largeur normale (`.btn`) ; interlettrage `.01em` par défaut. */
export function strongFont(size: number, letterSpacingEm = 0.01): FontSpec {
  return { fontFamily: strongFamily(size), fontSize: size, letterSpacing: size * letterSpacingEm };
}
