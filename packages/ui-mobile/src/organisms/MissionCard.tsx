import { Pressable, StyleSheet, View } from 'react-native';
import { color, hard, radius, space, tone } from '../foundations/theme';
import { Sprite } from '../atoms/Sprite';
import { Text } from '../atoms/Text';

export interface MissionCardProps {
  title: string;
  subtitle: string;
  iconPath?: string;
  onPress?: () => void;
  variant?: 'coral' | 'white';
  testID?: string;
}

/** Tuile mission / écrire (maquette Nid, 2 colonnes). */
export function MissionCard({ title, subtitle, iconPath, onPress, variant = 'coral', testID }: MissionCardProps) {
  const t = tone[variant];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${subtitle}`} onPress={onPress} testID={testID} style={[styles.card, { backgroundColor: t.bg }, hard(4, t.shadow)]}>
      {iconPath ? <Sprite path={iconPath} size={28} /> : null}
      <View style={styles.text}>
        <Text variant="displayS" style={{ color: t.fg }} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" style={{ color: variant === 'coral' ? t.fg : color.violet }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, borderRadius: radius.lg - 2, paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: 56 },
  text: { flex: 1 },
});
