import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { color, radius, shadow, space, veil } from '../theme';

export interface SpeechBubbleProps {
  text: string;
  /** Mot mis en couleur dans la phrase (« salut, moi c'est **nino** »). */
  highlight?: string;
  highlightColor?: string;
  /** `dark` : bulle nuit ; `light` : bulle blanche. */
  tone?: 'dark' | 'light';
  /** Coin pointu : côté de la queue. */
  tail?: 'left' | 'right' | 'none';
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}

/** Bulle de parole posée sur un panneau (le pet parle). */
export function SpeechBubble({ text, highlight, highlightColor = color.accent, tone = 'dark', tail = 'left', rotate = 0, style }: SpeechBubbleProps) {
  const dark = tone === 'dark';
  const parts = highlight ? text.split(highlight) : [text];
  return (
    <View
      style={[
        styles.base,
        shadow.soft,
        { backgroundColor: dark ? color.dark : color.white, transform: rotate ? [{ rotate: `${rotate}deg` }] : undefined },
        tail === 'left' && styles.tailLeft,
        tail === 'right' && styles.tailRight,
        dark && styles.border,
        style,
      ]}
    >
      <InkProvider value={dark ? color.white : color.dark}>
        <Text variant="bodyBold" size={15}>
          {parts.map((p, i) => (
            <Text key={i} variant="bodyBold" size={15}>
              {p}
              {highlight && i < parts.length - 1 ? (
                <Text variant="bodyBold" size={15} color={highlightColor}>
                  {highlight}
                </Text>
              ) : null}
            </Text>
          ))}
        </Text>
      </InkProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start', maxWidth: 260, paddingHorizontal: space.md + 2, paddingVertical: space.sm + 2, borderRadius: radius.md + 2 },
  tailLeft: { borderBottomLeftRadius: space.xs },
  tailRight: { borderBottomRightRadius: space.xs },
  border: { borderWidth: 1, borderColor: veil.glass },
});
