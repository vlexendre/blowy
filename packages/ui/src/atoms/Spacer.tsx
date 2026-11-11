import { View } from 'react-native';

import { space } from '../theme';

export interface SpacerProps {
  /** Hauteur (ou largeur si `horizontal`) prise dans `tokens.space`. */
  size?: keyof typeof space;
  horizontal?: boolean;
  /** Occupe tout l'espace libre (pousse la suite en bas / à droite). */
  flex?: boolean;
}

export function Spacer({ size = 'lg', horizontal, flex }: SpacerProps) {
  if (flex) return <View style={{ flex: 1 }} />;
  return <View style={horizontal ? { width: space[size] } : { height: space[size] }} />;
}
