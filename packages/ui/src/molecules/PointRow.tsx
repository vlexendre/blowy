import { StyleSheet, View } from 'react-native';

import { Glyph, type GlyphName } from '../atoms/Glyph';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color, space } from '../theme';

export interface PointRowProps {
  glyph: GlyphName;
  /** Couleur du disque. */
  disc: 'coral' | 'violet' | 'accent' | 'lime';
  title: string;
  text: string;
}

/** Une promesse courte (écrans de demande d'autorisation) : un disque de couleur, un titre, une phrase dessous. */
export function PointRow({ glyph, disc, title, text }: PointRowProps) {
  return (
    <View style={[layout.row, styles.row]}>
      <View style={[styles.disc, { backgroundColor: color[disc] }]}>
        <Glyph name={glyph} size={22} color={disc === 'accent' || disc === 'lime' ? color.dark : color.white} />
      </View>
      <View style={[layout.grow, styles.texts]}>
        <Text variant="bodyHeavy" size={17}>
          {title}
        </Text>
        <Text size={15} muted>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 14, alignItems: 'flex-start' },
  disc: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  texts: { gap: 2 },
});
