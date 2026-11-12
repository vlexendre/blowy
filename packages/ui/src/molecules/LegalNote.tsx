import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { color } from '../theme';

export interface LegalSegment {
  text: string;
  /** Phrase mise en avant (blanc, gras). */
  strong?: boolean;
  /** Lien (blanc, souligné). */
  onPress?: () => void;
}

export interface LegalNoteProps {
  segments: readonly LegalSegment[];
  /** Taille du texte. Défaut 12,5 (V6-Compte). */
  size?: number;
  style?: StyleProp<TextStyle>;
}

/** Mention légale centrée, lavande, avec une phrase en gras et des liens soulignés. */
export function LegalNote({ segments, size = 12.5, style }: LegalNoteProps) {
  return (
    <Text size={size} muted center style={[{ lineHeight: Math.round(size * 1.45) }, style]}>
      {segments.map((s, i) =>
        s.strong ? (
          <Text key={i} variant="bodyBold" size={size} color={color.white}>
            {s.text}
          </Text>
        ) : s.onPress ? (
          <Text key={i} size={size} color={color.white} onPress={s.onPress} accessibilityRole="link" style={styles.link}>
            {s.text}
          </Text>
        ) : (
          s.text
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: { textDecorationLine: 'underline' },
});
