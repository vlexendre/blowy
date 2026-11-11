import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { color, radius, shadow, size as sizes, space } from '../theme';
import { Text } from './Text';

export type StickerTone = 'accent' | 'white' | 'coral' | 'dark' | 'rose' | 'violet';

export interface StickerProps {
  label: string;
  tone?: StickerTone;
  /** Inclinaison en degrés. Défaut -4. */
  rotate?: number;
  /** `display` : Anton capitales (« MDR NON ») ; `body` : gras minuscule (« nino · toi »). */
  font?: 'display' | 'body';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<StickerTone, { bg: string; ink: string }> = {
  accent: { bg: color.accent, ink: color.dark },
  white: { bg: color.white, ink: color.dark },
  coral: { bg: color.coral, ink: color.white },
  dark: { bg: color.dark, ink: color.white },
  rose: { bg: color.rose, ink: color.dark },
  violet: { bg: color.violet, ink: color.white },
};

/** Étiquette autocollante inclinée, liseré blanc et ombre portée. */
export function Sticker({ label, tone = 'accent', rotate = -4, font = 'body', size = 'md', style }: StickerProps) {
  const t = TONES[tone];
  const display = font === 'display';
  return (
    <View
      style={[
        styles.base,
        shadow.soft,
        {
          backgroundColor: t.bg,
          borderColor: tone === 'white' ? color.dark : color.white,
          transform: [{ rotate: `${rotate}deg` }],
          paddingVertical: size === 'sm' ? space.xs : space.sm - 2,
          paddingHorizontal: size === 'sm' ? space.sm + 2 : space.md,
        },
        style,
      ]}
    >
      <Text
        variant={display ? 'h3' : 'bodyBold'}
        size={display ? (size === 'sm' ? 16 : 20) : size === 'sm' ? 12 : 14}
        color={t.ink}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: sizes.ring + 1 },
});
