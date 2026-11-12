import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { CountUp } from '../motion/CountUp';
import { useFirstTime } from '../motion/once';
import { radius, space, veil } from '../theme';

export interface StreakPillProps {
  count: number;
  /** Unité (« jours », « série »). */
  label: string;
  /** `pill` : puce compacte ; `stack` : flamme, gros chiffre Anton et unité empilés (photo du jour). */
  variant?: 'pill' | 'stack';
  accessibilityLabel?: string;
  /**
   * Variante `stack` : clé de la série (ex. id du lien). À sa première apparition, la flamme grandit en vacillant
   * et le chiffre défile depuis 0.
   */
  growKey?: string;
  style?: StyleProp<ViewStyle>;
}

/** Série de jours avec la flamme. */
export function StreakPill({ count, label, variant = 'pill', accessibilityLabel, growKey, style }: StreakPillProps) {
  const a11y = accessibilityLabel ?? `${count} ${label}`;
  if (variant === 'stack') {
    return (
      <View accessible accessibilityLabel={a11y} style={[styles.stack, style]}>
        {growKey ? <Flame growKey={growKey} count={count} /> : <Icon name="flamme" size={50} />}
        {growKey ? (
          <CountUp value={count} from={0} variant="h2" size={30} duration={600} style={styles.count} />
        ) : (
          <Text variant="h2" size={30} style={styles.count}>
            {String(count)}
          </Text>
        )}
        <Text variant="bodyHeavy" size={11}>
          {label}
        </Text>
      </View>
    );
  }
  return (
    <View accessible accessibilityLabel={a11y} style={[styles.pill, layout.row, style]}>
      <Icon name="flamme" size={16} />
      <Text variant="bodyBold" size={12}>{`${count} ${label}`}</Text>
    </View>
  );
}

/** Flamme qui grandit (plus haut quand la série est longue), vacille deux fois, puis se pose. Rien si animations réduites. */
function Flame({ growKey, count }: { growKey: string; count: number }) {
  const first = useFirstTime(`streak:${growKey}`);
  const reduced = useReducedMotion();
  const play = first && !reduced;
  const s = useSharedValue(play ? 0.2 : 1);
  const r = useSharedValue(0);
  useEffect(() => {
    if (!play) return;
    // Une longue série monte plus haut avant de se poser.
    const peak = 1.12 + Math.min(0.18, count * 0.02);
    s.value = withDelay(150, withSequence(withTiming(peak, { duration: 380, easing: ease.out }), withSpring(1, springs.plush)));
    const w = (to: number) => withTiming(to, { duration: 110, easing: ease.inOut });
    r.value = withDelay(300, withSequence(w(-8), w(7), w(-5), w(3), withSpring(0, springs.pop)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${r.value}deg` }] }));
  return (
    <Animated.View style={[styles.flame, style]}>
      <Icon name="flamme" size={50} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flame: { transformOrigin: '50% 90%' },
  stack: { alignItems: 'center' },
  count: { marginTop: -6 },
  pill: { alignSelf: 'flex-start', height: 30, gap: space.xs, paddingHorizontal: space.md - 2, borderRadius: radius.pill, backgroundColor: veil.darkGlass },
});
