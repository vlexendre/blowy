import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Children, Fragment, isValidElement } from 'react';

import { Card } from '../atoms/Card';
import { Pressable } from '../atoms/Pressable';
import { Chip } from '../atoms/Chip';
import { Text } from '../atoms/Text';
import { alpha, color, size, veil } from '../theme';

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
        <Text variant="bodyHeavy" size={17} numberOfLines={2}>
          {title}
        </Text>
        {text ? (
          <Text size={15} muted style={styles.text}>
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
  // `.card` : rayon 24 ; ligne : écart 12, padding 10 14.
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 16, minHeight: 64 },
  alert: { borderColor: alpha(color.danger, 0.5), paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 64 },
  group: { borderRadius: 24, overflow: 'hidden' },
  hairline: { height: size.border, marginLeft: 74, backgroundColor: veil.hairline },
  left: { width: 46, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  text: { lineHeight: 20, marginTop: 1 },
});
