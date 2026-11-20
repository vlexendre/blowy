import type { FaceVisibility, Species } from '@blowy/domain';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { AnimatedMascot } from '../molecules/AnimatedMascot';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Pressable } from '../atoms/Pressable';
import { Sticker } from '../atoms/Sticker';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { Burst } from '../motion/Burst';
import { CountUp } from '../motion/CountUp';
import type { MascotMoment, MascotSource } from '../motion/mascot';
import { PopIn } from '../motion/PopIn';
import { color, radius, space } from '../theme';
import type { PetLook } from '../types';

export interface StreakRiseProps {
  /** La série après la séance. */
  count: number;
  /** D'où le chiffre défile (la série d'avant) ; égal à `count` : rien ne bouge. */
  from: number;
  /** « jours d’affilée » (partie estompée du titre). */
  unit: string;
  accessibilityLabel: string;
  /** À incrémenter : confettis depuis le chiffre (palier de série). */
  celebrate?: number;
  /** Puce sous le chiffre (« 7 jours d'affilée »), fermée d'un tap. */
  badge?: { label: string; onPress: () => void; accessibilityLabel: string } | null;
}

/** La série qui monte en fin de séance (V6-GFin) : la flamme, le chiffre qui défile d'un cran, « jours d'affilée ». */
export function StreakRise({ count, from, unit, accessibilityLabel, celebrate = 0, badge }: StreakRiseProps) {
  return (
    <View>
      <View accessible accessibilityLabel={accessibilityLabel} style={[layout.row, styles.rise]}>
        <PopIn from={0.3} trigger={count}>
          <Icon name="flamme" size={40} />
        </PopIn>
        <CountUp value={count} from={from} variant="h1" size={40} />
        <Text variant="h1" size={40} dim style={layout.shrink}>
          {unit}
        </Text>
      </View>
      <Burst kind="confetti" trigger={celebrate} style={styles.burst} />
      {badge ? (
        <Pressable onPress={badge.onPress} accessibilityRole="button" accessibilityLabel={badge.accessibilityLabel} style={styles.badge}>
          <PopIn from={0.5}>
            <Sticker label={badge.label} tone="accent" rotate={-3} />
          </PopIn>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface RevelationCardProps {
  /** « Ce que Nino a appris ». */
  kicker: string;
  /** La phrase sur toi (« Toi, tu laisses de la place à l'imprévu. »). */
  title: string;
  text?: string | null;
  species: Species;
  /** Minimoa animé réglé par l'API, à la place de l'image ; absent : l'image. */
  mascot?: MascotSource | null;
  /** Moment joué à chaque nouvelle `mascotKey` (il applaudit à l'arrivée). */
  mascotMoment?: MascotMoment | null;
  mascotKey?: number;
  /** Nom du minimoa, lu par le lecteur d'écran sur le minimoa animé. */
  name?: string;
}

/** La révélation de fin de séance : un panneau jaune, une phrase sur toi, le minimoa qui dépasse en bas à droite. */
export function RevelationCard({ kicker, title, text, species, mascot, mascotMoment, mascotKey, name }: RevelationCardProps) {
  return (
    <Appear distance={16}>
      <Panel gradient="accent" radius={28} padding="lg" overflow style={styles.revelation}>
        <View style={styles.revelationText}>
          <Text variant="label" color={color.dark}>
            {kicker}
          </Text>
          <Text variant="bodyHeavy" size={22} color={color.dark} style={styles.revelationTitle}>
            {title}
          </Text>
          {text ? (
            <Text variant="bodyBold" size={14} color={color.dark}>
              {text}
            </Text>
          ) : null}
        </View>
        <View pointerEvents="none" style={styles.revelationPet}>
          {mascot ? (
            <AnimatedMascot
              source={mascot}
              size={128}
              moment={mascotMoment}
              momentKey={mascotKey}
              accessibilityLabel={name}
              fallback={<PetImage species={species} mood="joie" size={112} />}
            />
          ) : (
            <PetImage species={species} mood="joie" size={112} />
          )}
        </View>
      </Panel>
    </Appear>
  );
}

export interface PersonOfDayCardProps {
  /** « Ta personne du jour ». */
  kicker: string;
  person: { name: string; pet: PetLook; face: FaceVisibility; avatarUrl: string | null };
  /** Sous le prénom : ce que dit le minimoa en la présentant, ou d'où elle est (« dans ton quartier »). */
  line?: string | null;
  /** « Vous deux : » et ses points (2 ou 3). */
  togetherTitle: string;
  points: readonly string[];
  /** L'amorce (« Pour lui dire bonjour : « … » »). */
  opener?: string | null;
  helloLabel: string;
  /** Déjà salué : le bouton dit où on en est et ne fait plus rien. */
  helloDone?: boolean;
  helloLoading?: boolean;
  helloDisabled?: boolean;
  /** Pourquoi on ne peut pas saluer (plafond de signes), sous les boutons. */
  helloNote?: string | null;
  onHello: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Sous tout le reste (« Plus tard »). */
  footer?: ReactNode;
}

/**
 * « Ta personne du jour » (V6-GFin, V6-GCarte, V6-Pret) : son minimoa, son prénom, ce que vous avez en commun
 * (« Vous deux : »), une question pour lancer la conversation, « Dire bonjour » et une seconde action. Jamais ses
 * réponses une à une.
 */
export function PersonOfDayCard(p: PersonOfDayCardProps) {
  return (
    <Appear delay={150} distance={16}>
      <View style={styles.card}>
        <Text variant="label" color={color.accent}>
          {p.kicker}
        </Text>
        <View style={[layout.row, styles.who]}>
          <Avatar size={60} pet={p.person.pet} face={p.person.face} uri={p.person.avatarUrl} name={p.person.name} />
          <View style={layout.shrink}>
            <Text variant="bodyHeavy" size={22}>
              {p.person.name}
            </Text>
            {p.line ? (
              <Text size={14} muted>
                {p.line}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.together}>
          <Text variant="bodyHeavy" size={13} muted>
            {p.togetherTitle}
          </Text>
          <View style={layout.wrap}>
            {p.points.map((x) => (
              <View key={x} style={styles.point}>
                <Text variant="bodyBold" size={14}>
                  {x}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {p.opener ? (
          <View style={styles.opener}>
            <Text size={14} muted>
              {p.opener}
            </Text>
          </View>
        ) : null}
        <View style={[layout.row, styles.actions]}>
          <Button
            label={p.helloLabel}
            size="md"
            variant={p.helloDone ? 'glass' : 'accent'}
            icon={p.helloDone ? 'check' : undefined}
            loading={p.helloLoading}
            disabled={p.helloDisabled || p.helloDone}
            onPress={p.onHello}
            style={layout.fill}
          />
          {p.secondaryLabel && p.onSecondary ? <Button label={p.secondaryLabel} size="md" variant="ghost" onPress={p.onSecondary} style={layout.fill} /> : null}
        </View>
        {p.helloNote ? (
          <Text size={14} muted>
            {p.helloNote}
          </Text>
        ) : null}
        {p.footer}
      </View>
    </Appear>
  );
}

export interface CheminEmptyCardProps {
  title: string;
  text: string;
  species: Species;
  actionLabel?: string | null;
  onAction?: () => void;
  /** Seconde action, discrète (« Choisir ma ville »). */
  secondaryLabel?: string | null;
  onSecondary?: () => void;
}

/** Personne à présenter aujourd'hui : l'état honnête (le serveur dit pourquoi) et l'action utile. */
export function CheminEmptyCard({ title, text, species, actionLabel, onAction, secondaryLabel, onSecondary }: CheminEmptyCardProps) {
  return (
    <Appear delay={150} distance={16}>
      <Panel gradient="violet" radius={28} padding="lg" overflow style={styles.empty}>
        <View style={styles.emptyText}>
          <Text variant="bodyHeavy" size={22}>
            {title}
          </Text>
          <Text size={15}>{text}</Text>
        </View>
        <View pointerEvents="none" style={styles.emptyPet}>
          <PetImage species={species} mood="surpris" size={96} />
        </View>
        {actionLabel && onAction ? <Button label={actionLabel} variant="white" size="md" onPress={onAction} block /> : null}
        {secondaryLabel && onSecondary ? <Button label={secondaryLabel} variant="glass" size="md" onPress={onSecondary} block /> : null}
      </Panel>
    </Appear>
  );
}

const styles = StyleSheet.create({
  rise: { justifyContent: 'center', gap: space.sm + 2, flexWrap: 'wrap' },
  burst: { position: 'absolute', left: '50%', top: 12 },
  badge: { alignSelf: 'center', marginTop: space.sm },
  revelation: { minHeight: 150 },
  revelationText: { maxWidth: '70%', gap: space.xs + 2 },
  revelationTitle: { lineHeight: 27 },
  revelationPet: { position: 'absolute', right: -6, bottom: -10 },
  card: { borderRadius: radius.lg, backgroundColor: color.panel, borderWidth: 1, borderColor: color.line, padding: space.lg, gap: space.md },
  who: { gap: space.md },
  together: { gap: space.sm },
  point: { borderRadius: radius.pill, backgroundColor: color.card, paddingHorizontal: space.md, paddingVertical: 6 },
  opener: { borderRadius: radius.md, backgroundColor: color.card, paddingHorizontal: space.md, paddingVertical: space.sm + 2 },
  actions: { gap: space.sm },
  empty: { gap: space.md, minHeight: 200 },
  emptyText: { maxWidth: '72%', gap: space.sm },
  emptyPet: { position: 'absolute', right: -4, top: 14 },
});
