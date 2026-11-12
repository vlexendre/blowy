import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { ICON_NAMES, type IconName } from '../assets/pets';
import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';
import { useAnimatedNumber, useLoop } from '../lib/motion';
import { layout } from '../lib/styles';
import { color, motion, radius, space, veil } from '../theme';

export interface NeedMeterProps {
  /** Nom du besoin (« faim »). */
  label: string;
  /** Niveau de 0 (à plat) à 100 (comblé). */
  value: number;
  /** Icône 3D ou élément libre (image d'objet…). */
  icon?: IconName | ReactNode;
  /** Phrase affichée quand le besoin est bas (« il a faim »). */
  lowText?: string;
  /** Seuil « bas » (couleur corail, pulsation). Défaut 40 (comme `urgentNeed`). */
  lowAt?: number;
  /** Seuil « moyen » (orange). Défaut 65. */
  midAt?: number;
  /** Valeur lue (« faim : 35 sur 100 »). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const isIconName = (v: unknown): v is IconName => typeof v === 'string' && (ICON_NAMES as readonly string[]).includes(v);

/** Couleur du remplissage selon le niveau : jaune, orange puis corail quand ça presse. */
export function needColor(value: number, lowAt = 40, midAt = 65): string {
  if (value < lowAt) return color.coral;
  if (value < midAt) return color.orange;
  return color.accent;
}

/** Un besoin du pet : icône, nom, barre 0–100 dont la couleur change quand il baisse. */
export function NeedMeter({ label, value, icon, lowText, lowAt = 40, midAt = 65, accessibilityLabel, style }: NeedMeterProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const low = v < lowAt;
  const fill = needColor(v, lowAt, midAt);
  const w = useAnimatedNumber(v, motion.slow);
  const pulse = useLoop(700, low);
  const bar = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  const glow = useAnimatedStyle(() => ({ opacity: 1 - 0.35 * pulse.value }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? (low && lowText ? `${label}, ${lowText}` : label)}
      accessibilityValue={{ min: 0, max: 100, now: v }}
      style={[layout.row, layout.gapMd, style]}
    >
      <View style={[styles.icon, low && { borderColor: fill }]}>
        {isIconName(icon) ? <Icon name={icon} size={26} /> : icon}
      </View>
      <View style={[layout.grow, layout.gapXs]}>
        <View style={layout.rowBetween}>
          <Text variant="label">{label}</Text>
          {low && lowText ? (
            <Text variant="bodyBold" size={12} color={fill} numberOfLines={1} style={styles.low}>
              {lowText}
            </Text>
          ) : (
            <Text variant="bodyBold" size={12} muted>
              {`${v}`}
            </Text>
          )}
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { backgroundColor: fill }, bar, low && glow]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: veil.glass,
    borderWidth: 2,
    borderColor: veil.glass,
  },
  track: { height: 12, borderRadius: radius.pill, backgroundColor: veil.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, minWidth: 6 },
  low: { flexShrink: 1, marginLeft: space.sm, textAlign: 'right' },
});

