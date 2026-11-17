import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, space } from '../theme';

export interface SectionHeaderProps {
  /** Intertitre en capitales (« GROUPES »). */
  title: string;
  /** Action à droite (« + Nouveau groupe »), en jaune. */
  actionLabel?: string;
  onAction?: () => void;
  actionA11y?: string;
  style?: StyleProp<ViewStyle>;
}

/** Intertitre de liste (capitales 13, estompé) avec une petite action à droite, cible de 44 pt. */
export function SectionHeader({ title, actionLabel, onAction, actionA11y, style }: SectionHeaderProps) {
  return (
    <View style={[layout.rowBetween, styles.row, style]}>
      <Text variant="label" size={13} muted accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionA11y ?? actionLabel} hitSlop={6} style={[layout.row, styles.action]}>
          <Glyph name="plus" size={16} color={color.accent} />
          <Text variant="bodyHeavy" size={14} color={color.accent}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 44, paddingHorizontal: space.xs },
  title: { letterSpacing: 1.2 },
  action: { gap: 4, minHeight: 44, paddingLeft: space.sm },
});
