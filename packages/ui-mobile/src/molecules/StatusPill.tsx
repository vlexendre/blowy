import { StyleSheet, View } from 'react-native';
import { color, radius, space } from '../foundations/theme';
import { Icon, type IconName } from '../atoms/Icon';
import { Text } from '../atoms/Text';

export type StatusKind = 'pending' | 'confirmed' | 'corrected' | 'failed' | 'info' | 'demo';

const STYLE: Record<StatusKind, { bg: string; fg: string; icon: IconName }> = {
  pending: { bg: color.sun, fg: color.ink, icon: 'pause' },
  confirmed: { bg: color.lime, fg: color.ink, icon: 'check' },
  corrected: { bg: color.violetLight, fg: color.violetDeep, icon: 'warning' },
  failed: { bg: color.danger, fg: color.white, icon: 'warning' },
  info: { bg: color.creamDeep, fg: color.ink, icon: 'star' },
  demo: { bg: color.violet, fg: color.white, icon: 'flag' },
};

/** État d'une commande ou d'une intégration : icône + texte (jamais couleur seule). */
export function StatusPill({ kind, label }: { kind: StatusKind; label: string }) {
  const s = STYLE[kind];
  return (
    <View accessible accessibilityLabel={label} style={[styles.pill, { backgroundColor: s.bg }]}>
      <Icon name={s.icon} size={12} tint={s.fg} strokeWidth={3} />
      <Text variant="caption" style={{ color: s.fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 3 },
});
