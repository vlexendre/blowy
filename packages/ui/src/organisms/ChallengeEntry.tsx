import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { CareIcon } from '../atoms/CareIcon';
import { Glyph } from '../atoms/Glyph';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { PopIn, Pulse } from '../motion/PopIn';
import { alpha, color, radius, space, veil } from '../theme';

export type ChallengeKindLook = 'question' | 'photo' | 'write' | 'go_out';

/** Picto d'un type de défi, sur fond jaune. */
export function ChallengeKindIcon({ kind, size = 24 }: { kind: ChallengeKindLook; size?: number }) {
  switch (kind) {
    case 'photo':
      return <Glyph name="camera" size={size} color={color.dark} />;
    case 'write':
      return <Glyph name="chat" size={size} color={color.dark} />;
    case 'go_out':
      return <CareIcon name="door" size={size + 4} color={color.dark} />;
    default:
      return <Icon name="etoiles" size={size + 6} />;
  }
}

export interface ChallengeEntryProps {
  /** « Défi du jour · un mot à un lien ». */
  kicker: string;
  /** Ce que le minimoa propose (servi par l'API). */
  title: string;
  /** Où on en est (« avant minuit », « fait »). */
  caption?: string;
  /** Type de défi : choisit le picto du disque jaune. */
  kind?: ChallengeKindLook;
  /** Visuel libre à la place du picto du type. */
  icon?: ReactNode;
  done?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Puce de la série à droite (flamme + « 13 » ou « +1 ») : ouvre l'écran de la série. */
  streak?: { text: string; onPress: () => void; accessibilityLabel: string; lit?: boolean };
}

/**
 * Le défi du jour en tête de l'accueil (V6-GAccueil) : filet jaune tant qu'il reste à faire, disque jaune avec le
 * picto du type, la série à droite. Fait : le disque passe en coche et le filet s'éteint.
 */
export function ChallengeEntry({ kicker, title, caption, kind, icon, done = false, onPress, accessibilityLabel, streak }: ChallengeEntryProps) {
  return (
    <Card
      padding="none"
      highlight={done ? undefined : color.accent}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? [kicker, title, caption].filter(Boolean).join(', ')}
      style={[styles.card, !done && styles.todo]}
    >
      <View style={[styles.disc, done && styles.discDone]}>
        {done ? (
          <PopIn trigger="done">
            <Glyph name="check" size={20} color={color.dark} />
          </PopIn>
        ) : (
          (icon ?? <ChallengeKindIcon kind={kind ?? 'question'} />)
        )}
      </View>
      <View style={layout.grow}>
        <Text variant="label" size={12} color={done ? color.mute : color.accentSoft} numberOfLines={1}>
          {kicker}
        </Text>
        <Text variant="bodyHeavy" size={16} numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        {caption ? (
          <Text size={13} muted numberOfLines={2}>
            {caption}
          </Text>
        ) : null}
      </View>
      {streak ? (
        <Pressable onPress={streak.onPress} accessibilityRole="button" accessibilityLabel={streak.accessibilityLabel} hitSlop={6} style={styles.streak}>
          <Pulse active={!done} beats={2} scale={1.1} delay={900}>
            <View style={[layout.row, styles.streakInner]}>
              <Icon name="flamme" size={20} style={streak.lit === false ? styles.unlit : undefined} />
              <Text variant="bodyHeavy" size={15}>
                {streak.text}
              </Text>
            </View>
          </Pulse>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  // V6-GAccueil `.defi` : rayon 24, padding 12 14, disque jaune de 46.
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderRadius: 24, paddingVertical: space.md, paddingHorizontal: space.md + 2, minHeight: 72 },
  todo: { backgroundColor: alpha(color.accent, 0.08) },
  disc: { width: 46, height: 46, borderRadius: 23, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  discDone: { backgroundColor: color.ok },
  title: { marginTop: 1 },
  streak: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  streakInner: { gap: 2, paddingHorizontal: space.sm, paddingVertical: space.xs + 2, borderRadius: radius.pill, backgroundColor: veil.darkGlass },
  unlit: { opacity: 0.45 },
});
