import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Chip } from '../atoms/Chip';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { AvatarPair } from '../molecules/AvatarPair';
import { Hearts } from '../molecules/Hearts';
import { LevelPill } from '../molecules/LevelPill';
import { layout } from '../lib/styles';
import { color, extra, space, speciesColor, veil } from '../theme';
import type { LinkLook } from '../types';

export interface LinkRowProps {
  /** Le lien (objet `Link` du contrat accepté tel quel). */
  link: LinkLook;
  /** Heure ou jour du dernier message, déjà formaté (« 21:04 », « hier »). */
  timeLabel?: string;
  /** Texte de la pastille de niveau (« niv. 3 »). */
  levelLabel: string;
  /** Préfixe coloré de l'aperçu (« nino : »). */
  previewAuthor?: string;
  previewAuthorColor?: string;
  /** Aperçu quand aucun message n'existe encore. */
  emptyPreview?: string;
  /** Puce affichée pour un lien fantôme (« lien fantôme »). */
  ghostLabel?: string;
  /** Puce à côté du nom (« nouveau »). */
  newLabel?: string;
  /** Lien mis en avant (pastille de niveau jaune). Défaut : s'il y a des non-lus. */
  highlight?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
}

/** Ligne de la liste des chats : les deux pets, le nom, l'aperçu, les vies, le niveau, les non-lus. */
export const LinkRow = memo(function LinkRow({
  link,
  timeLabel,
  levelLabel,
  previewAuthor,
  previewAuthorColor,
  emptyPreview,
  ghostLabel,
  newLabel,
  highlight,
  onPress,
  onLongPress,
  accessibilityLabel,
}: LinkRowProps) {
  const ghost = link.status === 'ghost';
  const { other, myPet } = link;
  const unread = ghost ? 0 : link.unread;
  const preview = link.lastMessage?.preview ?? emptyPreview ?? '';
  const a11y = accessibilityLabel ?? [other.displayName, preview, timeLabel, levelLabel].filter(Boolean).join(', ');
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} scaleTo={0.98} dimTo={0.85} accessibilityLabel={a11y} style={[layout.row, styles.row, ghost && styles.ghost]}>
      {ghost ? (
        <View style={styles.ghostAvatar}>
          <Avatar size={46} pet={other.pet} hidden pose="fantome" bg={extra.ghostDisc} />
        </View>
      ) : (
        <AvatarPair
          size={42}
          first={{ pet: myPet, hidden: true }}
          second={{ pet: other.pet, uri: other.avatarUrl, face: other.face, name: other.displayName }}
        />
      )}
      <View style={[layout.grow, styles.body]}>
        <View style={[layout.row, layout.gapSm]}>
          <Text variant="bodyHeavy" size={17} numberOfLines={1} style={layout.shrink}>
            {other.displayName}
          </Text>
          {newLabel ? <Chip label={newLabel} tone="coral" size="sm" /> : null}
          {timeLabel ? (
            <Text variant="bodyBold" size={12} muted style={styles.time}>
              {timeLabel}
            </Text>
          ) : null}
        </View>
        <View style={[layout.row, layout.gapSm]}>
          <Text variant={unread ? 'bodyBold' : 'body'} size={14} numberOfLines={1} color={unread ? color.white : extra.preview} style={layout.grow}>
            {previewAuthor ? (
              <Text variant="bodyBold" size={14} color={previewAuthorColor ?? speciesColor[myPet.species]}>{`${previewAuthor} `}</Text>
            ) : null}
            {preview}
          </Text>
          <Badge count={unread} />
        </View>
        <View style={[layout.row, layout.gapSm, styles.meta]}>
          {ghost ? (
            ghostLabel ? <Chip label={ghostLabel} size="sm" /> : null
          ) : (
            <>
              <Hearts lives={link.lives} size={14} />
              <LevelPill label={levelLabel} tone={(highlight ?? unread > 0) ? 'accent' : 'glass'} size="sm" />
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { gap: space.md, paddingVertical: space.md - 1, paddingHorizontal: space.xs, minHeight: 72, borderBottomWidth: 1, borderBottomColor: veil.hairline },
  ghostAvatar: { width: 66, alignItems: 'center' },
  time: { marginLeft: 'auto' },
  body: { gap: 3 },
  meta: { marginTop: 2 },
  ghost: { opacity: 0.45 },
});
