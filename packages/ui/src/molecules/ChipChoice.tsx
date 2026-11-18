import { StyleSheet, View } from 'react-native';

import { Chip } from '../atoms/Chip';
import { Text } from '../atoms/Text';
import { space } from '../theme';

export interface ChipChoiceOption<K extends string> {
  key: K;
  label: string;
}

export interface ChipChoiceProps<K extends string> {
  /** Petite question au-dessus (« Tu es… »). */
  label?: string;
  options: readonly ChipChoiceOption<K>[];
  selected: K | null;
  onSelect: (key: K) => void;
  /** Ligne discrète dessous (« Personne d’autre ne le voit. »). */
  note?: string;
  center?: boolean;
}

/** Un choix parmi quelques puces qui passent à la ligne (une question courte, facultative). */
export function ChipChoice<K extends string>({ label, options, selected, onSelect, note, center }: ChipChoiceProps<K>) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {label ? (
        <Text variant="bodyBold" size={15} center={center}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.row, center && styles.center]}>
        {options.map((o) => (
          <Chip key={o.key} label={o.label} size="md" tone={selected === o.key ? 'accent' : 'glass'} selected={selected === o.key} onPress={() => onSelect(o.key)} />
        ))}
      </View>
      {note ? (
        <Text size={13} muted center={center}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  center: { justifyContent: 'center' },
});
