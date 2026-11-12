import { NEED_KEYS, type NeedKey, type Needs } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { NeedMeter } from '../molecules/NeedMeter';

export interface NeedsPanelProps {
  /** Besoins du pet (`Pet.needs`). */
  needs: Needs;
  /** Nom et phrase « bas » de chaque besoin (`needLabel` de @blowy/content accepté tel quel). */
  labels: Record<NeedKey, { name: string; low: string }>;
  /** Seuil sous lequel une barre passe au rouge. Défaut 40 (`urgentNeed`). */
  lowAt?: number;
  style?: StyleProp<ViewStyle>;
}

/** Les trois besoins (faim, énergie, humeur) côte à côte, sous la scène du pet (V6-Accueil). */
export function NeedsPanel({ needs, labels, lowAt, style }: NeedsPanelProps) {
  return (
    <View style={[styles.row, style]}>
      {NEED_KEYS.map((k) => (
        <NeedMeter key={k} label={labels[k].name} lowText={labels[k].low} value={needs[k]} lowAt={lowAt} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
});
