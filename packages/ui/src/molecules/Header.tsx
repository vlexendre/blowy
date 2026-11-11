import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { space } from '../theme';

export interface HeaderProps {
  /** Affiche le bouton retour. */
  onBack?: () => void;
  /** Libellé lu du bouton retour. Défaut « Retour ». */
  backLabel?: string;
  /** Icône du bouton de gauche (`back` ou `close` pour une modale). */
  backGlyph?: 'back' | 'close';
  title?: string;
  subtitle?: string;
  /** Contenu libre au centre-gauche (avatars + nom d'un lien), à la place du titre. */
  center?: ReactNode;
  /** Actions à droite. */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Barre du haut : retour rond, titre, emplacement à droite. */
export function Header({ onBack, backLabel = 'Retour', backGlyph = 'back', title, subtitle, center, right, style }: HeaderProps) {
  return (
    <View style={[layout.row, styles.base, style]}>
      {onBack ? <IconButton glyph={backGlyph} label={backLabel} onPress={onBack} size={40} /> : null}
      <View style={[layout.grow, styles.center]}>
        {center ?? (
          <>
            {title ? (
              <Text variant="bodyBold" size={17} numberOfLines={1} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text variant="small" muted numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </>
        )}
      </View>
      {right ? <View style={[layout.row, layout.gapSm]}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, gap: space.md - 2, paddingVertical: space.xs },
  center: { justifyContent: 'center' },
});
