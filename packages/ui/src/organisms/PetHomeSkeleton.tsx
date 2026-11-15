import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../atoms/Skeleton';
import { color, size as sizes, veil } from '../theme';

/**
 * Accueil en chargement, à la forme du vrai contenu : panneau du pet (318), trois jauges, la carte des quatre soins
 * (disques), puis les deux cartes d'entrée. Reflets décalés pour ne pas battre tous ensemble.
 */
export function PetHomeSkeleton({ needs = 3, cares = 4 }: { needs?: number; cares?: number }) {
  return (
    <View style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Skeleton height={318} radius="xl" />
      <View style={styles.row}>
        {Array.from({ length: needs }, (_, i) => (
          <View key={i} style={styles.need}>
            <Skeleton width="55%" height={10} delay={i * 90} />
            <Skeleton height={6} radius="pill" delay={i * 90} />
          </View>
        ))}
      </View>
      <View style={styles.care}>
        {Array.from({ length: cares }, (_, i) => (
          <View key={i} style={styles.careCell}>
            <Skeleton width={64} height={64} radius="circle" delay={120 + i * 90} />
            <Skeleton width={40} height={10} delay={120 + i * 90} />
          </View>
        ))}
      </View>
      <Skeleton height={72} radius="lg" delay={240} />
      <Skeleton height={60} radius="lg" delay={300} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  row: { flexDirection: 'row', gap: 8 },
  need: { flex: 1, gap: 10, padding: 12, borderRadius: 18, backgroundColor: color.panel, borderWidth: sizes.border, borderColor: veil.line },
  care: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 26, backgroundColor: color.panel, borderWidth: sizes.border, borderColor: veil.line },
  careCell: { flex: 1, alignItems: 'center', gap: 8 },
});
