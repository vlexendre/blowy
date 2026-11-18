import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { IconName } from '../assets/pets';
import { Icon } from '../atoms/Icon';
import { RichText } from '../atoms/RichText';
import { layout } from '../lib/styles';
import { color, space } from '../theme';

export interface PerkLineProps {
  icon: IconName;
  /** Le titre en gras, ponctuation comprise (« Toute la carte : »). */
  title: string;
  /** L'explication, à la suite sur la même phrase (« et change de ville sans bouger »). */
  text: string;
  /** Avantage lié à ce que la personne vient d'essayer : titre en jaune. */
  highlight?: boolean;
  /** Petit écran : icône et corps un cran plus petits. */
  compact?: boolean;
  /** Phrase complète lue par le lecteur d'écran (celle de l'API). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Une ligne d'avantage de Minimoa+ : icône 3D, puis « **Titre :** explication » sur une seule phrase. */
export function PerkLine({ icon, title, text, highlight, compact, accessibilityLabel, style }: PerkLineProps) {
  const size = compact ? 14 : 15;
  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? `${title} ${text}`} style={[layout.row, styles.base, style]}>
      <Icon name={icon} size={compact ? 22 : 26} />
      <RichText
        size={size}
        variant="body"
        style={[layout.grow, { lineHeight: size + 5 }]}
        runs={[
          { text: title, variant: 'bodyHeavy', color: highlight ? color.accent : undefined },
          { text: ` ${text}`, muted: true },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: space.sm + 2, alignItems: 'center' },
});
