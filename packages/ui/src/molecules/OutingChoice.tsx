import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Loader } from '../atoms/Loader';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { Burst } from '../motion/Burst';
import { Pulse } from '../motion/PopIn';
import { alpha, color, motion, radius, space, veil } from '../theme';

export interface OutingChoiceProps {
  /** Visuel de la réponse (emoji), au-dessus du libellé. */
  emoji?: string;
  /** Libellé court (« Vu du monde »). */
  label: string;
  /** Libellé lu (la réponse complète servie par l'API). */
  accessibilityLabel: string;
  /** `go` : une sortie (jaune une fois choisie, étincelles) ; `stay` : « pas encore » (choix calme, filet jaune). */
  tone?: 'go' | 'stay';
  /** Réponse du jour. */
  selected?: boolean;
  /** En cours d'envoi : la tuile se remplit tout de suite, trois boules sous l'emoji. */
  pending?: boolean;
  /** Une autre réponse part : celle-ci s'efface un peu et ne se touche plus. */
  dimmed?: boolean;
  /** Attirer l'œil (le minimoa a besoin de sortir) : l'emoji bat deux fois, après `pulseDelay`. */
  pulse?: boolean;
  pulseDelay?: number;
  onPress: () => void;
}

/**
 * Une réponse de la question de sortie, en tuile (V6-GAccueil `.ans`) : emoji au-dessus, libellé court dessous.
 * Au toucher, l'emoji fait un bond (ressort `pop`) et une sortie lâche quelques étincelles ; la tuile passe au jaune
 * sans attendre le serveur. Animations réduites : changement de couleur seul.
 */
export function OutingChoice({
  emoji,
  label,
  accessibilityLabel,
  tone = 'go',
  selected = false,
  pending = false,
  dimmed = false,
  pulse = false,
  pulseDelay = 900,
  onPress,
}: OutingChoiceProps) {
  const reduced = useReducedMotion();
  const hop = useSharedValue(0);
  const [sparks, setSparks] = useState(0);
  const lit = pending || selected;
  const filled = lit && tone === 'go';
  const ink = filled ? color.dark : color.white;

  const press = () => {
    if (!reduced) {
      hop.value = withSequence(
        withTiming(1, { duration: motion.fast, easing: ease.out }),
        withSpring(0, springs.pop),
      );
      if (tone === 'go') setSparks((n) => n + 1);
    }
    onPress();
  };
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -10 * hop.value },
      { scale: 1 + 0.3 * hop.value },
      { rotate: `${-12 * hop.value}deg` },
    ],
  }));
  const fade = useAnimatedStyle(() => ({ opacity: fadeTo(dimmed ? 0.45 : 1) }));

  return (
    <Animated.View style={[styles.slot, fade]}>
      <Pressable
        onPress={press}
        disabled={dimmed || pending}
        haptic="medium"
        bounceKey={selected}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, busy: pending, disabled: dimmed || pending }}
        style={[styles.tile, filled && styles.filled, lit && tone === 'stay' && styles.stay]}
      >
        <View
          style={styles.emojiBox}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Pulse active={pulse && !lit} beats={2} scale={1.18} delay={pulseDelay}>
            <Animated.View style={emojiStyle}>
              {emoji ? (
                <Text size={21} style={styles.emoji}>
                  {emoji}
                </Text>
              ) : null}
            </Animated.View>
          </Pulse>
          <Burst
            kind="sparkles"
            trigger={sparks}
            seed={label}
            colors={[color.accent, color.accentSoft, color.white]}
            style={styles.burst}
          />
        </View>
        <View style={styles.labelBox}>
          <Text
            variant="bodyHeavy"
            size={14}
            center
            color={ink}
            numberOfLines={2}
            style={pending ? styles.hidden : undefined}
          >
            {label}
          </Text>
          {pending ? (
            <View style={[StyleSheet.absoluteFill, styles.loader]}>
              <Loader color={filled ? color.dark : 'accent'} size={6} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  // Tuile de 56 : un cran plus claire que la carte (`card`), filet fin, rayon des tuiles.
  tile: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: space.xs,
    paddingTop: space.xs + 2,
    paddingBottom: space.xs + 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: veil.line,
  },
  filled: { backgroundColor: color.accent, borderColor: color.accent },
  stay: { backgroundColor: veil.glassStrong, borderColor: alpha(color.accent, 0.9) },
  emojiBox: { height: 24, alignItems: 'center', justifyContent: 'center' },
  emoji: { lineHeight: 24 },
  burst: { position: 'absolute', left: '50%', top: 12 },
  labelBox: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
  loader: { alignItems: 'center', justifyContent: 'center' },
});
