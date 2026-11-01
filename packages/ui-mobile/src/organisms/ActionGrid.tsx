import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { ActionTile, type ActionTileProps } from '../molecules/ActionTile';

export interface ActionGridProps {
  actions: readonly (ActionTileProps & { key: string })[];
  columns?: number;
}

/** Grille d'actions du Nid (appeler / câlin / jouer / nourrir / soigner). */
export function ActionGrid({ actions, columns = 3 }: ActionGridProps) {
  const rows: (typeof actions)[number][][] = [];
  actions.forEach((a, i) => {
    const r = Math.floor(i / columns);
    (rows[r] ??= []).push(a);
  });
  return (
    <View style={styles.wrap}>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map(({ key, ...a }) => (
            <ActionTile key={key} {...a} />
          ))}
          {Array.from({ length: columns - row.length }, (_, k) => (
            <View key={`f${k}`} style={styles.filler} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  filler: { flex: 1 },
});
