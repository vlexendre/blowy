/** `.card` : fond blanc, rayon 22, `box-shadow:0 4px 0 #EEDFCB` ; `.grp` : rayon 20, contenu rogné. */
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { cardStyle } from './styles';

export interface CardProps extends ViewProps {
  variant?: 'card' | 'group';
  /** Contour lime 3 px (élément actif, ex. conversation « ici »). */
  highlighted?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Card({ variant = 'card', highlighted, style, children, ...rest }: CardProps) {
  return (
    <View {...rest} style={[cardStyle(variant, highlighted), style]}>
      {children}
    </View>
  );
}
