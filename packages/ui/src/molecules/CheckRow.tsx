import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { alpha, color, radius, space } from '../theme';

export interface CheckRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** La phrase d'accord, écrite simplement. */
  label: string;
  /** Précision sous la phrase, estompée (« Elle n'est montrée à personne… ») ; lue avec elle. */
  detail?: string;
}

/** Accord explicite : une case à cocher (coche qui « pop ») et sa phrase ; toute la ligne se touche. */
export function CheckRow({ checked, onChange, label, detail }: CheckRowProps) {
  const reduced = useReducedMotion();
  const p = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    p.value = reduced ? (checked ? 1 : 0) : withSpring(checked ? 1 : 0, springs.pop);
  }, [checked, reduced, p]);
  const fill = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.5 + 0.5 * p.value }] }));
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      haptic="selection"
      scaleTo={0.98}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={detail ? `${label} ${detail}` : label}
      style={[layout.row, styles.row, checked && styles.rowOn]}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        <Animated.View style={[styles.fill, fill]}>
          <Glyph name="check" size={15} color={color.dark} />
        </Animated.View>
      </View>
      <View style={[layout.grow, styles.texts]}>
        <Text variant="bodyBold" size={15}>
          {label}
        </Text>
        {detail ? (
          <Text size={13} muted>
            {detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md, alignItems: 'center', minHeight: 56, paddingHorizontal: 14, paddingVertical: space.md, borderRadius: radius.md, backgroundColor: color.panel, borderWidth: 1, borderColor: alpha(color.white, 0.08) },
  texts: { gap: space.xs },
  rowOn: { borderColor: alpha(color.accent, 0.6) },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: alpha(color.white, 0.4), alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: color.accent },
  fill: { position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 8, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
});
