import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { color, hard, radius as R, space, tone, type Tone } from '../foundations/theme';

export interface SurfaceProps extends ViewProps {
  /** Ton de fond ; `white` = carte standard (ombre #EEDFCB). */
  tone?: Tone;
  radius?: keyof typeof R;
  padding?: keyof typeof space | 0;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** Carte : fond plein + ombre dure de 4 pt (maquette `box-shadow: 0 4px 0 #EEDFCB`). */
export function Surface({
  tone: t = 'white',
  radius = 'lg',
  padding = 'lg',
  elevated = true,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const tk = tone[t];
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: t === 'white' ? color.white : tk.bg,
          borderRadius: R[radius],
          padding: padding === 0 ? 0 : space[padding],
        },
        elevated ? hard(4, t === 'white' ? color.creamShadow : tk.shadow) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
