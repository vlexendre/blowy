import { Image } from 'expo-image';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { color } from '../theme';

/** Silhouette de remplacement quand il n'y a pas encore de photo (celle des maquettes). */
const PLACEHOLDER = require('../../assets/misc/portrait.webp') as number;
/** La même, floutée d'avance (le flou d'expo-image ne s'applique pas aux images locales sur iOS). */
const PLACEHOLDER_BLURRED = require('../../assets/misc/portrait_flou.webp') as number;

export interface PortraitTileProps {
  /** Photo de profil ; sinon une silhouette. */
  uri?: string | null;
  width: number;
  height: number;
  radius?: number;
  /** Flou (`.tile::after` : backdrop-filter blur 10 px) — ta photo telle que les autres la voient avant le niveau 5. */
  blurred?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Photo de profil rectangulaire (Moi, Mon compte), nette ou floutée. */
export function PortraitTile({ uri, width, height, radius = 22, blurred, accessibilityLabel, style }: PortraitTileProps) {
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, { width, height, borderRadius: radius }, style]}
    >
      <Image source={uri ? { uri } : blurred ? PLACEHOLDER_BLURRED : PLACEHOLDER} contentFit="cover" blurRadius={blurred && uri ? 24 : 0} transition={150} style={styles.fill} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: color.card, flexShrink: 0 },
  fill: { width: '100%', height: '100%' },
});
