import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { extra, space } from '../theme';
import type { TitleContent } from '../types';
import { Hearts } from './Hearts';

export interface LivesCardProps {
  /** « 5 VIES / SUR 7 ». */
  title: TitleContent;
  lives: number;
  max?: number;
  ghost?: boolean;
  /** La règle des vies. */
  text: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Rappel des vies d'un lien (carte du bas de V6-Lien) : titre, cœurs, règle. */
export function LivesCard({ title, lives, max, ghost, text, accessibilityLabel, style }: LivesCardProps) {
  return (
    <Card padding="none" style={[styles.card, style]}>
      <View style={layout.rowBetween}>
        <Title text={title} size={22} />
        <Hearts lives={lives} max={max} ghost={ghost} size={14} accessibilityLabel={accessibilityLabel} />
      </View>
      <Text variant="body" size={13} color={extra.preview} style={styles.text}>
        {text}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingVertical: space.md + 2, paddingHorizontal: space.lg, gap: space.sm },
  text: { lineHeight: 18 },
});
