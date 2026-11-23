import type { Species } from '@blowy/domain';
import { color } from '@blowy/tokens';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable as RNPressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { hapticFor } from '../lib/haptics';
import { useReducedMotion } from '../lib/motion';
import { useOverlay } from '../lib/overlay';
import { Burst } from '../motion/Burst';
import { CountUp } from '../motion/CountUp';
import { PopIn } from '../motion/PopIn';
import { space } from '../theme';

/** Durée de la fête d'un palier : sous les 3 s de la règle (docs/ADA-2027.md, grille n° 7). */
export const STREAK_TIER_MS = 2600;

export interface StreakTierProps {
  visible: boolean;
  species: Species;
  /** Le palier atteint (7, 30, 100, 365). */
  count: number;
  /** « jours d’affilée ». */
  unit: string;
  /** Ce que dit le minimoa, sous le chiffre. */
  line?: string | null;
  /** « Touche pour continuer ». */
  tapLabel: string;
  /** Ce que lit VoiceOver (« 7 jours d’affilée »). */
  accessibilityLabel: string;
  /** Appelé au tap, ou de lui-même après `STREAK_TIER_MS`. */
  onDone: () => void;
}

/**
 * La fête d'un palier de série (7, 30, 100, 365 jours), plein écran orange : le minimoa, le grand chiffre, une phrase.
 * Moins de 3 s, puis elle se ferme seule ; un tap n'importe où la coupe. Une vibration, des confettis ; animations
 * réduites : ni confettis ni défilement, un simple fondu. VoiceOver : la fête est annoncée, puis rend la main.
 */
export function StreakTier({ visible, species, count, unit, line, tapLabel, accessibilityLabel, onDone }: StreakTierProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Petit écran (375 × 667) : le minimoa rapetisse pour que rien ne déborde, même en grand texte.
  const PET = height < 740 ? 150 : 200;
  const reduced = useReducedMotion();
  const [confetti, setConfetti] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useOverlay(visible);

  useEffect(() => {
    if (!visible) return;
    hapticFor('celebrate');
    if (!reduced) setConfetti((n) => n + 1);
    AccessibilityInfo.announceForAccessibility(line ? `${accessibilityLabel}. ${line}` : accessibilityLabel);
    const timer = setTimeout(() => done.current(), STREAK_TIER_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onDone} statusBarTranslucent>
      {visible ? (
        <RNPressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityViewIsModal
          accessibilityLabel={line ? `${accessibilityLabel}. ${line}` : accessibilityLabel}
          accessibilityHint={tapLabel}
          style={[styles.root, { paddingTop: insets.top + space.xl, paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]}
        >
          <View style={styles.stage}>
            <PopIn from={0.6}>
              <PetImage species={species} mood="joie" size={PET} />
            </PopIn>
            <Burst kind="confetti" trigger={confetti} count={16} size={12} spread={200} seed={`palier:${count}`} style={styles.burst} />
          </View>
          <View style={styles.center}>
            <CountUp value={count} from={Math.max(0, count - 1)} variant="hero" size={120} duration={600} color={color.dark} />
          </View>
          <Text variant="h2" center color={color.dark}>
            {unit}
          </Text>
          {line ? (
            <Text variant="bodyBold" size={17} center color={color.dark} style={styles.line}>
              {line}
            </Text>
          ) : null}
          <View style={styles.grow} />
          <Text size={14} center color={color.dark}>
            {tapLabel}
          </Text>
        </RNPressable>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.xl, backgroundColor: color.orange, gap: space.sm },
  stage: { alignItems: 'center', justifyContent: 'flex-end' },
  burst: { position: 'absolute', left: '50%', top: 40 },
  center: { alignItems: 'center' },
  line: { marginTop: space.sm },
  grow: { flex: 1 },
});

/** Couleur de fond de la fête d'un palier. */
export const STREAK_TIER_BACKGROUND = color.orange;
