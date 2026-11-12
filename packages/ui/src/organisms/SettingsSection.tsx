import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { ListRow, type ListRowProps } from '../molecules/ListRow';
import { color, size, space, type, veil } from '../theme';

export interface SettingsSectionProps {
  title?: string;
  /** Lignes décrites en données (la dernière n'a pas de filet)… */
  rows?: readonly (ListRowProps & { key: string })[];
  /** …ou contenu libre. */
  children?: ReactNode;
  /** Texte d'aide sous la section. */
  footer?: string;
  /** `group` : carte bordée (`.grp`, défaut) ; `plain` : lignes posées sur le fond (liste courte de Moi). */
  variant?: 'group' | 'plain';
  /** Fond de la carte : `panel` (défaut) ou `raised` (`color.card`, dans une feuille comme V6-LienOptions). */
  tone?: 'panel' | 'raised';
  style?: StyleProp<ViewStyle>;
}

/** Groupe de réglages : titre en capitales (`.sec`), lignes dans une carte, aide. */
export function SettingsSection({ title, rows, children, footer, variant = 'group', tone = 'panel', style }: SettingsSectionProps) {
  const plain = variant === 'plain';
  return (
    <View style={[styles.base, style]}>
      {title ? (
        <Text variant="label" size={11} muted style={styles.sec} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <View style={plain ? null : [styles.group, tone === 'raised' && styles.raised]}>
        {rows?.map(({ key, style: rowStyle, ...row }, i) => (
          <ListRow
            key={key}
            divider={i < rows.length - 1}
            {...row}
            switchOffColor={row.switchOffColor ?? (plain ? veil.off : undefined)}
            style={[plain && styles.plainRow, rowStyle]}
          />
        ))}
        {children}
      </View>
      {footer ? (
        <Text variant="small" size={12} muted style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: space.sm + 2 },
  sec: { fontFamily: type.bodyHeavy.fontFamily, letterSpacing: 11 * 0.12, paddingHorizontal: space.xs + 2 },
  group: {
    backgroundColor: color.panel,
    borderWidth: size.border,
    borderColor: veil.line,
    borderRadius: 24,
    paddingHorizontal: space.lg,
    paddingVertical: 2,
  },
  raised: { backgroundColor: color.card },
  plainRow: { minHeight: 52, paddingHorizontal: space.xs, borderBottomColor: veil.line },
  footer: { paddingHorizontal: space.xs + 2 },
});
