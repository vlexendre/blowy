import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/** Deux boutons côte à côte : le premier à sa taille (« Pas cette fois »), le second prend le reste (« Dire bonjour »). */
export function ButtonRow({ left, right, gap = 10 }: { left: ReactNode; right: ReactNode; gap?: number }) {
  return (
    <View style={[styles.row, { gap }]}>
      {left}
      <View style={styles.fill}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  fill: { flex: 1, minWidth: 0 },
});
