/**
 * Pictogramme V5 (registre `glyphs.ts`, tracés exacts des maquettes). Décoratif : le sens est porté
 * par le libellé voisin ou l'`accessibilityLabel` du parent.
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { v5 } from '../foundations/theme';
import { GLYPHS, type GlyphName, type GlyphShape } from './glyphs';

export type { GlyphName } from './glyphs';

export interface GlyphProps {
  name: GlyphName;
  /** Côté en px (largeur = hauteur), comme `width`/`height` du SVG de la maquette. */
  size?: number;
  color?: string;
  /** Couleur secondaire (trou du cadenas, point du repère, barre de « hors ligne »). */
  color2?: string;
  /** Épaisseur de trait si la maquette s'écarte du défaut du registre. */
  strokeWidth?: number;
}

export function Glyph({
  name,
  size = 16,
  color = v5.ink,
  color2 = v5.white,
  strokeWidth,
}: GlyphProps) {
  const def = GLYPHS[name];
  const pick = (k?: 'c' | 'c2') => (k === 'c' ? color : k === 'c2' ? color2 : 'none');
  const draw = (s: GlyphShape, i: number) => {
    const stroke = pick(s.stroke);
    const fill = pick(s.fill);
    const w = s.stroke ? (strokeWidth ?? s.w) : undefined;
    if (s.k === 'circle')
      return (
        <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} stroke={stroke} strokeWidth={w} fill={fill} />
      );
    if (s.k === 'rect')
      return (
        <Rect
          key={i}
          x={s.x}
          y={s.y}
          width={s.width}
          height={s.height}
          rx={s.rx}
          stroke={stroke}
          strokeWidth={w}
          fill={fill}
        />
      );
    return (
      <Path
        key={i}
        d={s.d}
        stroke={stroke}
        strokeWidth={w}
        fill={fill}
        strokeLinecap={s.cap}
        strokeLinejoin={s.join}
      />
    );
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${def.viewBox} ${def.viewBox}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {def.shapes.map(draw)}
    </Svg>
  );
}
