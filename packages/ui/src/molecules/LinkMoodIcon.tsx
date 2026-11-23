import type { LinkWarmth } from '@blowy/domain';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useInk } from '../lib/ink';

export interface LinkMoodIconProps {
  /** État du lien (`Link.warmth`). */
  warmth: LinkWarmth;
  /** Côté, en points. Défaut 18. */
  size?: number;
  /** Couleur du trait ; défaut : l'encre courante. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** Bulle de dialogue (24 × 24) : corps arrondi, petite queue en bas à gauche. */
const BUBBLE = 'M5 4.5 H15 A3 3 0 0 1 18 7.5 V12.5 A3 3 0 0 1 15 15.5 H9 L5.5 18.5 V15.5 H5 A3 3 0 0 1 2 12.5 V7.5 A3 3 0 0 1 5 4.5 Z';
/** Deuxième bulle, plus petite, derrière à droite. */
const BACK = 'M19 8.5 H20 A2.5 2.5 0 0 1 22.5 11 V15 A2.5 2.5 0 0 1 20 17.5 H19.5 V20 L16.5 17.5 H13';
/** Croissant de lune. */
const MOON = 'M15.5 3.5 A8.5 8.5 0 1 0 20.5 17.5 A7 7 0 0 1 15.5 3.5 Z';

/**
 * Pictogramme de l'état d'un lien (ADA-2027 item 27), une forme par état pour ne jamais dire l'état par la couleur
 * seule : deux bulles (vivant), une bulle (calme), une bulle en pointillé (un moment), une lune (endormi).
 * Décoratif : le texte voisin dit l'état.
 */
export function LinkMoodIcon({ warmth, size = 18, color, style }: LinkMoodIconProps) {
  const ink = useInk();
  const stroke = color ?? ink;
  const line = { stroke, strokeWidth: 1.8, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <View style={[{ width: size, height: size }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {warmth === 'vivant' ? (
          <>
            <Path d={BACK} {...line} />
            <Path d={BUBBLE} {...line} />
          </>
        ) : warmth === 'calme' ? (
          <Path d={BUBBLE} {...line} />
        ) : warmth === 'moment' ? (
          <Path d={BUBBLE} {...line} strokeDasharray="2.2 2.6" />
        ) : (
          <>
            <Path d={MOON} {...line} />
            <Circle cx={19} cy={5} r={1} fill={stroke} />
          </>
        )}
      </Svg>
    </View>
  );
}
