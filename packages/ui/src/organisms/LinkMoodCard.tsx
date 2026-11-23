import type { LinkWarmth } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { LinkMoodIcon } from '../molecules/LinkMoodIcon';
import { layout } from '../lib/styles';
import { space, veil } from '../theme';

export interface LinkMoodCardProps {
  warmth: LinkWarmth;
  /** L'état, en une phrase (« Vous vous parlez souvent. »). */
  text: string;
  /** Une seule ligne d'aide, sous l'état. */
  help?: string;
}

/**
 * L'état d'un lien (onglet « Le lien », ADA-2027 item 27) : un pictogramme de forme distincte et une phrase douce.
 * Jamais de chiffre, de jauge, de rouge ni de compte à rebours.
 */
export function LinkMoodCard({ warmth, text, help }: LinkMoodCardProps) {
  return (
    <Card style={styles.card}>
      <View style={[layout.row, layout.gapSm, styles.top]} accessible accessibilityRole="text" accessibilityLabel={text}>
        <LinkMoodIcon warmth={warmth} size={22} />
        <Text variant="bodyBold" size={16} style={layout.grow}>
          {text}
        </Text>
      </View>
      {help ? (
        <Text variant="small" color={veil.text}>
          {help}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  top: { alignItems: 'center' },
});
