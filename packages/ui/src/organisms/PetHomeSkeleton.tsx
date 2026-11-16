import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../atoms/Skeleton';
import { color, radius, size as sizes, veil } from '../theme';

/**
 * Accueil en chargement, à la forme du vrai contenu : panneau du minimoa, la carte des quatre soins (disques et
 * barres de besoin), une carte « maintenant » et la rangée de tuiles. Reflets décalés pour ne pas battre ensemble.
 * `needs` est gardé pour compatibilité (les besoins sont portés par les soins).
 */
export function PetHomeSkeleton({ cares = 4 }: { needs?: number; cares?: number }) {
  return (
    <View style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Skeleton height={318} radius="xl" />
      <View style={styles.care}>
        {Array.from({ length: cares }, (_, i) => (
          <View key={i} style={styles.careCell}>
            <Skeleton width={56} height={56} radius="circle" delay={120 + i * 90} />
            <Skeleton width={44} height={10} delay={120 + i * 90} />
            <Skeleton width={34} height={5} radius="pill" delay={120 + i * 90} />
          </View>
        ))}
      </View>
      <Skeleton height={56} radius="lg" delay={240} />
      <View style={styles.tiles}>
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} style={styles.tile}>
            <Skeleton height={64} radius="md" delay={300 + i * 60} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  care: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.card, backgroundColor: color.panel, borderWidth: sizes.border, borderColor: veil.line },
  careCell: { flex: 1, alignItems: 'center', gap: 6 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1 },
});
