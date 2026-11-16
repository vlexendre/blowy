import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Children, Fragment, isValidElement } from 'react';

import { Card } from '../atoms/Card';
import { Pressable } from '../atoms/Pressable';
import { Chip } from '../atoms/Chip';
import { Text } from '../atoms/Text';
import { alpha, color, density, radius, size, veil } from '../theme';

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
  /** Ligne d'un `EntryGroup` : pas de carte à elle (le groupe la dessine), filet entre deux lignes. */
  inGroup?: boolean;
}

/** Carte-ligne de l'accueil (`.card.row` de V6-Accueil) : visuel, titre en gras, ligne grise, puce ou chevron. */
export function EntryCard({ title, text, left, badge, chevron, tone = 'default', onPress, accessibilityLabel, style, inGroup }: EntryCardProps) {
  const label = accessibilityLabel ?? [title, text, badge].filter(Boolean).join(', ');
  const content = (
    <>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Text variant="bodyHeavy" size={density.title} numberOfLines={2}>
          {title}
        </Text>
        {text ? (
          <Text size={density.secondary} muted numberOfLines={2} style={styles.text}>
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
    </>
  );
  if (inGroup) {
    return onPress ? (
      <Pressable onPress={onPress} accessibilityLabel={label} scaleTo={0.99} dimTo={0.72} style={[styles.row, style]}>
        {content}
      </Pressable>
    ) : (
      <View style={[styles.row, style]} accessible accessibilityLabel={label}>
        {content}
      </View>
    );
  }
  return (
    <Card onPress={onPress} accessibilityLabel={label} padding="none" style={[styles.card, tone === 'alert' && styles.alert, style]}>
      {content}
    </Card>
  );
}

/**
 * Plusieurs entrées vers des écrans, réunies dans une seule carte (accueil : habitudes, garde-robe, caractère). Moins
 * de cartes empilées, la même chose à toucher. Les enfants sont des `EntryCard inGroup` ; un filet les sépare.
 */
export function EntryGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <Card padding="none" style={[styles.group, style]}>
      {rows.map((row, i) => (
        <Fragment key={row.key ?? i}>
          {i > 0 ? <View style={styles.hairline} /> : null}
          {row}
        </Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  // Échelle de densité : ligne de 56, écart 12, intérieur 8 × 14, rayon des cartes.
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.card, paddingVertical: 8, paddingHorizontal: density.cardPad, minHeight: density.entryRow },
  alert: { borderColor: alpha(color.danger, 0.5) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: density.cardPad, minHeight: density.entryRow },
  group: { borderRadius: radius.card, overflow: 'hidden' },
  hairline: { height: size.border, marginLeft: density.cardPad + 40 + 12, backgroundColor: veil.hairline },
  left: { width: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  text: { lineHeight: 18, marginTop: 1 },
});
