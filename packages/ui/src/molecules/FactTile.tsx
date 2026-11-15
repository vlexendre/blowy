import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { CountUp } from '../motion/CountUp';
import { type GradientName, space } from '../theme';

export interface FactTileProps {
  /** Nombre (défile depuis 0 à la première apparition). */
  count: number;
  /** Suffixe collé au nombre (« /10 »). */
  suffix?: string;
  /** « sorties ». */
  label: string;
  gradient?: GradientName;
  /** Libellé lu complet (« 4 sorties »). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Tuile chiffre en couleur (V6-GBilan : sorties, habitudes, jours de série). */
export function FactTile({ count, suffix, label, gradient = 'accent', accessibilityLabel, style }: FactTileProps) {
  return (
    <Panel gradient={gradient} radius={22} padding="none" style={[styles.tile, style]}>
      <CountUp value={count} from={0} variant="h2" size={40} suffix={suffix} accessibilityLabel={accessibilityLabel ?? `${count}${suffix ?? ''} ${label}`} />
      <Text variant="bodyHeavy" size={14} center numberOfLines={1} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, alignItems: 'center', paddingVertical: space.md, paddingHorizontal: space.sm, minHeight: 92, justifyContent: 'center' },
});

export interface FactRowProps {
  facts: readonly FactTileProps[];
}

/** Les tuiles chiffres côte à côte, de même largeur. */
export function FactRow({ facts }: FactRowProps) {
  return (
    <View style={styles.row}>
      {facts.map((f) => (
        <FactTile key={f.label} {...f} />
      ))}
    </View>
  );
}
