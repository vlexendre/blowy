import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

import { itemImage } from '../assets/items';

export interface ItemImageProps {
  /** Identifiant d'objet (`ITEM_IDS`) ; inconnu → rien. */
  id: string;
  /** Côté de la case en points ; l'objet y tient entier. Défaut 48. */
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
}

/** Objet de la garde-robe détouré, contenu dans une case carrée. Décoratif sauf si un libellé est fourni. */
export function ItemImage({ id, size = 48, accessibilityLabel, style }: ItemImageProps) {
  const src = itemImage(id);
  if (src === undefined) return null;
  return (
    <Image
      source={src}
      contentFit="contain"
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: size }, style]}
    />
  );
}
