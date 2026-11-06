import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { Slider } from '../atoms/Slider';
import { Text } from '../atoms/Text';

export interface LabeledSliderProps {
  left: string;
  right: string;
  value: number;
  onChange: (v: number) => void;
  /** « Gentil ou Espiègle ». */
  accessibilityLabel: string;
  valueText: string;
  testID?: string;
}

/** Curseur de caractère avec les deux pôles écrits (maquette Craft). */
export function LabeledSlider({
  left,
  right,
  value,
  onChange,
  accessibilityLabel,
  valueText,
  testID,
}: LabeledSliderProps) {
  return (
    <View style={styles.wrap}>
      <View
        style={styles.row}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Text variant="bodyStrong" tone={value < -0.15 ? 'ink' : 'muted'}>
          {left}
        </Text>
        <Text variant="bodyStrong" tone={value > 0.15 ? 'ink' : 'muted'}>
          {right}
        </Text>
      </View>
      <Slider
        value={value}
        onChange={onChange}
        accessibilityLabel={accessibilityLabel}
        accessibilityValueText={valueText}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.xxs },
});
