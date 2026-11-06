/**
 * Mot « tampon » incliné des titres : « PET. » (fond encre, rayon 16, marges 0 12 6, −3°, ombre
 * dure corail 5 px) et « DE NOUVELLES PERSONNES. » (fond lime, rayon 14, marges 2 12 6, −2°,
 * ombre encre 4 px). Rotation autour du centre, ombre tournée avec la forme (comme en CSS).
 */
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { stampStyle, type StampTone } from './styles';

export type { StampTone };

export interface StampProps {
  tone?: StampTone;
  children: ReactNode;
  /** Inclinaison en degrés (défaut : −3 encre, −2 lime). */
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}

export function Stamp({ tone = 'ink', rotate, children, style }: StampProps) {
  return <View style={[stampStyle(tone, rotate), style]}>{children}</View>;
}
