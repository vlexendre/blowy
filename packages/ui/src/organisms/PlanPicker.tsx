import { StyleSheet, View } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { color, extra, radius, space, veil } from '../theme';

export interface Plan<K extends string = string> {
  key: K;
  /** « à l'année ». */
  title: string;
  /** « 4,99 € ». */
  price: string;
  /** « /mois ». */
  unit?: string;
  /** « facturé 59,88 €/an ». */
  caption?: string;
  /** Pastille (« −67 % »). */
  badge?: string;
}

export interface PlanPickerProps<K extends string = string> {
  plans: readonly Plan<K>[];
  value: K;
  onChange: (key: K) => void;
}

/** Choix de la formule Blowy+ : cartes côte à côte, la choisie en blanc (elle rebondit quand on la choisit). */
export function PlanPicker<K extends string>({ plans, value, onChange }: PlanPickerProps<K>) {
  return (
    <View accessibilityRole="radiogroup" style={[layout.row, styles.wrap]}>
      {plans.map((p, i) => {
        const on = p.key === value;
        return (
          <Pressable
            key={p.key}
            onPress={() => onChange(p.key)}
            haptic="selection"
            scaleTo={0.97}
            bounceKey={on}
            accessibilityRole="radio"
            accessibilityLabel={[p.title, p.price, p.unit, p.caption].filter(Boolean).join(' ')}
            accessibilityState={{ checked: on }}
            style={[styles.card, { flex: i === 0 ? 1.25 : 1 }, on ? styles.on : styles.off]}
          >
            <InkProvider value={on ? color.dark : color.white}>
              <Text variant="label" size={11} style={styles.title}>
                {p.title}
              </Text>
              <Text variant="bodyHeavy" size={22} style={styles.price}>
                {p.price}
                {p.unit ? (
                  <Text variant="bodyHeavy" size={14}>
                    {p.unit}
                  </Text>
                ) : null}
              </Text>
              {p.caption ? (
                <Text variant="small" size={12.5} style={styles.caption}>
                  {p.caption}
                </Text>
              ) : null}
            </InkProvider>
            {p.badge ? (
              <View style={styles.badge}>
                <Text variant="bodyHeavy" size={12} color={color.white}>
                  {p.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  // Maquette : 14 × 16 de marge, 100 de haut, bordure de 2 (blanche si choisie).
  card: { minHeight: 100, paddingVertical: 14, paddingHorizontal: space.lg, borderRadius: radius.lg - 4, borderWidth: 2 },
  on: { backgroundColor: color.white, borderColor: color.white },
  off: { backgroundColor: color.panel, borderColor: veil.glassStrong },
  title: { letterSpacing: 1.32, opacity: 0.7 },
  price: { marginTop: space.xs, lineHeight: 28 },
  caption: { opacity: 0.75, lineHeight: 17 },
  badge: { position: 'absolute', top: -12, right: space.md, paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: extra.heart },
});
