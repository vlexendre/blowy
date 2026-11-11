import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Avatar, type AvatarProps } from '../atoms/Avatar';

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
export function AvatarPair({ first, second, size = 42, accessibilityLabel, style }: AvatarPairProps) {
  return (
    <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={[styles.row, style]}>
      <Avatar {...first} size={size} accessibilityLabel={undefined} />
      <Avatar {...second} size={size} cutout accessibilityLabel={undefined} style={{ marginLeft: -Math.round(size / 3) - 2 }} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
