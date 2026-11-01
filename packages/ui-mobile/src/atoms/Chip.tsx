import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { color, hard, radius, space, tone, touch, type Tone } from '../foundations/theme';
import { Icon, type IconName } from './Icon';
import { Pressable3D } from './Pressable3D';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  /** Élément visuel à gauche (sprite, pièce…). */
  leading?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  size?: 'sm' | 'md';
}

/**
 * Puce (maquette .chip) : compteurs, filtres, sélections. Sélection signalée par un fond
 * encre ET une coche (jamais par la seule couleur).
 */
export function Chip({ label, tone: t = 'white', icon, leading, selected, onPress, accessibilityLabel, testID, size = 'md' }: ChipProps) {
  const tk = tone[selected ? 'ink' : t];
  const content = (
    <View style={[styles.row, size === 'sm' && styles.sm]}>
      {selected ? <Icon name="check" size={16} tint={color.lime} /> : icon ? <Icon name={icon} size={16} tint={tk.fg} /> : null}
      {leading}
      <Text variant={size === 'sm' ? 'small' : 'bodyStrong'} style={{ color: tk.fg }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel ?? label} testID={testID} style={[styles.static, { backgroundColor: tk.bg }, hard(3, tk.shadow)]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable3D
      background={tk.bg}
      shadowColor={tk.shadow}
      depth={3}
      radius={radius.pill}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      testID={testID}
      style={styles.pressable}
    >
      {content}
    </Pressable3D>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.xs },
  sm: { paddingHorizontal: space.sm, paddingVertical: space.xxs },
  static: { borderRadius: radius.pill, alignSelf: 'flex-start' },
  pressable: { justifyContent: 'center', minHeight: touch.minTarget },
});
