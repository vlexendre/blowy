import type { FaceVisibility } from '@blowy/domain';
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '../atoms/Avatar';
import { Glyph } from '../atoms/Glyph';
import { Icon } from '../atoms/Icon';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Appear } from '../motion/Appear';
import { alpha, color, extra, radius, space } from '../theme';
import type { PetLook } from '../types';

/**
 * Les morceaux de l'accueil sous le panneau du minimoa (V6-GAccueil, prop `maintenant`) : la ligne de la série et sa
 * bulle, la carte « Séance du jour faite », « À demain », la carte d'un bonjour reçu. Aucun jaune ici : le seul jaune
 * de l'écran est l'étape du jour.
 */

export interface StreakLineProps {
  /** « 12 jours d’affilée » → l'écran de la série ; null : pas encore de série lue. */
  streak: { label: string; accessibilityLabel: string; onPress: () => void } | null;
  /** Ce que dit le minimoa (« Bien joué. À demain ! », « Zzz… », un soin) ; annoncé à VoiceOver quand il change. */
  bubble?: string | null;
}

/** `.serie-ligne` : la puce de série de 44 pt à gauche, la bulle du minimoa à droite (pointe vers lui). */
export function StreakLine({ streak, bubble }: StreakLineProps) {
  useEffect(() => {
    if (bubble) AccessibilityInfo.announceForAccessibility(bubble);
  }, [bubble]);
  if (!streak && !bubble) return null;
  return (
    <View style={styles.line}>
      {streak ? (
        <Pressable onPress={streak.onPress} accessibilityRole="button" accessibilityLabel={streak.accessibilityLabel} style={styles.streak} scaleTo={0.96}>
          <Icon name="flamme" size={20} />
          <Text variant="bodyHeavy" size={15} numberOfLines={1}>
            {streak.label}
          </Text>
        </Pressable>
      ) : (
        <View />
      )}
      {bubble ? (
        <Appear key={bubble} style={styles.bubbleWrap}>
          <View style={styles.bubble} accessibilityLiveRegion="polite">
            <Text variant="bodyBold" size={15}>
              {bubble}
            </Text>
          </View>
        </Appear>
      ) : null}
    </View>
  );
}

export interface HomeLink {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export interface SessionDoneCardProps {
  /** « Séance du jour faite » (avec une coche : l'état ne tient pas à la couleur). */
  status: string;
  /** « Ta personne du jour » ; absent quand personne n'a été présenté (le statut devient l'en-tête). */
  title?: string;
  /** « Demain, une nouvelle séance ». */
  text: string;
  /** « Revoir ta personne du jour » (s’il y en a une), et pour un membre « Continuer avec l’étape suivante ». */
  links: readonly HomeLink[];
}

/** `.carte` (états `faite` et `membre`) : carte sombre, un titre et une ligne grise, des liens de 44 pt. */
export function SessionDoneCard({ status, title, text, links }: SessionDoneCardProps) {
  return (
    <Appear once={`home:done:${title ? 1 : 0}:${links.length}`} style={styles.card}>
      <View style={styles.status}>
        <View style={styles.check}>
          <Glyph name="check" size={12} color={color.dark} />
        </View>
        <Text variant="bodyHeavy" size={13} muted accessibilityRole={title ? undefined : 'header'}>
          {status}
        </Text>
      </View>
      {title ? (
        <Text variant="bodyHeavy" size={22} style={styles.cardTitle} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <Text size={15} muted>
        {text}
      </Text>
      <View style={styles.links}>
        {links.map((l) => (
          <Pressable key={l.label} onPress={l.onPress} accessibilityRole="link" accessibilityLabel={l.accessibilityLabel ?? l.label} style={styles.link} scaleTo={0.99} dimTo={0.72}>
            <Text variant="bodyBold" size={17} style={styles.linkText}>
              {l.label}
            </Text>
            <Glyph name="chevron" size={16} color={color.white} />
          </Pressable>
        ))}
      </View>
    </Appear>
  );
}

/** `.carte.demain` (état `repos`) : une lune et « À demain ». */
export function RestCard({ title }: { title: string }) {
  return (
    <Appear once="home:rest" style={[styles.card, styles.rest]}>
      <Svg width={28} height={28} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z" fill={extra.relief.moon} />
      </Svg>
      <Title text={title} size={34} numberOfLines={1} />
    </Appear>
  );
}

export interface HelloRowProps {
  /** « Léa t’a dit bonjour ». */
  text: string;
  person: { name: string; pet: PetLook; face: FaceVisibility; avatarUrl: string | null };
  onPress: () => void;
  accessibilityLabel?: string;
}

/**
 * `.personne` (état `bonjour`) : un bonjour reçu, au-dessus du chemin, vers Quartier. Visage avant le lien : la vignette
 * floue du serveur et son minimoa en médaillon (`Avatar face="blurred"`), jamais une photo nette.
 */
export function HelloRow({ text, person, onPress, accessibilityLabel }: HelloRowProps) {
  return (
    <Appear once={`home:hello:${person.name}`}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? text} style={[styles.card, styles.hello]} scaleTo={0.98}>
        <Avatar size={56} pet={person.pet} face={person.face} uri={person.avatarUrl} name={person.name} accessibilityLabel="" />
        <Text variant="bodyHeavy" size={17} style={styles.grow}>
          {text}
        </Text>
        <Glyph name="chevron" size={16} color={color.mute} />
      </Pressable>
    </Appear>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  // `.serie` : 44 pt, fond panneau, liseré orange.
  streak: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: alpha(color.orange, 0.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  bubbleWrap: { flexShrink: 1, minWidth: 0 },
  // `.bulle` : 44 pt au moins, coin pointu en haut à droite (vers le minimoa).
  bubble: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: color.dark,
    borderWidth: 1,
    borderColor: alpha(color.white, 0.16),
  },
  // `.carte` : rayon 24, marge 14 16.
  card: {
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: alpha(color.white, 0.1),
    borderRadius: 24,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: extra.relief.done, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { marginTop: space.xs },
  links: { marginTop: 6 },
  link: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: alpha(color.white, 0.08),
  },
  linkText: { flexShrink: 1, textDecorationLine: 'underline', textDecorationColor: alpha(color.white, 0.45) },
  rest: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hello: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 80, paddingVertical: 12 },
  grow: { flex: 1 },
});
