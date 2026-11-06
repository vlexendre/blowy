/**
 * Image d'asset du manifest (@blowy/sprites) via expo-image. Si la source n'est pas
 * fournie, affiche un placeholder rond explicitement remplaçable (aucune erreur runtime).
 */
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSpriteSource } from '../foundations/sprite-source';
import { color } from '../foundations/theme';
import { Text } from './Text';

export interface SpriteProps {
  path: string | null;
  size: number;
  /** Hauteur si différente de la largeur. */
  height?: number;
  /** Miroir horizontal (pet partenaire regardant vers la gauche). */
  flip?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'contain' | 'cover';
  /** `object-position` (photos recadrées), ex. `{ top: '35%', left: '50%' }`. */
  contentPosition?: { top?: string; left?: string };
  /** Initiale affichée dans le placeholder. */
  placeholderInitial?: string;
}

export function Sprite({
  path,
  size,
  height,
  flip,
  accessibilityLabel,
  style,
  contentFit = 'contain',
  contentPosition,
  placeholderInitial,
}: SpriteProps) {
  const source = useSpriteSource(path);
  const h = height ?? size;
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel }
    : {
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
      };
  if (source === null) {
    return (
      <View
        {...a11y}
        style={[
          styles.placeholder,
          { width: size, height: h, borderRadius: Math.min(size, h) / 2 },
          style,
        ]}
      >
        <Text variant="displayM" tone="muted">
          {placeholderInitial ?? '?'}
        </Text>
      </View>
    );
  }
  return (
    <View {...a11y} style={[{ width: size, height: h }, flip && styles.flip, style]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        contentPosition={contentPosition as never}
        transition={0}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: color.creamDeep,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: color.creamShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: { transform: [{ scaleX: -1 }] },
});
