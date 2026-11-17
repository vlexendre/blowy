import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, space } from '../theme';

export interface RigourGaugeProps {
  /** Rigueur de 0 à 100, ou null (« trop tôt pour le dire » : barre vide, pas de chiffre). */
  value: number | null;
  /** « Rigueur ». */
  label: string;
  /** Valeur dite à droite (« 85 % » ou « Trop tôt pour le dire »). */
  valueLabel: string;
  /** Encre : `light` sur la nuit (défaut), `dark` sur un panneau clair (jaune, orange, rose). */
  ink?: 'light' | 'dark';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Jauge de rigueur (spéc. §25) : part des jours dus où l'habitude a été tenue, sur 28 jours. Une ligne : libellé,
 * barre, valeur. Sans valeur, la barre reste vide et la valeur dit « trop tôt pour le dire ».
 */
export function RigourGauge({ value, label, valueLabel, ink = 'light', accessibilityLabel, style }: RigourGaugeProps) {
  const fg = ink === 'dark' ? color.dark : color.white;
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? `${label} ${valueLabel}`} style={[layout.row, styles.row, style]}>
      <Text variant="bodyBold" size={13} color={fg} style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <ProgressBar value={value === null ? 0 : value / 100} height={6} color={fg} trackColor={alpha(fg, 0.18)} style={layout.fill} />
      <Text variant="bodyHeavy" size={13} color={fg} style={value === null ? styles.early : styles.value} numberOfLines={1}>
        {valueLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm },
  label: { opacity: 0.78 },
  value: { minWidth: 40, textAlign: 'right' },
  early: { opacity: 0.78, maxWidth: '55%', textAlign: 'right' },
});
