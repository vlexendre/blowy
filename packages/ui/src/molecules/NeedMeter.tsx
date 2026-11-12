import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Text } from '../atoms/Text';
import { useAnimatedNumber, useLoop } from '../lib/motion';
import { CountUp } from '../motion/CountUp';
import { layout } from '../lib/styles';
import { color, motion, radius, size as sizes, veil } from '../theme';

export interface NeedMeterProps {
  /** Nom du besoin (« faim »). */
  label: string;
  /** Niveau de 0 (à plat) à 100 (comblé). */
  value: number;
  /** Phrase lue quand le besoin est bas (« il a faim »). */
  lowText?: string;
  /** Seuil « bas » (barre rouge qui pulse). Défaut 40 (comme `urgentNeed`). */
  lowAt?: number;
  /** Valeur lue (« faim : 35 sur 100 »). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Couleur du remplissage : jaune, rouge quand ça presse (`.bar i.low` des maquettes). */
export function needColor(value: number, lowAt = 40): string {
  return value < lowAt ? color.danger : color.accent;
}

/**
 * Un besoin du pet en tuile (`.need` de V6-Accueil) : nom en capitales, valeur, barre jaune ou rouge.
 * La barre se remplit avec un léger dépassement et le nombre défile (depuis 0 à l'apparition, puis à chaque soin).
 */
export function NeedMeter({ label, value, lowText, lowAt = 40, accessibilityLabel, style }: NeedMeterProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const low = v < lowAt;
  const fill = needColor(v, lowAt);
  const w = useAnimatedNumber(v, { duration: motion.slow, overshoot: 0.08, from: 0 });
  const track = useSharedValue(0);
  const pulse = useLoop(700, low);
  // Remplissage plein, glissé vers la gauche dans la piste qui le rogne (au moins 4 pt visibles).
  const bar = useAnimatedStyle(() => ({
    opacity: track.value > 0 ? (low ? 1 - 0.35 * pulse.value : 1) : 0,
    transform: [{ translateX: Math.max(-track.value + 4, (Math.min(102, w.value) / 100 - 1) * track.value) }],
  }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? (low && lowText ? `${label}, ${lowText}` : label)}
      accessibilityValue={{ min: 0, max: 100, now: v }}
      style={[styles.tile, style]}
    >
      <View style={layout.rowBetween}>
        <Text variant="bodyHeavy" size={11} muted numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        <CountUp value={v} from={0} variant="bodyHeavy" size={11} style={styles.value} />
      </View>
      <View
        style={styles.track}
        onLayout={(e) => {
          track.value = e.nativeEvent.layout.width;
        }}
      >
        <Animated.View style={[styles.fill, { backgroundColor: fill }, bar]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // `.need` : carte 20, padding 10 12 ; libellé 11/800, approche .1em, capitales.
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: color.panel,
    borderWidth: sizes.border,
    borderColor: veil.line,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: { flexShrink: 1, textTransform: 'uppercase', letterSpacing: 1.1 },
  value: { marginLeft: 4 },
  // `.bar` : 9 de haut, piste blanche à 12 %, 8 sous le libellé.
  track: { height: 9, marginTop: 8, borderRadius: radius.pill, backgroundColor: veil.track, overflow: 'hidden' },
  fill: { height: '100%', width: '100%', borderRadius: radius.pill },
});
