import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Avatar, type AvatarProps } from '../atoms/Avatar';
import { Text } from '../atoms/Text';
import { color, radius, size as sizes } from '../theme';

export interface AvatarStackProps {
  /** Les minimoas du groupe (visage caché), dans l'ordre. */
  people: readonly Omit<AvatarProps, 'size' | 'cutout'>[];
  /** Diamètre d'un avatar. Défaut 34. */
  size?: number;
  /** Avatars montrés au plus ; au-delà, une pastille « +2 ». Défaut 3. */
  max?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const RING = 3;

/** Minimoas d'un groupe empilés (chacun mord sur le précédent, liseré nuit), puis « +n » s'il en reste. */
export function AvatarStack({ people, size = 34, max = 3, accessibilityLabel, style }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  const overlap = -Math.round(size / 2.6) - RING;
  return (
    <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={[styles.row, style]}>
      {shown.map((p, i) => (
        <View key={i} style={[styles.ring, i > 0 && { marginLeft: overlap }]}>
          <Avatar {...p} size={size} cutout={i > 0} accessibilityLabel={undefined} />
        </View>
      ))}
      {rest > 0 ? (
        <View style={[styles.ring, { marginLeft: overlap }]}>
          <View style={[styles.more, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text variant="bodyHeavy" size={13}>
              {`+${rest}`}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: { padding: RING - sizes.ring, borderRadius: radius.pill, backgroundColor: color.night },
  more: { backgroundColor: color.card, alignItems: 'center', justifyContent: 'center' },
});
