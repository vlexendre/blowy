import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

import { type IconName, iconImage } from '../assets/pets';

export interface IconProps {
  name: IconName;
  /** Côté en points. Défaut 24. */
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
}

/** Icône 3D de la collection `ic_*` (flamme, cœurs, étoiles…). Décorative sauf si un libellé est fourni. */
export function Icon({ name, size = 24, accessibilityLabel, style }: IconProps) {
  return (
    <Image
      source={iconImage(name)}
      contentFit="contain"
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: size }, style]}
    />
  );
}
