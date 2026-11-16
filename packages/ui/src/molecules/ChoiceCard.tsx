import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { type StyleProp, StyleSheet, Text as RNText, View, type ViewStyle } from 'react-native';

import type { IconName } from '../assets/pets';
import { Glyph } from '../atoms/Glyph';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { alpha, color, type GradientName, gradient as gradients, onGradient, opacity, space } from '../theme';

export interface ChoiceCardProps {
  title: string;
  /** Petite ligne en capitales (« → casanier »). */
  caption?: string;
  /** Phrase sous le titre, en casse normale (« Des gens avec qui sortir. ») : à la place de `caption`. */
  subtitle?: string;
  /** Carte sombre liserée, qui passe au jaune une fois choisie (test de vision, sexe, ce que tu cherches). */
  plain?: boolean;
  /** Liseré clair autour de la carte (cartes sombres sur la nuit). */
  outlined?: boolean;
  /** Hauteur réduite (listes de 3 ou 4 choix : sexe, ce que tu cherches). */
  compact?: boolean;
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
  /**
   * Pastille ronde à droite, comme un bouton radio : vide tant qu'on n'a pas choisi, pleine avec une coche une fois
   * choisie. Dit sans texte « une des cartes se choisit ».
   */
  marker?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Réponse de quiz ou de défi : grande carte touchable (`.panel` 28 pt de rayon, 104 pt de haut). */
export function ChoiceCard({ title, caption, subtitle, compact, plain, outlined: outlinedProp, icon, emoji, gradient = 'night', colors, ink, selected, tilt = -2, faded, disabled, marker, onPress, accessibilityLabel, style }: ChoiceCardProps) {
  const reduced = useReducedMotion();
  // Choisie : la carte s'incline et grandit un peu, en ressort (un rebond) ; posée d'emblée si animations réduites.
  const pick = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    pick.value = reduced ? (selected ? 1 : 0) : withSpring(selected ? 1 : 0, springs.pop);
  }, [selected, reduced, pick]);
  const lean = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt * pick.value}deg` }, { scale: 1 + 0.03 * pick.value }] }));
  const dot = useAnimatedStyle(() => ({ opacity: pick.value, transform: [{ scale: 0.4 + 0.6 * pick.value }] }));
  const outlined = outlinedProp ?? (plain && !selected);
  const fill = plain ? (selected ? gradients.accent : PLAIN) : (colors ?? gradients[gradient]);
  const fg = plain ? (selected ? color.dark : color.white) : (ink ?? onGradient[gradient]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      haptic="selection"
      scaleTo={0.97}
      accessibilityLabel={accessibilityLabel ?? (caption || subtitle ? `${title}, ${caption ?? subtitle}` : title)}
      accessibilityRole={marker ? 'radio' : 'button'}
      accessibilityState={marker ? { checked: !!selected, disabled: !!disabled } : { selected: !!selected, disabled: !!disabled }}
      style={[styles.card, compact && styles.compact, faded && styles.faded, style]}
    >
      <Animated.View style={[styles.inner, compact && styles.compact, outlined && styles.outlined, lean]}>
        <LinearGradient colors={fill} style={[StyleSheet.absoluteFill, styles.fill]} />
        <InkProvider value={fg}>
          <View style={[layout.row, styles.row, compact && styles.rowCompact]}>
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
              {subtitle ? (
                <Text size={15} style={styles.subtitle}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {marker ? (
              <View style={[styles.marker, { borderColor: alpha(fg, 0.55) }]} accessible={false}>
                <Animated.View style={[styles.markerFill, { backgroundColor: fg }, dot]}>
                  <Glyph name="check" size={14} color={fg === color.dark ? color.white : color.dark} />
                </Animated.View>
              </View>
            ) : null}
          </View>
        </InkProvider>
      </Animated.View>
    </Pressable>
  );
}

const RADIUS = 28;
/** Carte sombre du style `plain`. */
const PLAIN = [color.card, color.panel] as const;

const styles = StyleSheet.create({
  card: { minHeight: 104, borderRadius: RADIUS },
  inner: { flexGrow: 1, minHeight: 104, borderRadius: RADIUS, justifyContent: 'center' },
  fill: { borderRadius: RADIUS },
  row: { gap: 12, paddingHorizontal: 14, paddingVertical: space.md },
  emojiBox: { width: 38, alignItems: 'center' },
  emoji: { fontSize: 38, lineHeight: 44 },
  texts: { gap: 6 },
  title: { lineHeight: 22, letterSpacing: -0.19 },
  caption: { letterSpacing: 1.32, opacity: 0.7 },
  subtitle: { opacity: 0.78, lineHeight: 20, marginTop: 2 },
  compact: { minHeight: 76 },
  rowCompact: { paddingVertical: space.md },
  outlined: { borderWidth: 1, borderColor: alpha(color.white, 0.1), overflow: 'hidden' },
  faded: { opacity: opacity.disabled },
  marker: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  markerFill: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
