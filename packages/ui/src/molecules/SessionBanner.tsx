import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, extra, radius, space } from '../theme';

export interface SessionBannerProps {
  /** Petite ligne en capitales (« Séance du jour · 5 questions · 2 min »). */
  kicker: string;
  /** Le thème de l'unité, en titre (« Ta façon de vivre »). */
  title: string;
  /** À droite (« À la fin : ta personne du jour »). */
  note?: string | null;
  /** `unit` : violet en relief (la séance attend) · `calm` : carte sombre (séance faite, rien à faire). */
  tone?: 'unit' | 'calm';
  /** Sous le titre : une action ou une ligne de plus (« Demain, une nouvelle séance »). */
  footer?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * Le bandeau de la séance du jour, sous la carte du minimoa (V6-GAccueil) : le thème de l'unité en grand, ce que
 * dure la séance, ce qu'il y a au bout. Violet « en relief » (tranche plus foncée dessous) tant que la séance attend.
 */
export function SessionBanner({ kicker, title, note, tone = 'unit', footer, onPress, accessibilityLabel }: SessionBannerProps) {
  const unit = tone === 'unit';
  const ink = unit ? extra.relief.unitInk : color.mute;
  const body = (
    <View style={[styles.card, unit ? styles.unit : styles.calm]}>
      <Text variant="label" color={ink} numberOfLines={2}>
        {kicker}
      </Text>
      <View style={[layout.rowBetween, styles.row]}>
        <Text variant="h2" size={26} color={color.white} style={layout.shrink}>
          {title}
        </Text>
        {note ? (
          <Text variant="bodyHeavy" size={13} color={ink} style={styles.note}>
            {note}
          </Text>
        ) : null}
      </View>
      {footer}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? `${kicker}, ${title}`} scaleTo={0.98}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, paddingHorizontal: space.lg, paddingTop: space.sm + 2, paddingBottom: space.md, gap: 2 },
  unit: { backgroundColor: extra.relief.unit, borderBottomWidth: 5, borderBottomColor: extra.relief.unitEdge },
  calm: { backgroundColor: color.panel, borderWidth: 1, borderColor: extra.relief.path },
  row: { gap: space.md, alignItems: 'center' },
  note: { maxWidth: 120, textAlign: 'right' },
});
