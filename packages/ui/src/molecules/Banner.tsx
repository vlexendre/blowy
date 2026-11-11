import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Glyph } from '../atoms/Glyph';
import { IconButton } from '../atoms/IconButton';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { alpha, color, radius, space } from '../theme';

export type BannerTone = 'error' | 'info' | 'success';

export interface BannerProps {
  text: string;
  title?: string;
  tone?: BannerTone;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  closeLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const TONE: Record<BannerTone, string> = { error: color.danger, info: color.accent, success: color.ok };

/** Message en ligne (erreur réseau, info, confirmation). */
export function Banner({ text, title, tone = 'info', actionLabel, onAction, onClose, closeLabel = 'Fermer', style }: BannerProps) {
  const c = TONE[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
      style={[styles.base, layout.row, { backgroundColor: alpha(c, 0.12), borderColor: alpha(c, 0.45) }, style]}
    >
      <View style={[styles.dot, { backgroundColor: c }]} />
      <View style={layout.grow}>
        {title ? <Text variant="bodyBold" size={14}>{title}</Text> : null}
        <Text variant="small">{text}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityLabel={actionLabel} style={styles.action}>
          <Text variant="bodyBold" size={13} color={c}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
      {onClose ? <IconButton glyph="close" label={closeLabel} variant="plain" size={32} onPress={onClose} /> : null}
      {!onClose && !onAction && tone === 'success' ? <Glyph name="check" size={16} color={c} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: space.md - 2, paddingVertical: space.md - 2, paddingLeft: space.md + 2, paddingRight: space.sm, borderRadius: radius.md, borderWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
});
