import { GAUGE_MAX } from '@blowy/domain';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { useAnimatedNumber } from '../lib/motion';
import { PillSpan } from '../motion/PillSpan';
import { layout } from '../lib/styles';
import { alpha, color, motion, radius, size as sizes, space, veil } from '../theme';

export interface GaugeBarProps {
  /** Valeur de -100 (pôle bas) à +100 (pôle haut), 0 au centre. */
  value: number;
  low: string;
  high: string;
  /** Légende centrale (« sociabilité · +45 »). */
  caption?: string;
  /** Repère secondaire (ex. valeur visée en rose sur l'écran évolution). */
  target?: number;
  color?: string;
  /** Version serrée : barre fine, libellés petits (quiz, page 3 mots). */
  compact?: boolean;
  /** Mise en avant (bordure d'accent). */
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Largeur de référence du milieu étiré de la pilule (plus grande que toute piste). */
const TRACK_SPAN = 400;

const toPct = (v: number): number => 50 + (Math.max(-GAUGE_MAX, Math.min(GAUGE_MAX, v)) / GAUGE_MAX) * 50;

/**
 * Jauge à deux pôles centrée sur 0 : une barre qui se remplit du centre vers un pôle, sans curseur (c'est un
 * compteur, pas un réglage : rien ne doit donner envie de la tirer). Le remplissage dépasse un peu avant de se poser
 * (depuis le centre à l'apparition) ; transformations seulement.
 */
export function GaugeBar({ value, low, high, caption, target, color: fill = color.accent, compact, selected, onPress, accessibilityLabel, style }: GaugeBarProps) {
  const x = useAnimatedNumber(toPct(value), { duration: motion.slow, overshoot: 0.1, from: 50 });
  const w = useSharedValue(0);
  const center = useDerivedValue(() => w.value / 2);
  const end = useDerivedValue(() => (Math.max(0, Math.min(100, x.value)) / 100) * w.value);
  const barH = compact ? 7 : 10;
  const lead = value > 0 ? 'high' : value < 0 ? 'low' : null;
  const label = accessibilityLabel ?? `${low} ${high} ${Math.round(value)}`;
  const body = (
    <>
      <View style={[layout.rowBetween, styles.labels]}>
        <Text variant={lead === 'low' ? 'bodyHeavy' : 'body'} size={compact ? 11 : 13} muted={lead !== 'low'} style={!compact && styles.pole} numberOfLines={1}>
          {low}
        </Text>
        {caption ? (
          <Text variant="bodyHeavy" size={11} muted style={styles.caption} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
        <Text variant={lead === 'high' ? 'bodyHeavy' : 'body'} size={compact ? 11 : 13} muted={lead !== 'high'} style={[!compact && styles.pole, styles.right]} numberOfLines={1}>
          {high}
        </Text>
      </View>
      <View
        onLayout={(e) => {
          w.value = e.nativeEvent.layout.width;
        }}
        style={[styles.track, { height: barH }]}
      >
        <View style={styles.zero} />
        <PillSpan from={center} to={end} height={barH} color={fill} span={TRACK_SPAN} />
        {target !== undefined ? <View style={[styles.target, { left: `${toPct(target)}%` }]} /> : null}
      </View>
    </>
  );
  const frame = [styles.frame, selected && styles.selected, compact && styles.compactFrame, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} haptic="selection" scaleTo={0.98} accessibilityLabel={label} accessibilityState={{ selected: !!selected }} style={frame}>
        {body}
      </Pressable>
    );
  }
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ text: lead ? (lead === 'low' ? low : high) : undefined }} style={frame}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { paddingHorizontal: space.sm, paddingTop: space.xs, paddingBottom: space.sm, minHeight: sizes.touch, borderRadius: 16, borderWidth: sizes.border, borderColor: 'transparent' },
  compactFrame: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, minHeight: 0 },
  selected: { borderColor: alpha(color.accent, 0.45), backgroundColor: alpha(color.accent, 0.09) },
  labels: { marginBottom: 5 },
  pole: { width: '33%' },
  right: { textAlign: 'right' },
  caption: { flexShrink: 1, textAlign: 'center', letterSpacing: 0.66 },
  track: { borderRadius: radius.pill, backgroundColor: veil.track },
  zero: { position: 'absolute', left: '50%', top: -3, bottom: -3, width: 2, backgroundColor: alpha(color.white, 0.35) },
  target: { position: 'absolute', top: -3, bottom: -3, width: 3, marginLeft: -1.5, borderRadius: 2, backgroundColor: color.rose },
});
