import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { color, radius, space, speciesColor, veil } from '../theme';
import type { MessageLook, PersonLook, PetLook } from '../types';

export interface MessageBubbleProps {
  message: Pick<MessageLook, 'author' | 'kind' | 'body' | 'mediaUrl'>;
  /** Nom au-dessus de la bulle (prénom de l'autre, nom du pet). */
  name?: string;
  /** Pet auteur (`my_pet` / `other_pet`) : visage et couleur du nom. */
  pet?: PetLook;
  /** L'autre personne (`other`) : avatar selon la visibilité du visage. */
  person?: Pick<PersonLook, 'avatarUrl' | 'face' | 'pet' | 'displayName'>;
  /** Suite d'un message du même auteur : ni nom ni avatar. */
  continued?: boolean;
  /** Libellé lu de la photo. */
  photoLabel?: string;
  onPhotoPress?: () => void;
}

const AVATAR = 30;

/** Une bulle du chat : moi (jaune, à droite), l'autre (blanche), un pet (nuit + visage), ou une pastille centrée. */
export const MessageBubble = memo(function MessageBubble({ message, name, pet, person, continued, photoLabel, onPhotoPress }: MessageBubbleProps) {
  const { author, kind, body, mediaUrl } = message;

  if (author === 'system' || kind === 'event') {
    const isEvent = kind === 'event';
    return (
      <Animated.View entering={FadeIn} style={[styles.pill, isEvent ? styles.eventPill : null]} accessible accessibilityRole="text">
        {isEvent ? <Icon name="etoiles" size={16} /> : null}
        <Text variant="bodyBold" size={12} muted={!isEvent} color={isEvent ? color.accent : undefined} center>
          {body ?? ''}
        </Text>
      </Animated.View>
    );
  }

  const mine = author === 'me';
  const isPet = author === 'my_pet' || author === 'other_pet';
  const nameColor = isPet && pet ? speciesColor[pet.species] : color.white;
  const showHead = !mine && !continued;

  const content =
    kind === 'photo' && mediaUrl ? (
      <Pressable onPress={onPhotoPress} disabled={!onPhotoPress} accessibilityRole="image" accessibilityLabel={photoLabel ?? body ?? undefined} scaleTo={0.98}>
        <Image source={{ uri: mediaUrl }} contentFit="cover" transition={150} style={[styles.photo, mine ? styles.mineRadius : styles.otherRadius]} />
      </Pressable>
    ) : (
      <View style={[styles.bubble, mine ? styles.mine : isPet ? styles.petBubble : styles.other]}>
        <Text variant="body" size={15} color={isPet ? color.white : color.dark} style={styles.bodyText}>
          {body ?? ''}
        </Text>
      </View>
    );

  return (
    <Animated.View entering={FadeIn} style={[styles.row, mine ? styles.rowMine : null]}>
      {!mine ? (
        <View style={styles.avatarSlot}>
          {continued ? null : isPet && pet ? (
            <Avatar size={AVATAR} pet={pet} hidden />
          ) : person ? (
            <Avatar size={AVATAR} uri={person.avatarUrl} face={person.face} pet={person.pet} name={person.displayName} />
          ) : null}
        </View>
      ) : null}
      <View style={styles.column}>
        {showHead && name ? (
          <Text variant="bodyBold" size={11} color={nameColor} style={styles.who}>
            {name}
          </Text>
        ) : null}
        {content}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, maxWidth: '86%', alignSelf: 'flex-start' },
  rowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatarSlot: { width: AVATAR },
  column: { flexShrink: 1, minWidth: 0 },
  who: { marginBottom: 3, marginLeft: space.xs },
  bubble: { paddingHorizontal: space.md + 1, paddingVertical: space.sm + 1, borderRadius: 20 },
  bodyText: { lineHeight: 20 },
  other: { backgroundColor: color.white, borderBottomLeftRadius: 6 },
  mine: { backgroundColor: color.accent, borderBottomRightRadius: 6 },
  petBubble: { backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass, borderBottomLeftRadius: 6 },
  photo: { width: 200, height: 250, borderRadius: radius.md + 2, backgroundColor: color.card },
  mineRadius: { borderBottomRightRadius: 6 },
  otherRadius: { borderBottomLeftRadius: 6 },
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    maxWidth: '90%',
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: veil.hairline,
  },
  eventPill: { backgroundColor: veil.glass, borderWidth: 1, borderColor: veil.glassStrong },
});
