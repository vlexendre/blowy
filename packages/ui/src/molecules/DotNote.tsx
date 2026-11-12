import { StyleSheet, View } from 'react-native';

import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { color } from '../theme';

export interface DotNoteProps {
  text: string;
  /** Couleur du point. Défaut jaune d'accent. */
  dot?: string;
}

/** Ligne d'info discrète précédée d'un point de couleur (« 1 rencontre par semaine… »). */
export function DotNote({ text, dot = color.accent }: DotNoteProps) {
  return (
    <View style={[layout.row, styles.row]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text size={13} muted style={layout.shrink}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
