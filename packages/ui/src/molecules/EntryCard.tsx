import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Text } from '../atoms/Text';
import { alpha, color } from '../theme';

export interface EntryCardProps {
  /** « 13 objets sur 64 », « son caractère ». */
  title: string;
  /** Ligne grise sous le titre. */
  text?: string;
  /** Visuel à gauche (objet, picto). */
  left?: ReactNode;
  /** Puce jaune à droite (« 2 nouveaux »). */
  badge?: string;
  /** Chevron « › » à droite (entrée vers un écran). */
  chevron?: boolean;
  /** `alert` : filet rouge (V6-Boude, « nino ne sort plus »). */
  tone?: 'default' | 'alert';
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Carte-ligne de l'accueil (`.card.row` de V6-Accueil) : visuel, titre en gras, ligne grise, puce ou chevron. */
export function EntryCard({ title, text, left, badge, chevron, tone = 'default', onPress, accessibilityLabel, style }: EntryCardProps) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? [title, text, badge].filter(Boolean).join(', ')}
      padding="none"
      style={[styles.card, tone === 'alert' && styles.alert, style]}
    >
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Text variant="bodyHeavy" size={15} numberOfLines={2}>
          {title}
        </Text>
        {text ? (
          <Text size={12} muted style={styles.text}>
            {text}
          </Text>
        ) : null}
      </View>
      {badge ? <Chip label={badge} tone="accent" /> : null}
      {chevron ? (
        <Text variant="bodyHeavy" size={18} muted accessibilityElementsHidden importantForAccessibility="no">
          ›
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  // `.card` : rayon 24 ; ligne : écart 12, padding 10 14.
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 14, minHeight: 56 },
  alert: { borderColor: alpha(color.danger, 0.5), paddingVertical: 14 },
  left: { width: 46, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  text: { lineHeight: 16 },
});
