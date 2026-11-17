import { memo } from 'react';
import { Text as RNText, StyleSheet, View } from 'react-native';

import { Badge } from '../atoms/Badge';
import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { AvatarStack } from '../molecules/AvatarStack';
import { LifeSparks } from '../molecules/LifeSparks';
import { StreakPill } from '../molecules/StreakPill';
import { layout } from '../lib/styles';
import { color, extra, space, veil } from '../theme';
import type { PetLook } from '../types';

export interface GroupRowProps {
  name: string;
  /** Minimoas des membres (les autres d'abord) ; sans eux, un disque avec `emoji` (habitude) ou un pictogramme. */
  pets?: readonly PetLook[];
  emoji?: string;
  /** Aperçu du dernier message (ou ligne de repli : « 3 membres »). */
  preview: string;
  timeLabel?: string;
  unread?: number;
  /** Groupe d'habitude : vies (sur `maxLives`) et série. */
  habit?: { lives: number; maxLives: number; streak: number; streakUnit: string } | null;
  /** Puce d'état (« Endormi », « En attente »), à la place des vies. */
  statusLabel?: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Un groupe dans l'onglet Chats : minimoas empilés, nom, aperçu, et pour un groupe d'habitude ses vies et sa série. */
export const GroupRow = memo(function GroupRow({ name, pets = [], emoji, preview, timeLabel, unread = 0, habit, statusLabel, onPress, accessibilityLabel }: GroupRowProps) {
  const a11y = accessibilityLabel ?? [name, preview, timeLabel, statusLabel].filter(Boolean).join(', ');
  return (
    <Pressable onPress={onPress} scaleTo={0.98} dimTo={0.85} accessibilityLabel={a11y} style={[layout.row, styles.row]}>
      <View style={styles.avatars}>
        {pets.length > 0 ? (
          <AvatarStack people={pets.map((pet) => ({ pet, hidden: true }))} size={30} max={3} />
        ) : (
          <View style={styles.disc}>
            {emoji ? (
              <RNText style={styles.emoji} accessible={false}>
                {emoji}
              </RNText>
            ) : (
              <Glyph name="people" size={22} color={color.white} />
            )}
          </View>
        )}
      </View>
      <View style={[layout.grow, styles.body]}>
        <View style={[layout.row, layout.gapSm]}>
          <Text variant="bodyHeavy" size={17} numberOfLines={1} style={layout.shrink}>
            {name}
          </Text>
          {timeLabel ? (
            <Text variant="bodyBold" size={12} muted style={styles.time}>
              {timeLabel}
            </Text>
          ) : null}
        </View>
        <View style={[layout.row, layout.gapSm]}>
          <Text variant={unread ? 'bodyBold' : 'body'} size={14} numberOfLines={1} color={unread ? color.white : extra.preview} style={layout.grow}>
            {preview}
          </Text>
          <Badge count={unread} />
        </View>
        {statusLabel || habit ? (
          <View style={[layout.row, layout.gapSm, styles.meta]}>
            {statusLabel ? <Chip label={statusLabel} size="sm" /> : null}
            {habit && !statusLabel ? <LifeSparks lives={habit.lives} max={habit.maxLives} size={13} /> : null}
            {habit && habit.streak > 0 ? <StreakPill count={habit.streak} label={habit.streakUnit} style={styles.streak} /> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { gap: space.md, paddingVertical: space.md - 1, paddingHorizontal: space.xs, minHeight: 64, borderBottomWidth: 1, borderBottomColor: veil.hairline },
  // Même largeur que la paire d'avatars d'un lien : les noms s'alignent dans la liste.
  avatars: { width: 70, alignItems: 'center' },
  disc: { width: 46, height: 46, borderRadius: 23, backgroundColor: color.card, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24, lineHeight: 30 },
  time: { marginLeft: 'auto' },
  body: { gap: 3 },
  meta: { marginTop: 2, flexWrap: 'wrap', rowGap: space.xs },
  streak: { height: 24, paddingHorizontal: space.sm },
});
