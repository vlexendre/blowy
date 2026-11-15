import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Toggle } from '../atoms/Toggle';
import { layout } from '../lib/styles';
import { alpha, color, space, veil } from '../theme';

export interface PillToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Libellé lu (défaut : `label`). */
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Interrupteur en pilule de verre (« Discret ⏺ », maquette V6-GCarte) : toute la pilule se touche. */
export function PillToggle({ label, value, onValueChange, accessibilityLabel, disabled, style }: PillToggleProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      haptic="selection"
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      scaleTo={0.96}
      style={[layout.row, styles.pill, style]}
    >
      <Text variant="bodyHeavy" size={15}>
        {label}
      </Text>
      <Toggle value={value} onValueChange={onValueChange} accessibilityLabel={accessibilityLabel ?? label} disabled={disabled} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { gap: space.sm, paddingLeft: space.md, paddingRight: 6, minHeight: 44, borderRadius: 999, backgroundColor: alpha(color.panel, 0.92), borderWidth: 1, borderColor: veil.glass },
});
