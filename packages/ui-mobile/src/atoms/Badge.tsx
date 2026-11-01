import { StyleSheet, View } from 'react-native';
import { color, radius, tone, type Tone } from '../foundations/theme';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  tone?: Tone | 'pink';
  accessibilityLabel?: string;
}

/** Pastille compacte (compteur non lu, « PLUS », « PENDING »). Toujours un texte, jamais une couleur seule. */
export function Badge({ label, tone: t = 'pink', accessibilityLabel }: BadgeProps) {
  const bg = t === 'pink' ? color.pink : tone[t].bg;
  const fg = t === 'pink' ? color.white : tone[t].fg;
  return (
    <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
});
