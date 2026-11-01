import { StyleSheet, View } from 'react-native';
import { radius, space, tone, type Tone } from '../foundations/theme';
import { Button } from '../atoms/Button';
import { Icon, type IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

export interface BannerProps {
  message: string;
  icon?: IconName;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  /** Annonce vocale immédiate (hors ligne, erreur). */
  live?: boolean;
  testID?: string;
}

/** Bandeau d'information (hors ligne, mode démo, en attente de confirmation). */
export function Banner({ message, icon = 'warning', tone: t = 'ink', actionLabel, onAction, live, testID }: BannerProps) {
  const tk = tone[t];
  return (
    <View testID={testID} accessibilityLiveRegion={live ? 'polite' : 'none'} accessibilityRole={live ? 'alert' : undefined} style={[styles.wrap, { backgroundColor: tk.bg }]}>
      <Icon name={icon} size={18} tint={tk.fg} />
      <Text variant="small" style={[styles.text, { color: tk.fg }]}>
        {message}
      </Text>
      {actionLabel && onAction ? <Button label={actionLabel} size="sm" variant={t === 'ink' ? 'lime' : 'dark'} onPress={onAction} fullWidth={false} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.md },
  text: { flex: 1 },
});
