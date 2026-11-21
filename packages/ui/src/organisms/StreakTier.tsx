import type { Species } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { StyleSheet, View } from 'react-native';
import { Button } from '../atoms/Button';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { CountUp } from '../motion/CountUp';
import { PopIn } from '../motion/PopIn';
import { alpha, space } from '../theme';

export interface StreakTierDay {
  letter: string;
  done: boolean;
  today: boolean;
  label: string;
}

export interface StreakTierProps {
  species: Species;
  count: number;
  from: number;
  /** « jours d'affilée ». */
  unit: string;
  days: readonly StreakTierDay[];
  shareLabel?: string | null;
  onShare?: () => void;
  continueLabel: string;
  onContinue: () => void;
  accessibilityLabel: string;
}

const ORANGE = color.orange;

/** La série qui monte (maquette V7 « Palier de série ») : fond orange plein, le grand nombre, la semaine cochée. */
export function StreakTier({ species, count, from, unit, days, shareLabel, onShare, continueLabel, onContinue, accessibilityLabel }: StreakTierProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <PopIn from={0.6}>
          <PetImage species={species} mood="joie" size={200} />
        </PopIn>
      </View>
      <View accessible accessibilityLabel={accessibilityLabel}>
        <View style={styles.center}>
          <CountUp value={count} from={from} variant="hero" size={130} color={color.white} />
        </View>
        <Text variant="h2" center color={color.white}>
          {unit}
        </Text>
      </View>
      <View style={styles.week}>
        {days.map((d, i) => (
          <View key={i} style={styles.day} accessible accessibilityLabel={d.label}>
            <Text variant="bodyHeavy" color={color.white}>
              {d.letter}
            </Text>
            <PopIn delay={400 + i * 150} onMount={d.done}>
              <View style={[styles.dot, d.done ? (d.today ? styles.today : styles.done) : styles.empty]}>
                {d.done ? <Text variant="bodyHeavy" color={d.today ? ORANGE : color.dark}>✓</Text> : null}
              </View>
            </PopIn>
          </View>
        ))}
      </View>
      <View style={styles.grow} />
      {shareLabel && onShare ? <Button label={shareLabel} variant="white" size="lg" onPress={onShare} block /> : null}
      <Button label={continueLabel} variant="link" onPress={onContinue} block />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingBottom: space.lg, gap: space.sm },
  stage: { height: 230, alignItems: 'center', justifyContent: 'flex-end', marginTop: space.lg },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xl },
  day: { alignItems: 'center', gap: space.sm },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: color.accentSoft },
  today: { backgroundColor: color.white },
  empty: { backgroundColor: alpha(color.dark, 0.16) },
  grow: { flex: 1 },
  center: { alignItems: 'center' },
});

/** Couleur de fond de l'écran de palier (le gabarit d'écran la pose). */
export const STREAK_TIER_BACKGROUND = ORANGE;
