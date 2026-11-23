import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { useRipple, useRippleAnchor } from '../motion/Ripple';
import { alpha, color, petTint, size, space, veil } from '../theme';
import type { PetLook } from '../types';
import { CompatPill } from './EncounterParts';

export interface MapPinCardProps {
  /** Clé de la personne choisie : la fiche glisse doucement quand elle change. */
  motionKey: string;
  pet: PetLook;
  /** « Le minimoa de Sasha ». */
  owner: string;
  /** « 86 % » (toujours avec `why`). */
  compat?: string;
  compatLabel?: string;
  /** Pourquoi (`MatchWhy`). */
  why?: ReactNode;
  actionLabel: string;
  onAction: () => void;
  actionLoading?: boolean;
  /** Déjà fait (salué, en attente) : bouton calme, désactivé, coche. */
  actionDone?: boolean;
  /** Action impossible pour l'instant (trop de coucous aujourd'hui) : bouton désactivé, et `actionNote` dit pourquoi. */
  actionDisabled?: boolean;
  /** Une ligne sous le bouton : pourquoi il est désactivé, ou pourquoi il ouvre Minimoa+. */
  actionNote?: string;
  /** Bouton secondaire (« Voir de plus près »). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Croix en haut à droite : fermer la fiche. */
  onClose?: () => void;
  closeLabel?: string;
}

/** Fiche flottante du minimoa choisi sur la carte : qui, pourquoi, et une action. Saluer lance une onde. */
export function MapPinCard({ motionKey, pet, owner, compat, compatLabel, why, actionLabel, onAction, actionLoading, actionDone, actionDisabled, actionNote, secondaryLabel, onSecondary, onClose, closeLabel }: MapPinCardProps) {
  const anchor = useRippleAnchor();
  const ripple = useRipple();
  const act = () => {
    onAction();
    ripple(anchor.target(), { color: color.accent });
  };
  return (
    <View style={styles.card}>
      <Appear key={motionKey} from="right" distance={14} duration={200} style={styles.body}>
        <View style={[layout.row, styles.head]}>
          <Avatar size={52} pet={pet} hidden bg={petTint[pet.species]} />
          <View style={layout.grow}>
            <Title text={pet.name} size={28} numberOfLines={1} />
            <Text size={15} muted numberOfLines={1}>
              {owner}
            </Text>
          </View>
          {onClose ? <IconButton glyph="close" label={closeLabel ?? ''} variant="plain" size={32} onPress={onClose} /> : null}
        </View>
        {why}
        {compat && why ? <CompatPill inline value={compat} label={compatLabel} /> : null}
        <View style={[layout.row, styles.actions]}>
          {secondaryLabel && onSecondary ? <Button label={secondaryLabel} variant="ghost" size="md" onPress={onSecondary} style={styles.half} /> : null}
          <View {...anchor.props} style={styles.half}>
            {actionDone ? (
              <Button label={actionLabel} variant="glass" size="md" icon="check" disabled />
            ) : (
              <Button label={actionLabel} size="md" onPress={act} loading={actionLoading} disabled={actionDisabled} />
            )}
          </View>
        </View>
        {actionNote && !actionDone ? (
          <Text size={14} muted>
            {actionNote}
          </Text>
        ) : null}
      </Appear>
    </View>
  );
}

export interface MapPlusStripProps {
  title: string;
  text: string;
  ctaLabel: string;
  onPress: () => void;
}

/** Bandeau Minimoa+ de la carte (violet) : toute la bande se touche. */
export function MapPlusStrip({ title, text, ctaLabel, onPress }: MapPlusStripProps) {
  // Le bouton porte l'action (pas de bouton dans un bouton : interdit en HTML sur le web).
  return (
    <Panel gradient="violet" radius={22} padding="none" style={styles.strip}>
      <View style={layout.grow} accessible accessibilityLabel={`${title}. ${text}`}>
        <Text variant="bodyHeavy" size={15} color={color.white}>
          {title}
        </Text>
        <Text size={13} color={alpha(color.white, 0.85)} numberOfLines={1}>
          {text}
        </Text>
      </View>
      <Button label={ctaLabel} variant="white" size="sm" block={false} style={styles.cta} onPress={onPress} accessibilityLabel={`${ctaLabel}. ${title}`} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: veil.glass,
    backgroundColor: color.panel,
    shadowColor: color.night,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
  },
  body: { gap: space.md },
  head: { gap: space.md },
  actions: { gap: space.sm },
  // Deux moitiés égales, quel que soit le libellé (aucun n'est rogné à 375 pt).
  half: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10, paddingHorizontal: 14 },
  cta: { height: size.touch },
});
