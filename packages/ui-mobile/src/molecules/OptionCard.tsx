import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { color, radius, space, tone } from '../foundations/theme';
import { Icon } from '../atoms/Icon';
import { Pressable3D } from '../atoms/Pressable3D';
import { Text } from '../atoms/Text';

export interface OptionCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  leading?: ReactNode;
  /** Pastille « PLUS », « Bientôt »… */
  tag?: string;
  /** Radio (choix unique) ou case (choix multiple). */
  mode?: 'radio' | 'checkbox';
  disabled?: boolean;
  testID?: string;
}

/** Carte de choix (école, dimanche, intention, espèce…) — sélection = fond encre + coche. */
export function OptionCard({
  title,
  subtitle,
  selected,
  onPress,
  leading,
  tag,
  mode = 'radio',
  disabled,
  testID,
}: OptionCardProps) {
  const t = tone[selected ? 'ink' : 'white'];
  return (
    <Pressable3D
      background={t.bg}
      shadowColor={t.shadow}
      depth={4}
      radius={radius.lg}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={mode === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ selected, checked: selected, disabled: !!disabled }}
      accessibilityLabel={[title, subtitle, tag].filter(Boolean).join(', ')}
      testID={testID}
      style={styles.card}
    >
      {leading}
      <View style={styles.text}>
        <Text variant="displayS" style={{ color: t.fg }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" style={{ color: selected ? color.creamShadow : color.inkSoft }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {tag ? (
        <View style={styles.tag}>
          <Text variant="caption" tone="white">
            {tag}
          </Text>
        </View>
      ) : null}
      <View style={[styles.mark, mode === 'checkbox' && styles.square, selected && styles.markOn]}>
        {selected ? <Icon name="check" size={16} tint={color.ink} /> : null}
      </View>
    </Pressable3D>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    minHeight: 64,
  },
  text: { flex: 1, gap: 2 },
  tag: {
    backgroundColor: color.violet,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: color.creamShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  square: { borderRadius: 8 },
  markOn: { backgroundColor: color.lime, borderColor: color.lime },
});
