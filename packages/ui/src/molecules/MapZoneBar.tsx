import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, space, veil } from '../theme';

export interface MapZoneBarProps {
  /** Ce qu'on regarde : « Ta zone · 1,5 km », « Tu regardes Lyon · 20 km », « Tu regardes ailleurs ». */
  label: string;
  /** Vrai hors de sa zone (ville choisie, carte déplacée) : point blanc au lieu du jaune, et l'action pour revenir. */
  away?: boolean;
  /** Ligne discrète dessous (« Positions arrondies, jamais en direct. »). */
  note?: string;
  /** Revenir (« Revenir à ma zone », « Recentrer »). */
  actionLabel?: string;
  onAction?: () => void;
  actionA11y?: string;
  actionLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Où l'on est sur la carte, sous le titre : une pilule (point jaune = ta zone, point blanc = ailleurs) et, ailleurs,
 * le bouton pour revenir à côté. Toujours lisible sur la carte (fond nuit opaque).
 */
export function MapZoneBar({
  label,
  away = false,
  note,
  actionLabel,
  onAction,
  actionA11y,
  actionLoading,
  style,
}: MapZoneBarProps) {
  return (
    <View style={[styles.col, style]} pointerEvents="box-none">
      <View style={[layout.row, styles.row]} pointerEvents="box-none">
        <View
          style={[layout.row, styles.pill, away ? styles.pillAway : null]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={label}
        >
          <View style={[styles.dot, { backgroundColor: away ? color.white : color.accent }]} />
          <Text variant="bodyHeavy" size={14} numberOfLines={1} style={layout.shrink}>
            {label}
          </Text>
        </View>
        {actionLabel && onAction ? (
          <Button
            label={actionLabel}
            variant="accent"
            size="chip"
            onPress={onAction}
            loading={actionLoading}
            accessibilityLabel={actionA11y}
          />
        ) : null}
      </View>
      {note ? (
        <Text size={13} muted numberOfLines={2} style={styles.note}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: space.xs, alignItems: 'flex-start' },
  row: { gap: space.sm, flexWrap: 'wrap' },
  pill: {
    gap: space.sm,
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: 999,
    backgroundColor: alpha(color.panel, 0.94),
    borderWidth: 1,
    borderColor: alpha(color.accent, 0.5),
    flexShrink: 1,
    minWidth: 0,
  },
  pillAway: { borderColor: veil.glassStrong },
  dot: { width: 8, height: 8, borderRadius: 4 },
  note: { paddingLeft: 2, maxWidth: 320 },
});
