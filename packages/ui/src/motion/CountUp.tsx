import type { TypeName } from '@blowy/tokens';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { Text } from '../atoms/Text';
import { useAnimatedNumber } from '../lib/motion';
import { motion, type } from '../theme';

export interface CountUpProps {
  /** Valeur entière affichée. */
  value: number;
  /** Valeur de départ à la première apparition (ex. 0 pour compter depuis zéro). Défaut : `value` (pas d'animation). */
  from?: number;
  variant?: TypeName;
  size?: number;
  color?: string;
  muted?: boolean;
  /** Texte fixe avant / après le nombre (« + », « % »). */
  prefix?: string;
  suffix?: string;
  /** Durée du défilement (ms). Défaut `motion.slow`. */
  duration?: number;
  /** Libellé lu ; défaut le nombre. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;

function Column({
  n,
  place,
  line,
  variant,
  size,
  color,
  muted,
}: {
  n: SharedValue<number>;
  place: number;
  line: number;
  variant: TypeName;
  size?: number;
  color?: string;
  muted?: boolean;
}) {
  const roll = useAnimatedStyle(() => {
    const v = Math.max(0, n.value);
    // Compteur mécanique : un chiffre ne roule que pendant la dernière unité des chiffres à sa droite (retenue).
    const pos = (Math.floor(v / place) % 10) + Math.max(0, (v % place) - (place - 1));
    // Zéro de tête (colonne des dizaines quand on passe sous 10) : estompé.
    const lead = place > 1 && v < place - 0.5 ? Math.max(0, 1 - (place - 0.5 - v) / (place * 0.25)) : 1;
    return { opacity: lead, transform: [{ translateY: -pos * line }] };
  });
  return (
    <View style={{ height: line, overflow: 'hidden' }}>
      <Animated.View style={roll}>
        {DIGITS.map((d, i) => (
          <Text key={i} variant={variant} size={size} color={color} muted={muted} style={{ height: line, lineHeight: line, textAlign: 'center' }}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

/**
 * Nombre qui défile comme un compteur mécanique (chaque chiffre roule, transformations seulement, aucun rendu
 * par image). La largeur ne bouge pas pendant le défilement. Avec animations réduites : la valeur s'affiche d'un coup.
 */
export function CountUp({
  value,
  from,
  variant = 'bodyHeavy',
  size,
  color,
  muted,
  prefix,
  suffix,
  duration = motion.slow,
  accessibilityLabel,
  style,
}: CountUpProps) {
  const target = Math.round(value);
  const n = useAnimatedNumber(Math.abs(target), { duration, overshoot: 0.04, from: from === undefined ? undefined : Math.abs(Math.round(from)) });
  const base = type[variant];
  const fontSize = size ?? base.fontSize;
  const line = Math.round(fontSize * (base.lineHeight / base.fontSize));
  const digits = Math.max(1, String(Math.abs(target)).length);
  const places = Array.from({ length: digits }, (_, i) => 10 ** (digits - 1 - i));
  const sign = target < 0 ? '−' : '';
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? `${prefix ?? ''}${target}${suffix ?? ''}`} style={[styles.row, style]}>
      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {prefix || sign ? (
          <Text variant={variant} size={size} color={color} muted={muted} style={{ lineHeight: line }}>
            {`${prefix ?? ''}${sign}`}
          </Text>
        ) : null}
        {places.map((p) => (
          <Column key={p} n={n} place={p} line={line} variant={variant} size={size} color={color} muted={muted} />
        ))}
        {suffix ? (
          <Text variant={variant} size={size} color={color} muted={muted} style={{ lineHeight: line }}>
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
