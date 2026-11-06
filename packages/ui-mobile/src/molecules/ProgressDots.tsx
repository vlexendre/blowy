import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { Dot } from '../atoms/Dot';
import { Text } from '../atoms/Text';

/** Indicateur d'étape d'onboarding : points + texte « Étape 3 sur 9 » (vocalisé). */
export function ProgressDots({
  index,
  count,
  label,
}: {
  index: number;
  count: number;
  label: string;
}) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: count, now: index + 1 }}
      style={styles.row}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} active={i === index} />
      ))}
      <Text variant="caption" tone="muted" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  label: { marginLeft: space.sm },
});
