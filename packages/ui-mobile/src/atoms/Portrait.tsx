/**
 * Portrait illustré neutre (V5.3 F.21) : silhouette stylisée sur dégradé, jamais une vraie
 * personne. Sert de « ta photo ici » (Vérif, Profil) et de visage de démonstration ; l'app montre
 * les vraies photos vérifiées (filigranées par le serveur) dès qu'elles existent.
 * Tracés exacts des maquettes (viewBox 100, `xMidYMax meet`, hauteur 88 % / 96 %).
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { v5Alpha, v5Gradient, v5Portraits, type V5PortraitKey } from '../foundations/theme';

export type PortraitKey = V5PortraitKey;

const HAIR: Record<string, (fill: string) => React.ReactNode> = {
  bob: (f) => <Path d="M30 40 Q30 18 50 17 Q70 18 70 40 Q66 28 50 27 Q34 28 30 40Z" fill={f} />,
  longer: (f) => <Path d="M27 66 Q24 20 50 16 Q76 20 73 66 L66 66 Q68 32 50 28 Q32 32 34 66Z" fill={f} />,
  long: (f) => <Path d="M28 56 Q26 18 50 17 Q74 18 72 56 L66 56 Q67 30 50 28 Q33 30 34 56Z" fill={f} />,
  curly: (f) => (
    <G fill={f}>
      <Circle cx={34} cy={30} r={9} />
      <Circle cx={46} cy={22} r={10} />
      <Circle cx={58} cy={22} r={10} />
      <Circle cx={67} cy={31} r={9} />
    </G>
  ),
  bun: (f) => (
    <G fill={f}>
      <Circle cx={50} cy={12} r={9} />
      <Path d="M30 40 Q30 18 50 18 Q70 18 70 40 Q64 27 50 27 Q36 27 30 40Z" />
    </G>
  ),
};

export interface PortraitProps {
  who: PortraitKey;
  /** Part de la hauteur occupée par la silhouette (0,88 par défaut ; 0,96 pour les cheveux longs). */
  heightRatio?: number;
  /** Dégradé de fond (absent : transparent, le parent peint le fond). */
  withBackground?: boolean;
  /** Réserve basse (bandeau prénom) : la silhouette s'arrête à `bottomInset` px du bas. */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
}

export function portraitBackground(who: PortraitKey): string {
  const p = v5Portraits[who];
  return `linear-gradient(160deg, ${p.from}, ${p.to})`;
}

export function Portrait({ who, heightRatio, withBackground = true, bottomInset = 0, style }: PortraitProps) {
  const p = v5Portraits[who];
  const ratio = heightRatio ?? (p.hairStyle === 'longer' ? 0.96 : 0.88);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ overflow: 'hidden' }, withBackground ? { backgroundImage: portraitBackground(who) } : null, style]}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: bottomInset }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${ratio * 100}%` }}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet">
            <Path d="M14 100 Q16 70 50 68 Q84 70 86 100Z" fill={v5Alpha.ink28} />
            <Rect x={43} y={54} width={14} height={16} rx={6} fill={p.skin} />
            <Ellipse cx={50} cy={42} rx={17} ry={20} fill={p.skin} />
            {HAIR[p.hairStyle]?.(p.hair)}
          </Svg>
        </View>
      </View>
    </View>
  );
}

export const PORTRAIT_GRADIENTS = v5Gradient;
