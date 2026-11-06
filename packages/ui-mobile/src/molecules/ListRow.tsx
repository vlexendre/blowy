import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { color, space, touch } from '../foundations/theme';
import { Icon, type IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

export interface ListRowProps {
  title: string;
  subtitle?: string | null;
  icon?: IconName;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  accessibilityHint?: string;
  testID?: string;
  showChevron?: boolean;
}

/** Ligne de réglage / liste (≥ 52 pt), chevron si navigable. */
export function ListRow({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  onPress,
  destructive,
  accessibilityHint,
  testID,
  showChevron = !!onPress,
}: ListRowProps) {
  const body = (
    <View style={styles.row}>
      {leading ??
        (icon ? <Icon name={icon} tint={destructive ? color.danger : color.ink} /> : null)}
      <View style={styles.text}>
        <Text variant="bodyStrong" tone={destructive ? 'danger' : 'ink'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron ? <Icon name="chevron" size={18} tint={color.muted} /> : null}
    </View>
  );
  if (!onPress)
    return (
      <View accessible accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}>
        {body}
      </View>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.minTarget + 8,
    paddingVertical: space.sm,
  },
  text: { flex: 1, gap: 2 },
  pressed: { opacity: 0.6 },
});
