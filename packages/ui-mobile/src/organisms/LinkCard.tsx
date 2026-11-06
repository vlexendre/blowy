import { Pressable, StyleSheet, View } from 'react-native';
import { color, hard, radius, space, tone } from '../foundations/theme';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';

export interface LinkCardProps {
  title: string;
  progressText: string;
  /** 0..1 vers le prochain niveau. */
  progress: number;
  onPress?: () => void;
  accessibilityHint?: string;
  testID?: string;
}

/** Carte sombre « Lien avec L. » (maquette Nid). */
export function LinkCard({
  title,
  progressText,
  progress,
  onPress,
  accessibilityHint,
  testID,
}: LinkCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${progressText}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      testID={testID}
      style={[styles.card, hard(4, tone.ink.shadow)]}
    >
      <View style={styles.row}>
        <Text variant="displayS" tone="white">
          {title}
        </Text>
        <Text variant="caption" style={styles.sub}>
          {progressText}
        </Text>
      </View>
      <ProgressBar value={progress} fill={color.coral} track={color.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.ink,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  sub: { color: color.mutedLight, flexShrink: 1 },
});
