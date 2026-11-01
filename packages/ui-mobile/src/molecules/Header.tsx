import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '../foundations/theme';
import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';

export interface HeaderProps {
  title?: string;
  eyebrow?: string;
  onBack?: () => void;
  backLabel?: string;
  onClose?: () => void;
  closeLabel?: string;
  trailing?: ReactNode;
}

/** En-tête d'écran de détail : retour 44 pt, sur-titre, titre display (maquette .back + .lbl). */
export function Header({ title, eyebrow, onBack, backLabel, onClose, closeLabel, trailing }: HeaderProps) {
  return (
    <View style={styles.row}>
      {onBack && backLabel ? <IconButton icon="back" accessibilityLabel={backLabel} onPress={onBack} testID="header-back" /> : null}
      <View style={styles.titles}>
        {eyebrow ? (
          <Text variant="label" tone="muted">
            {eyebrow}
          </Text>
        ) : null}
        {title ? (
          <Text variant="displayM" numberOfLines={2}>
            {title}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onClose && closeLabel ? <IconButton icon="close" accessibilityLabel={closeLabel} onPress={onClose} testID="header-close" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  titles: { flex: 1, gap: 2 },
});
