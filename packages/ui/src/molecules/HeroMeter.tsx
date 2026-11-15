import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { CountUp } from '../motion/CountUp';
import { alpha, color, radius, space, veil } from '../theme';

export interface HeroMeterProps {
  /** « Sociabilité ». */
  label: string;
  /** De 0 à 100. */
  value: number;
  /** Suffixe du nombre (« % », avec son espace insécable, venu des textes de l'app). */
  suffix: string;
  /** Sous ce seuil, la barre passe au corail (il a besoin de sortir). Défaut 40. */
  lowAt?: number;
  /** Petite ligne sous la barre (« il a besoin de sortir »). */
  note?: string;
  /** Libellé lu (« sociabilité : 64 sur 100 »). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * La jauge vedette du minimoa (V6-GAccueil) : dans un verre sombre posé sur son panneau, le nom en jaune, le chiffre
 * en Anton qui défile depuis 0 à la première apparition, et la barre qui se remplit avec un léger dépassement.
 */
export function HeroMeter({ label, value, suffix, lowAt = 40, note, accessibilityLabel, style }: HeroMeterProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const low = v < lowAt;
  return (
    <View accessible accessibilityRole="summary" accessibilityLabel={accessibilityLabel ?? `${label} ${v}${suffix}`} style={[styles.box, style]}>
      <Text variant="bodyHeavy" size={13} color={low ? color.coral : color.accentSoft}>
        {label}
      </Text>
      <CountUp value={v} from={0} variant="h2" size={38} color={color.white} suffix={suffix} duration={600} style={styles.value} />
      <ProgressBar value={v / 100} height={8} color={low ? color.coral : color.accent} trackColor={veil.track} />
      {note ? (
        <Text variant="bodyBold" size={13} color={veil.text} numberOfLines={2} style={styles.note}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}


const styles = StyleSheet.create({
  box: { borderRadius: radius.md, paddingHorizontal: space.md, paddingTop: space.sm + 2, paddingBottom: space.md, backgroundColor: alpha(color.dark, 0.62), gap: space.xs },
  value: { marginTop: -2, marginBottom: 2 },
  note: { marginTop: 2 },
});
