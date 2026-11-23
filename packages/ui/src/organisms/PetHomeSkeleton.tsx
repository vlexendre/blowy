import { StyleSheet, View } from 'react-native';

import { Skeleton } from '../atoms/Skeleton';

/**
 * Accueil en chargement, à la forme du vrai contenu (V6-GAccueil) : le panneau du minimoa, la puce de série, le
 * bandeau de la séance, puis trois étapes du chemin. Reflets décalés pour ne pas battre ensemble.
 */
export function PetHomeSkeleton({ panel = 184 }: { panel?: number }) {
  return (
    <View style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Skeleton height={panel} radius="xl" />
      <Skeleton width={170} height={44} radius="pill" delay={120} />
      <Skeleton height={100} radius="lg" delay={200} />
      {[0.62, 0.46, 0.3].map((left, i) => (
        <View key={left} style={[styles.step, { marginLeft: `${left * 100}%` }]}>
          <Skeleton width={i === 2 ? 72 : 44} height={i === 2 ? 72 : 44} radius="circle" delay={280 + i * 80} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  step: { alignSelf: 'flex-start' },
});
