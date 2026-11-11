import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { ListRow, type ListRowProps } from '../molecules/ListRow';
import { layout } from '../lib/styles';
import { space } from '../theme';

export interface SettingsSectionProps {
  title?: string;
  /** Lignes décrites en données (la dernière n'a pas de filet)… */
  rows?: readonly (ListRowProps & { key: string })[];
  /** …ou contenu libre. */
  children?: ReactNode;
  /** Texte d'aide sous la section. */
  footer?: string;
  style?: StyleProp<ViewStyle>;
}

/** Groupe de réglages : titre en capitales, lignes, aide. */
export function SettingsSection({ title, rows, children, footer, style }: SettingsSectionProps) {
  return (
    <View style={[layout.gapSm, style]}>
      {title ? (
        <Text variant="label" muted style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <View>
        {rows?.map(({ key, ...row }, i) => <ListRow key={key} divider={i < rows.length - 1} {...row} />)}
        {children}
      </View>
      {footer ? (
        <Text variant="small" muted style={styles.title}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginLeft: space.xs },
});
