import { StyleSheet, View } from 'react-native';
import { color, radius, space } from '../foundations/theme';
import { Sprite } from '../atoms/Sprite';
import { Surface } from '../atoms/Surface';
import { Text } from '../atoms/Text';

export interface VisionCardRow {
  key: string;
  label: string;
  /** null => pas encore renseigné (pointillés + « à venir »). */
  value: string | null;
}

export interface VisionCardProps {
  petName: string;
  speciesLabel: string;
  spritePath: string | null;
  rows: readonly VisionCardRow[];
  pendingLabel: string;
  /** Mots-clés de caractère (« Espiègle », « Artiste »). */
  traits?: readonly string[];
}

/** Carte de vision qui se construit au fil des 4 écrans (maquette V4-Vie). */
export function VisionCard({ petName, speciesLabel, spritePath, rows, pendingLabel, traits = [] }: VisionCardProps) {
  return (
    <Surface tone="ink" padding="lg" style={styles.card}>
      <View style={styles.head}>
        <Sprite path={spritePath} size={64} placeholderInitial={petName.slice(0, 1)} />
        <View style={styles.titles}>
          <Text variant="displayM" tone="white">
            {petName}
          </Text>
          <Text variant="caption" tone="lime">
            {speciesLabel}
          </Text>
        </View>
      </View>
      {traits.length > 0 ? (
        <View style={styles.traits}>
          {traits.map((t) => (
            <View key={t} style={styles.trait}>
              <Text variant="caption" tone="ink">
                {t}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {rows.map((r) => (
        <View key={r.key} style={[styles.row, r.value === null && styles.empty]} accessible accessibilityLabel={`${r.label}, ${r.value ?? pendingLabel}`}>
          <Text variant="caption" style={styles.label}>
            {r.label}
          </Text>
          <Text variant="bodyStrong" tone={r.value ? 'white' : 'muted'}>
            {r.value ?? pendingLabel}
          </Text>
        </View>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  titles: { flex: 1 },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  trait: { backgroundColor: color.lime, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.xs, borderTopWidth: 1, borderTopColor: color.inkSoft, gap: space.md },
  empty: { borderStyle: 'dashed' },
  label: { color: color.mutedLight },
});
