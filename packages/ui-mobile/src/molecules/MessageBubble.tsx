import { StyleSheet, View } from 'react-native';
import { color, radius, space } from '../foundations/theme';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Text } from '../atoms/Text';

export type BubbleState = 'published' | 'pending' | 'failed' | 'warned-hidden' | 'warned-revealed' | 'system' | 'held';

export interface MessageBubbleProps {
  mine: boolean;
  body: string | null;
  state: BubbleState;
  /** Libellé d'état (« Envoi… », « En vérification », « Message masqué ») — toujours textuel. */
  statusLabel?: string | null;
  /** Placeholder averti : bouton « Afficher quand même ». */
  revealLabel?: string;
  onReveal?: () => void;
  retryLabel?: string;
  onRetry?: () => void;
  time?: string;
}

export function MessageBubble({ mine, body, state, statusLabel, revealLabel, onReveal, retryLabel, onRetry, time }: MessageBubbleProps) {
  if (state === 'system') {
    return (
      <View style={styles.system} accessible accessibilityLabel={body ?? ''}>
        <Text variant="small" tone="muted" align="center">
          {body}
        </Text>
      </View>
    );
  }
  const hidden = state === 'warned-hidden';
  const bg = hidden ? color.creamDeep : mine ? color.ink : color.white;
  const fg = hidden ? 'inkSoft' : mine ? 'white' : 'ink';
  return (
    <View style={[styles.wrap, mine ? styles.mine : styles.theirs]}>
      <View
        accessible
        accessibilityLabel={[hidden ? statusLabel : body, !hidden ? statusLabel : null, time].filter(Boolean).join(', ')}
        style={[styles.bubble, { backgroundColor: bg }, state === 'pending' || state === 'held' ? styles.pending : null, mine ? styles.tailMine : styles.tailTheirs]}
      >
        {hidden ? (
          <View style={styles.hiddenRow}>
            <Icon name="warning" size={18} tint={color.inkSoft} />
            <Text variant="body" tone="inkSoft" style={styles.flex}>
              {statusLabel}
            </Text>
          </View>
        ) : (
          <Text variant="body" tone={fg}>
            {body}
          </Text>
        )}
      </View>
      {hidden && onReveal && revealLabel ? <Button label={revealLabel} variant="ghost" onPress={onReveal} fullWidth={false} /> : null}
      {!hidden && statusLabel ? (
        <View style={styles.meta}>
          {state === 'failed' ? <Icon name="warning" size={14} tint={color.danger} /> : null}
          <Text variant="caption" tone={state === 'failed' ? 'danger' : 'muted'}>
            {statusLabel}
          </Text>
          {state === 'failed' && onRetry && retryLabel ? <Button label={retryLabel} variant="ghost" onPress={onRetry} fullWidth={false} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '82%', gap: 2, marginVertical: space.xxs },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: space.md },
  tailMine: { borderBottomRightRadius: 6 },
  tailTheirs: { borderBottomLeftRadius: 6 },
  pending: { opacity: 0.65 },
  hiddenRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flexShrink: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  system: { alignSelf: 'center', paddingHorizontal: space.lg, paddingVertical: space.xs, maxWidth: '90%' },
});
