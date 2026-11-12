import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { useInk } from '../lib/ink';
import { CountUp } from '../motion/CountUp';
import { alpha, opacity } from '../theme';

export interface CountTitleProps {
  /** « PHOTOS DU JOUR ». */
  title: string;
  /** Le nombre estompé après le titre (« · 12 »), qui défile depuis `from` à l'apparition. */
  count: number;
  /** Départ du défilement. Défaut 0. */
  from?: number;
  /** Corps du titre. Défaut 24. */
  size?: number;
  /** Petit texte à droite (« nettes au niveau 5 »). */
  hint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Titre de section suivi de son compteur estompé (« PHOTOS DU JOUR · 12 »), le nombre défile comme un compteur. */
export function CountTitle({ title, count, from = 0, size = 24, hint, style }: CountTitleProps) {
  const ink = useInk();
  const dim = alpha(ink, opacity.dim);
  return (
    <View style={[styles.row, style]}>
      <View style={styles.title} accessible accessibilityRole="header" accessibilityLabel={`${title} · ${count}`}>
        <Title text={title} size={size} />
        <CountUp value={count} from={from} variant="h1" size={size} color={dim} prefix=" · " duration={700} />
      </View>
      {hint ? (
        <Text variant="bodyBold" size={12} muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  title: { flexDirection: 'row', alignItems: 'flex-end' },
});
