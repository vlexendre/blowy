import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { space } from '../theme';

export interface TogetherCardProps {
  /** Emoji de l'habitude. */
  emoji?: string;
  /** La phrase de l'API (« 3 personnes près de toi tiennent aussi Marcher. La tenir ensemble ? »). */
  text: string;
  /** `idle` : proposer · `waiting` : déjà dit oui · `started` : le groupe a démarré. */
  state: 'idle' | 'waiting' | 'started';
  /** Ligne d'état sous la phrase (« En attente des autres »), pour `waiting` et `started`. */
  stateLine?: string;
  /** Libellé du bouton (« La tenir ensemble », « Retirer », « Ouvrir le groupe »). */
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Suggestion « la tenir ensemble » (spéc. §26) : un nombre de personnes, jamais d'identité ; une action. */
export function TogetherCard({ emoji, text, state, stateLine, actionLabel, onAction, loading, style }: TogetherCardProps) {
  return (
    <Card padding="none" style={[styles.card, style]}>
      <View style={[layout.rowTop, styles.head]}>
        {emoji ? (
          <Text size={24} importantForAccessibility="no" accessibilityElementsHidden style={styles.emoji}>
            {emoji}
          </Text>
        ) : null}
        <View style={layout.grow}>
          <Text variant="bodyBold" size={15}>
            {text}
          </Text>
          {stateLine && state !== 'idle' ? (
            <Text size={13} muted>
              {stateLine}
            </Text>
          ) : null}
        </View>
      </View>
      <Button
        label={actionLabel}
        size="sm"
        variant={state === 'idle' ? 'white' : state === 'started' ? 'accent' : 'glass'}
        onPress={onAction}
        loading={loading}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: space.sm + 2 },
  head: { gap: space.md },
  emoji: { lineHeight: 30 },
});
