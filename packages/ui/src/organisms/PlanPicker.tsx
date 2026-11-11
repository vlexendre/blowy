import { StyleSheet, View } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { color, extra, radius, size, space, veil } from '../theme';

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

/** Choix de la formule Blowy+ : cartes côte à côte, la choisie en blanc. */
export function PlanPicker<K extends string>({ plans, value, onChange }: PlanPickerProps<K>) {
  return (
    <View accessibilityRole="radiogroup" style={[layout.row, layout.gapMd, styles.wrap]}>
      {plans.map((p) => {
        const on = p.key === value;
        return (
          <Pressable
            key={p.key}
            onPress={() => onChange(p.key)}
            haptic="selection"
            scaleTo={0.97}
            accessibilityRole="radio"
            accessibilityLabel={[p.title, p.price, p.unit, p.caption].filter(Boolean).join(' ')}
            accessibilityState={{ checked: on }}
            style={[styles.card, on ? styles.on : styles.off]}
          >
            <InkProvider value={on ? color.dark : color.white}>
              <Text variant="label" size={11} muted>
                {p.title}
              </Text>
              <Text variant="bodyBold" size={22} style={styles.price}>
                {p.price}
                {p.unit ? (
                  <Text variant="bodyBold" size={15}>
                    {p.unit}
                  </Text>
                ) : null}
              </Text>
              {p.caption ? (
                <Text variant="small" muted>
                  {p.caption}
                </Text>
              ) : null}
            </InkProvider>
            {p.badge ? (
              <View style={styles.badge}>
                <Text variant="bodyBold" size={12} color={color.white}>
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
  wrap: { paddingTop: space.md },
  card: { flex: 1, minHeight: size.button.lg * 1.8, padding: space.lg, borderRadius: radius.lg - 4, gap: space.xs, justifyContent: 'center' },
  on: { backgroundColor: color.white },
  off: { backgroundColor: color.panel, borderWidth: 1, borderColor: veil.glassStrong },
  price: { marginTop: space.xs },
  badge: { position: 'absolute', top: -space.md, right: space.md, paddingHorizontal: space.md - 2, paddingVertical: space.xs, borderRadius: radius.pill, backgroundColor: extra.heart },
});
