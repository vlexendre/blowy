import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../atoms/Skeleton';
import { space } from '../theme';

/** Liste des conversations : les lignes se touchent, séparées par un filet (maquette : 6 pt sous le bandeau). */
export function LinkList({ children }: { children: ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

/** Squelette de la liste des conversations (4 lignes). */
export function LinkListSkeleton() {
  return (
    <View style={styles.list}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton width={72} height={44} radius="pill" />
          <View style={styles.grow}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="85%" height={12} style={styles.skeletonLine} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Conteneur de l'état vide des conversations (l'état vide et ses actions). */
export function LinkListEmpty({ children }: { children: ReactNode }) {
  return <View style={styles.empty}>{children}</View>;
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0, gap: 4 },
  list: { marginTop: -6 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  skeletonLine: { marginTop: 8 },
  empty: { gap: space.md, paddingTop: space.xl },
});
