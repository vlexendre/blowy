import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { IconButton } from '../atoms/IconButton';
import { KeyValue } from './KeyValue';

export interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  decreaseLabel: string;
  increaseLabel: string;
}

/** Valeur numérique bornée avec boutons −/+ (44 pt) — alternative accessible à un curseur. */
export function NumberStepper({ label, value, onChange, min, max, step = 1, decreaseLabel, increaseLabel }: NumberStepperProps) {
  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(min, Math.min(max, value + (e.nativeEvent.actionName === 'increment' ? step : -step))))}>
      <IconButton icon="back" accessibilityLabel={`${decreaseLabel} ${label}`} onPress={() => onChange(Math.max(min, value - step))} />
      <View style={styles.mid}>
        <KeyValue label={label} value={String(value)} />
      </View>
      <IconButton icon="plus" accessibilityLabel={`${increaseLabel} ${label}`} onPress={() => onChange(Math.min(max, value + step))} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: space.sm }, mid: { flex: 1 } });
