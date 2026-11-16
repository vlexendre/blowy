import { Children, isValidElement, type ReactNode, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, radius, size, space, veil } from '../theme';

export interface ShortcutTileProps {
  /** Un ou deux mots (« Habitudes »). */
  label: string;
  /** Picto, objet ou mini-minimoa (≈ 26 pt). */
  icon: ReactNode;
  /** Petit nombre à côté du picto (la série : flamme « 4 »). */
  value?: string;
  /** Pastille jaune en coin (« 2 » objets nouveaux, « 1 » habitude à faire). */
  badge?: string;
  /** Point jaune en coin : quelque chose attend là (bilan non lu, preuve demandée). */
  dot?: boolean;
  onPress: () => void;
  /** Libellé lu complet (« Garde-robe, 2 nouveaux »). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Petite tuile d'accès (accueil) : un picto et un libellé, sans description. Ce qui attend là se dit par une pastille
 * ou un point ; le détail est sur l'écran qu'elle ouvre.
 */
export function ShortcutTile({ label, icon, value, badge, dot, onPress, accessibilityLabel, style }: ShortcutTileProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? (badge ? `${label}, ${badge}` : label)} scaleTo={0.95} style={[styles.tile, style]}>
      <View style={styles.icon}>
        {icon}
        {value ? (
          <Text variant="bodyHeavy" size={15}>
            {value}
          </Text>
        ) : null}
      </View>
      <Text variant="bodyHeavy" size={13} center numberOfLines={2} style={styles.label}>
        {label}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text variant="bodyHeavy" size={13} color={color.dark} center>
            {badge}
          </Text>
        </View>
      ) : dot ? (
        <View style={styles.dot} />
      ) : null}
    </Pressable>
  );
}

/** Une rangée de `ShortcutTile` de même largeur (4 par ligne ; au-delà, une seconde ligne). */
export function ShortcutRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const tiles = Children.toArray(children).filter(isValidElement);
  // Largeur mesurée : toutes les tuiles ont la même, seconde ligne comprise.
  const [w, setW] = useState(0);
  const cell = w > 0 ? { width: Math.floor((w - GAP * (PER_ROW - 1)) / PER_ROW) } : styles.cell;
  return (
    <View style={[styles.row, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {tiles.map((t, i) => (
        <View key={t.key ?? i} style={cell}>
          {t}
        </View>
      ))}
    </View>
  );
}

const PER_ROW = 4;
const GAP = space.sm;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  // Quatre par ligne : (100 % − 3 écarts) / 4.
  cell: { flexBasis: '22%', flexGrow: 1, maxWidth: '24%' },
  tile: {
    flexGrow: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.panel,
    borderWidth: size.border,
    borderColor: veil.line,
  },
  icon: { height: 28, flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center' },
  label: { lineHeight: 16 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.accent,
  },
  dot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: color.accent },
});
