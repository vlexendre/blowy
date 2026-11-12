import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Avatar, type AvatarProps } from '../atoms/Avatar';
import { color, radius, size } from '../theme';

export interface AvatarPairProps {
  /** Avatar de devant à gauche (souvent ton pet). */
  first: Omit<AvatarProps, 'size' | 'cutout'>;
  /** Avatar superposé à droite (l'autre). */
  second: Omit<AvatarProps, 'size' | 'cutout'>;
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Deux avatars qui se chevauchent (les deux pets d'un lien). */
export function AvatarPair({ first, second, size: side = 42, accessibilityLabel, style }: AvatarPairProps) {
  return (
    <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={[styles.row, style]}>
      <Avatar {...first} size={side} accessibilityLabel={undefined} />
      {/* Maquettes : liseré nuit de 4 pt (`box-shadow: 0 0 0 2px, 0 0 0 4px`) qui mord sur le premier avatar. */}
      <View style={[styles.ring, { marginLeft: -Math.round(side / 3) - RING }]}>
        <Avatar {...second} size={side} cutout accessibilityLabel={undefined} />
      </View>
    </View>
  );
}

const RING = 4;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: { padding: RING - size.ring, borderRadius: radius.pill, backgroundColor: color.night },
});
