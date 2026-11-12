import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { Glyph } from '../atoms/Glyph';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { TypingDots } from '../motion/TypingDots';
import { color, motion, petTint, radius, space, veil } from '../theme';
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
  /** Photo encore cachée (`kind: 'photo'` sans `mediaUrl`) : texte de la case verrouillée. */
  lockedPhotoLabel?: string;
  /** Couleur du nom au-dessus de la bulle (défaut : `petTint` du pet, blanc pour une personne). */
  nameColor?: string;
  /** Fond du disque de l'avatar du pet (défaut : `petTint`, Nino en jaune). */
  avatarBg?: string;
  /** Visage de la personne encore caché : disque dégradé rose → violet à la place de l'avatar (V6-Chat). */
  hiddenFace?: boolean;
  /** Fondu à l'apparition (défaut vrai). Faux quand la liste gère elle-même l'entrée de ses bulles. */
  fade?: boolean;
  /** L'auteur écrit : « … » qui sautillent dans la bulle à la place du texte (puis le texte arrive en « pop »). */
  typing?: boolean;
  /**
   * Entrée d'un message qui vient d'arriver : `send` (le mien) monte depuis le champ de saisie ; `receive` (l'autre,
   * un pet) : la tête sort par le bas, la bulle s'ouvre depuis l'avatar. Fondu court si animations réduites.
   */
  enter?: 'send' | 'receive';
  /** Libellé lu des « … » (« gaston écrit… »). */
  typingLabel?: string;
}

const AVATAR = 30;

/** Une bulle du chat : moi (jaune, à droite), l'autre (blanche), un pet (nuit + visage), ou une pastille centrée. */
export const MessageBubble = memo(function MessageBubble({
  message,
  name,
  pet,
  person,
  continued,
  photoLabel,
  onPhotoPress,
  lockedPhotoLabel,
  nameColor: nameTint,
  avatarBg,
  hiddenFace,
  fade = true,
  typing,
  enter,
  typingLabel,
}: MessageBubbleProps) {
  const { author, kind, body, mediaUrl } = message;
  const entrance = useEntrance(enter, !!typing);

  if (author === 'system' || kind === 'event') {
    const isEvent = kind === 'event';
    return (
      <Animated.View entering={fade ? FadeIn : undefined} style={[styles.pill, isEvent ? styles.eventPill : null, entrance.row]} accessible accessibilityRole="text">
        {isEvent ? <Icon name="etoiles" size={16} /> : null}
        <Text variant="bodyBold" size={12} muted={!isEvent} color={isEvent ? color.accent : undefined} center>
          {body ?? ''}
        </Text>
      </Animated.View>
    );
  }

  const mine = author === 'me';
  const isPet = author === 'my_pet' || author === 'other_pet';
  const nameColor = nameTint ?? (isPet && pet ? petTint[pet.species] : color.white);
  const showHead = !mine && !continued;

  const content = typing ? (
    <View style={[styles.bubble, styles.typing, isPet ? styles.petBubble : styles.other]} accessible accessibilityLabel={typingLabel}>
      <TypingDots color={isPet ? color.white : color.dark} size={7} />
    </View>
  ) : kind === 'photo' && mediaUrl ? (
      <Pressable onPress={onPhotoPress} disabled={!onPhotoPress} accessibilityRole="image" accessibilityLabel={photoLabel ?? body ?? undefined} scaleTo={0.98}>
        <Image source={{ uri: mediaUrl }} contentFit="cover" transition={150} style={[styles.photo, mine ? styles.mineRadius : styles.otherRadius]} />
      </Pressable>
    ) : kind === 'photo' && !body ? (
      <View style={[styles.locked, mine ? styles.mineRadius : styles.otherRadius]} accessible accessibilityRole="image" accessibilityLabel={lockedPhotoLabel ?? photoLabel}>
        <Glyph name="lock" size={22} color={color.white} />
        {lockedPhotoLabel ? (
          <Text variant="bodyBold" size={13} color={color.white} center>
            {lockedPhotoLabel}
          </Text>
        ) : null}
      </View>
    ) : (
      <View style={[styles.bubble, mine ? styles.mine : isPet ? styles.petBubble : styles.other]}>
        <Text variant="body" size={15} color={isPet ? color.white : color.dark} style={styles.bodyText}>
          {body ?? ''}
        </Text>
      </View>
    );

  return (
    <Animated.View entering={fade ? FadeIn : undefined} style={[styles.row, mine ? styles.rowMine : null, entrance.row]}>
      {!mine ? (
        <Animated.View style={[styles.avatarSlot, entrance.avatar]}>
          {continued ? null : isPet && pet ? (
            <Avatar size={AVATAR} pet={pet} hidden bg={avatarBg ?? petTint[pet.species]} />
          ) : person && hiddenFace ? (
            <LinearGradient colors={[color.rose, color.violet]} start={{ x: 0.18, y: 0.05 }} end={{ x: 0.82, y: 0.95 }} style={styles.hiddenFace} />
          ) : person ? (
            <Avatar size={AVATAR} uri={person.avatarUrl} face={person.face} pet={person.pet} name={person.displayName} />
          ) : null}
        </Animated.View>
      ) : null}
      <View style={styles.column}>
        {showHead && name ? (
          <Text variant="bodyHeavy" size={11} color={nameColor} style={styles.who}>
            {name}
          </Text>
        ) : null}
        <Animated.View style={[mine ? styles.originMine : styles.originOther, entrance.bubble]}>{content}</Animated.View>
      </View>
    </Animated.View>
  );
});

/**
 * Entrée d'une bulle qui vient d'arriver (voir `enter`). La bulle envoyée monte d'une hauteur de champ en grandissant
 * depuis son coin ; une bulle reçue s'ouvre depuis l'avatar, dont la tête sort par le bas. Quand les « … » laissent
 * place au texte, la bulle refait un petit « pop ».
 */
function useEntrance(enter: MessageBubbleProps['enter'], typing: boolean) {
  const reduced = useReducedMotion();
  const row = useSharedValue(enter ? 0 : 1);
  const head = useSharedValue(enter === 'receive' ? 0 : 1);
  const pop = useSharedValue(1);
  const wasTyping = useRef(typing);
  useEffect(() => {
    if (!enter) return;
    if (reduced) {
      head.value = 1;
      row.value = fadeTo(1, motion.fast);
      return;
    }
    if (enter === 'send') {
      row.value = withSpring(1, { damping: 16, stiffness: 210, mass: 0.8 });
      return;
    }
    head.value = withSpring(1, springs.plush);
    row.value = withDelay(70, withSpring(1, springs.pop));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (wasTyping.current && !typing && !reduced) {
      pop.value = withSequence(withTiming(0.86, { duration: 0 }), withSpring(1, springs.pop));
    }
    wasTyping.current = typing;
  }, [typing, reduced, pop]);
  return {
    row: useAnimatedStyle(() => {
      const moving = enter === 'send' && !reduced;
      const opacity = reduced ? row.value : Math.min(1, row.value * (moving ? 2.5 : 3));
      return { opacity, transform: [{ translateY: moving ? (1 - row.value) * 64 : 0 }] };
    }),
    avatar: useAnimatedStyle(() => {
      const k = enter === 'receive' && !reduced ? 1 - head.value : 0;
      return { opacity: 1 - Math.max(0, k * 3 - 2), transform: [{ translateY: k * 22 }, { scale: 1 - 0.5 * k }] };
    }),
    bubble: useAnimatedStyle(() => {
      const base = enter && !reduced ? (enter === 'send' ? 0.82 + 0.18 * row.value : 0.4 + 0.6 * row.value) : 1;
      return { transform: [{ scale: base * pop.value }] };
    }),
  };
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, maxWidth: '86%', alignSelf: 'flex-start' },
  rowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatarSlot: { width: AVATAR },
  // `linear-gradient(140deg, #FF8FC6, #8D5CF6)` (le flou de 1,5 px de la maquette est omis).
  hiddenFace: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 },
  column: { flexShrink: 1, minWidth: 0 },
  who: { marginBottom: 3, marginLeft: space.xs },
  bubble: { paddingHorizontal: space.md + 1, paddingVertical: space.sm + 1, borderRadius: 20 },
  bodyText: { lineHeight: 20 },
  other: { backgroundColor: color.white, borderBottomLeftRadius: 6 },
  mine: { backgroundColor: color.accent, borderBottomRightRadius: 6 },
  petBubble: { backgroundColor: color.card, borderWidth: 1, borderColor: veil.glass, borderBottomLeftRadius: 6 },
  photo: { width: 200, height: 250, borderRadius: radius.md + 2, backgroundColor: color.card },
  locked: {
    width: 200,
    height: 150,
    borderRadius: radius.md + 2,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: veil.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.md,
  },
  typing: { paddingVertical: space.sm + 3 },
  // Les bulles grandissent depuis leur coin pointu (vers le champ pour moi, vers l'avatar pour l'autre).
  originMine: { transformOrigin: '100% 100%' },
  originOther: { transformOrigin: '0% 100%' },
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
