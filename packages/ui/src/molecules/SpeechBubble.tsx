import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { useReveal } from '../motion/reveal';
import { TypingDots } from '../motion/TypingDots';
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
  /** Petite bulle à plat (13 pt, sans ombre ni bordure), comme sur le panneau de Mon pet. */
  compact?: boolean;
  /** Bulle de chat à plat (`.bub` : 15 pt normal, mot en couleur gras, sans ombre ni bordure), comme V6-Craft. */
  chat?: boolean;
  /**
   * La bulle « écrit » sa phrase : trois points, puis les mots un à un (rejoué quand `text` change).
   * Les mots pas encore écrits gardent leur place (encre transparente) : la bulle ne change pas de taille.
   */
  typing?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Bulle de parole posée sur un panneau (le pet parle). */
export function SpeechBubble({ text, highlight, highlightColor = color.accent, tone = 'dark', tail = 'left', rotate = 0, compact, chat, typing = false, style }: SpeechBubbleProps) {
  const dark = tone === 'dark';
  const flat = compact || chat;
  const variant = flat ? 'body' : 'bodyBold';
  const fontSize = compact ? 13 : 15;
  const parts = highlight ? text.split(highlight) : [text];
  const tokens = typing ? text.split(/(\s+)/).filter((t) => t.length > 0) : [];
  const words = tokens.filter((t) => !/^\s+$/.test(t)).length;
  const shown = useReveal(words, { enabled: typing, step: 55, delay: 300, key: text });
  const ink = dark ? color.white : color.dark;
  let w = 0;
  return (
    <View
      style={[
        styles.base,
        compact ? styles.compact : chat ? styles.chat : shadow.soft,
        { backgroundColor: dark ? color.dark : color.white, transform: rotate ? [{ rotate: `${rotate}deg` }] : undefined },
        tail === 'left' && (flat ? styles.compactTailLeft : styles.tailLeft),
        tail === 'right' && (flat ? styles.compactTailRight : styles.tailRight),
        dark && !flat && styles.border,
        style,
      ]}
    >
      <InkProvider value={ink}>
        {typing ? (
          <Text variant={variant} size={fontSize} accessibilityLabel={text}>
            {tokens.map((t, i) => {
              if (/^\s+$/.test(t)) return t;
              const visible = w++ < shown;
              const hot = !!highlight && t.includes(highlight);
              return (
                <Text key={i} variant={hot && chat ? 'bodyBold' : variant} size={fontSize} color={visible ? (hot ? highlightColor : ink) : 'transparent'}>
                  {t}
                </Text>
              );
            })}
          </Text>
        ) : (
        <Text variant={variant} size={fontSize}>
          {parts.map((p, i) => (
            <Text key={i} variant={variant} size={fontSize}>
              {p}
              {highlight && i < parts.length - 1 ? (
                <Text variant={chat ? 'bodyBold' : variant} size={fontSize} color={highlightColor}>
                  {highlight}
                </Text>
              ) : null}
            </Text>
          ))}
        </Text>
        )}
        {typing && shown === 0 && words > 0 ? <TypingDots color={ink} size={6} style={styles.dots} /> : null}
      </InkProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { position: 'absolute', left: space.md + 2, top: 0, bottom: 0 },
  base: { alignSelf: 'flex-start', maxWidth: 260, paddingHorizontal: space.md + 2, paddingVertical: space.sm + 2, borderRadius: radius.md + 2 },
  tailLeft: { borderBottomLeftRadius: space.xs },
  tailRight: { borderBottomRightRadius: space.xs },
  border: { borderWidth: 1, borderColor: veil.glass },
  compact: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 18 },
  chat: { maxWidth: 300, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20 },
  compactTailLeft: { borderBottomLeftRadius: 6 },
  compactTailRight: { borderBottomRightRadius: 6 },
});
