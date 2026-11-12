import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { type StyleProp, StyleSheet, Text as RNText, View, type ViewStyle } from 'react-native';

import type { IconName } from '../assets/pets';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { type GradientName, gradient as gradients, onGradient, opacity, space } from '../theme';

export interface ChoiceCardProps {
  title: string;
  /** Petite ligne en capitales (« → casanier »). */
  caption?: string;
  /** Icône 3D à gauche, ou élément libre. */
  icon?: IconName | ReactNode;
  /** Emoji à gauche (38 pt), comme les réponses du quiz. */
  emoji?: string;
  /** Dégradé du fond. Défaut `night` (carte sombre). */
  gradient?: GradientName;
  /** Dégradé libre (prioritaire sur `gradient`) et son encre. */
  colors?: readonly [string, string];
  ink?: string;
  selected?: boolean;
  /** Inclinaison quand la carte est choisie (maquettes : -2° pour la première, 2° pour la seconde). */
  tilt?: number;
  /** Réponse non retenue après le choix : estompée. */
  faded?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Réponse de quiz ou de défi : grande carte touchable (`.panel` 28 pt de rayon, 104 pt de haut). */
export function ChoiceCard({ title, caption, icon, emoji, gradient = 'night', colors, ink, selected, tilt = -2, faded, disabled, onPress, accessibilityLabel, style }: ChoiceCardProps) {
  const reduced = useReducedMotion();
  // Choisie : la carte s'incline et grandit un peu, en ressort (un rebond) ; posée d'emblée si animations réduites.
  const pick = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    pick.value = reduced ? (selected ? 1 : 0) : withSpring(selected ? 1 : 0, springs.pop);
  }, [selected, reduced, pick]);
  const lean = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt * pick.value}deg` }, { scale: 1 + 0.03 * pick.value }] }));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      haptic="selection"
      scaleTo={0.97}
      accessibilityLabel={accessibilityLabel ?? (caption ? `${title}, ${caption}` : title)}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[styles.card, faded && styles.faded, style]}
    >
      <Animated.View style={[styles.inner, lean]}>
        <LinearGradient colors={colors ?? gradients[gradient]} style={[StyleSheet.absoluteFill, styles.fill]} />
        <InkProvider value={ink ?? onGradient[gradient]}>
          <View style={[layout.row, styles.row]}>
            {emoji ? (
              <View style={styles.emojiBox}>
                <RNText style={styles.emoji} accessible={false} numberOfLines={1}>
                  {emoji}
                </RNText>
              </View>
            ) : typeof icon === 'string' ? (
              <Icon name={icon as IconName} size={38} />
            ) : (
              icon
            )}
            <View style={[layout.grow, styles.texts]}>
              <Text variant="bodyHeavy" size={19} style={styles.title}>
                {title}
              </Text>
              {caption ? (
                <Text variant="label" size={11} style={styles.caption}>
                  {caption}
                </Text>
              ) : null}
            </View>
          </View>
        </InkProvider>
      </Animated.View>
    </Pressable>
  );
}

const RADIUS = 28;

const styles = StyleSheet.create({
  card: { minHeight: 104, borderRadius: RADIUS },
  inner: { flexGrow: 1, minHeight: 104, borderRadius: RADIUS, justifyContent: 'center' },
  fill: { borderRadius: RADIUS },
  row: { gap: 14, paddingHorizontal: 18, paddingVertical: space.lg },
  emojiBox: { width: 38, alignItems: 'center' },
  emoji: { fontSize: 38, lineHeight: 44 },
  texts: { gap: 6 },
  title: { lineHeight: 22, letterSpacing: -0.19 },
  caption: { letterSpacing: 1.32, opacity: 0.7 },
  faded: { opacity: opacity.disabled },
});
