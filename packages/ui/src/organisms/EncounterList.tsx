import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Glyph } from '../atoms/Glyph';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { alpha, color, extra, speciesColor } from '../theme';
import type { PersonLook, PetLook } from '../types';

/**
 * L'onglet Rencontres (V6-Rencontres), en briques simples : un intertitre, la carte « il t'attend » (un bonjour
 * reçu, une raison en clair, « Pas cette fois » / « Répondre »), une ligne par personne présentée (une raison en
 * clair, jamais de pourcentage), l'invitation Minimoa+ et la carte « Demain, quelqu'un d'autre ».
 */

/** En-tête : « RENCONTRES » en grand, « La carte » à droite. */
export function EncountersHeader({
  title,
  actionLabel,
  onAction,
  actionA11y,
  right,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionA11y?: string;
  right?: ReactNode;
}) {
  return (
    <View style={[layout.rowBetween, styles.header]}>
      <Title text={title.toUpperCase()} size={44} numberOfLines={1} style={layout.shrink} />
      {right ??
        (actionLabel && onAction ? (
          <Button
            label={actionLabel}
            variant="white"
            size="sm"
            labelSize={15}
            block={false}
            onPress={onAction}
            accessibilityLabel={actionA11y}
            style={styles.headerBtn}
          />
        ) : null)}
    </View>
  );
}

/** Intertitre de section (`.sec` : 15, gras, estompé) ; « Présentés aujourd'hui · 3 ». */
export function EncounterSection({ title, style }: { title: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Text
      variant="bodyHeavy"
      size={15}
      color={color.mute}
      accessibilityRole="header"
      style={[styles.sec, style]}
    >
      {title}
    </Text>
  );
}

const Chevron = () => <Glyph name="chevron" size={16} color={color.mute} />;

export interface EncounterWaitingProps {
  person: PersonLook;
  /** « Malo t'a dit bonjour ». */
  title: string;
  /** « Gaston, son minimoa, est venu voir Nino · ce matin ». */
  sub: string;
  /** La raison, en clair (« Vous deux, vous aimez le calme. »). */
  reason?: string | null;
  declineLabel: string;
  acceptLabel: string;
  onDecline: () => void;
  onAccept: () => void;
  onOpen?: () => void;
  openLabel?: string;
  accepting?: boolean;
  declining?: boolean;
}

/** Quelqu'un t'a dit bonjour : la carte bordée de jaune, en haut de l'onglet. */
export function EncounterWaiting({
  person,
  title,
  sub,
  reason,
  declineLabel,
  acceptLabel,
  onDecline,
  onAccept,
  onOpen,
  openLabel,
  accepting,
  declining,
}: EncounterWaitingProps) {
  return (
    <Card highlight={alpha(color.accent, 0.55)} style={styles.waiting}>
      <Card
        tone="outline"
        padding="none"
        onPress={onOpen}
        accessibilityLabel={openLabel ? `${openLabel}, ${title}` : title}
        style={styles.bare}
      >
        <View style={[layout.row, styles.head]}>
          <Avatar
            size={56}
            pet={person.pet}
            uri={person.avatarUrl}
            face={person.face}
            name={person.displayName}
            bg={speciesColor[person.pet.species]}
          />
          <View style={layout.shrink}>
            <Text variant="bodyHeavy" size={17}>
              {title}
            </Text>
            <Text size={13} color={color.mute}>
              {sub}
            </Text>
          </View>
        </View>
        {reason ? (
          <Text size={16} style={styles.reason}>
            {reason}
          </Text>
        ) : null}
      </Card>
      <View style={[layout.row, styles.actions]}>
        <Button
          label={declineLabel}
          variant="glass"
          size="md"
          block={false}
          onPress={onDecline}
          loading={declining}
          disabled={accepting}
        />
        <Button
          label={acceptLabel}
          variant="accent"
          size="md"
          block={false}
          onPress={onAccept}
          loading={accepting}
          disabled={declining}
          style={layout.fill}
        />
      </View>
    </Card>
  );
}

export interface EncounterRowProps {
  person: PersonLook;
  /** La raison en une phrase (« Comme toi, il part dehors le week-end. »). */
  reason: string;
  /** « Nouveau » (jaune), à côté du prénom. */
  badge?: string;
  /** À droite, à la place du chevron (« Bonjour envoyé »). */
  status?: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Une personne présentée aujourd'hui : avatar 56, prénom, une raison ; touchée, elle s'ouvre. */
export function EncounterRow({
  person,
  reason,
  badge,
  status,
  onPress,
  accessibilityLabel,
}: EncounterRowProps) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? `${person.displayName}, ${reason}`}
      style={[layout.row, styles.row]}
    >
      <Avatar
        size={56}
        pet={person.pet}
        uri={person.avatarUrl}
        face={person.face}
        name={person.displayName}
        bg={speciesColor[person.pet.species]}
      />
      <View style={layout.fill}>
        <View style={[layout.row, styles.name]}>
          <Text variant="bodyHeavy" size={17} numberOfLines={1} style={layout.shrink}>
            {person.displayName}
          </Text>
          {badge ? <Chip label={badge} tone="accent" size="sm" /> : null}
        </View>
        <Text size={15} numberOfLines={2} style={styles.line}>
          {reason}
        </Text>
        {status ? (
          <Text size={13} color={color.mute}>
            {status}
          </Text>
        ) : null}
      </View>
      <Chevron />
    </Card>
  );
}

export interface EncounterMoreProps {
  /** Deux minimoas floutés, en pile. */
  pets: readonly PetLook[];
  title: string;
  text: string;
  onPress: () => void;
}

/** « Envie de plus de monde ? » : jusqu'à 10 présentations par jour avec Minimoa+. */
export function EncounterMore({ pets, title, text, onPress }: EncounterMoreProps) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${title}, ${text}`} style={[layout.row, styles.row]}>
      <View style={layout.row}>
        {pets.slice(0, 2).map((p, i) => (
          <Avatar key={i} size={40} pet={p} blurred cutout={i > 0} style={i > 0 ? styles.stack : undefined} />
        ))}
      </View>
      <View style={layout.fill}>
        <Text variant="bodyHeavy" size={17}>
          {title}
        </Text>
        <Text size={13} color={color.mute}>
          {text}
        </Text>
      </View>
      <Chevron />
    </Card>
  );
}

export interface EncounterNextProps {
  pet: PetLook;
  title: string;
  text: string;
  onPress: () => void;
}

/** « Demain, quelqu'un d'autre » : la carte violette du bas, vers la séance du jour. */
export function EncounterNext({ pet, title, text, onPress }: EncounterNextProps) {
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${title}, ${text}`}
      highlight={alpha(extra.relief.unit, 0.45)}
      style={[layout.row, styles.row, styles.next]}
    >
      <PetImage species={pet.species} mood="joie" size={44} />
      <View style={layout.fill}>
        <Text variant="bodyHeavy" size={17}>
          {title}
        </Text>
        <Text size={13} color={color.mute}>
          {text}
        </Text>
      </View>
      <Chevron />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 4, gap: 12, alignItems: 'center' },
  headerBtn: { height: 44 },
  sec: { marginTop: 6 },
  waiting: { gap: 12 },
  bare: { borderWidth: 0, backgroundColor: 'transparent', gap: 12 },
  head: { gap: 12 },
  reason: { lineHeight: 22 },
  actions: { gap: 8 },
  row: { gap: 12, alignItems: 'center' },
  name: { gap: 8 },
  line: { marginTop: 2, lineHeight: 20 },
  stack: { marginLeft: -12 },
  next: { backgroundColor: alpha(extra.relief.unit, 0.16) },
});
