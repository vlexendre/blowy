import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { space, veil } from '../theme';

export interface HeaderProps {
  /** Affiche le bouton retour. */
  onBack?: () => void;
  /** Libellé lu du bouton retour. Défaut « Retour ». */
  backLabel?: string;
  /** Icône du bouton de gauche (`back` ou `close` pour une modale). */
  backGlyph?: 'back' | 'close';
  title?: string;
  /** Corps du titre ; défaut 17 (15 pour « ton lien avec Léa »). */
  titleSize?: number;
  subtitle?: string;
  /** Contenu libre au centre-gauche (avatars + nom d'un lien), à la place du titre. */
  center?: ReactNode;
  /** Actions à droite. */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Barre du haut : retour rond, titre, emplacement à droite. */
export function Header({ onBack, backLabel = 'Retour', backGlyph = 'back', title, titleSize = 17, subtitle, center, right, style }: HeaderProps) {
  return (
    <View style={[layout.row, styles.base, style]}>
      {onBack ? <IconButton glyph={backGlyph} label={backLabel} onPress={onBack} size={40} style={styles.back} /> : null}
      <View style={[layout.grow, styles.center]}>
        {center ?? (
          <>
            {title ? (
              <Text variant="bodyBold" size={titleSize} numberOfLines={1} accessibilityRole="header">
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
  // `.back` des maquettes : fond blanc à 12 %.
  back: { backgroundColor: veil.track },
});
