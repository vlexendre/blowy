import { StyleSheet, View } from 'react-native';
import { color, space } from '../foundations/theme';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';

export interface GaugeProps {
  label: string;
  /** 0..100 */
  value: number;
  /** Texte de valeur (« 72 / 100 », « faim 40 % »), toujours affiché. */
  valueText: string;
  /** Niveau critique : marqué par un libellé, pas seulement la couleur. */
  criticalLabel?: string | null;
  pending?: boolean;
  pendingLabel?: string;
}

export function Gauge({
  label,
  value,
  valueText,
  criticalLabel,
  pending,
  pendingLabel,
}: GaugeProps) {
  const critical = !!criticalLabel;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(value),
        text: [valueText, criticalLabel, pending ? pendingLabel : null].filter(Boolean).join(', '),
      }}
      style={styles.wrap}
    >
      <View style={styles.row}>
        <Text variant="label" tone="inkSoft">
          {label}
        </Text>
        <Text variant="small" tone={critical ? 'danger' : 'inkSoft'}>
          {critical ? `${criticalLabel} · ${valueText}` : valueText}
        </Text>
      </View>
      <ProgressBar
        value={value / 100}
        fill={critical ? color.danger : color.ink}
        pending={pending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xxs, flex: 1, minWidth: 130 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
