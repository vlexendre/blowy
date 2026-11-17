import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { layout } from '../lib/styles';
import { speciesColor } from '../theme';
import { EncounterFrame, EncounterHead, EncounterOpen, lighten, PetSays } from './EncounterParts';
import type { IncomingLook } from '../types';

export interface IncomingCardProps {
  /** La demande reçue (objet `Incoming` du contrat accepté tel quel). */
  incoming: IncomingLook;
  /** « Sasha te fait signe ». */
  title: string;
  /** « pia, le pet de Sasha ». */
  ownerLabel?: string;
  compatLabel?: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
  accepting?: boolean;
  declining?: boolean;
  /** Toucher le haut de la carte ouvre le détail (libellé lu : « voir de plus près »). */
  openLabel?: string;
  onOpen?: () => void;
  /**
   * Pourquoi (`MatchWhy`) sous l'en-tête. Sans explication, passer `hideCompat` : le pourcentage n'est jamais montré seul.
   */
  why?: ReactNode;
  hideCompat?: boolean;
}

/** Quelqu'un a salué ton pet : accepter (le lien se crée) ou décliner. */
export function IncomingCard({ incoming, title, ownerLabel, compatLabel, acceptLabel, declineLabel, onAccept, onDecline, accepting, declining, openLabel, onOpen, why, hideCompat }: IncomingCardProps) {
  const { from, compatibility, intro } = incoming;
  const tint = speciesColor[from.pet.species];
  return (
    <EncounterFrame tint={tint}>
      <EncounterOpen onPress={onOpen} accessibilityLabel={openLabel ? `${openLabel}, ${title}` : undefined}>
        <EncounterHead person={from} name={title} nameStyle="text" owner={ownerLabel} compatibility={why && !hideCompat ? compatibility : null} compatLabel={compatLabel} />
        {why}
        {intro ? <PetSays text={intro} labelColor={lighten(tint, 0.3)} lines={2} /> : null}
      </EncounterOpen>
      <View style={[layout.row, styles.actions]}>
        <Button label={declineLabel} variant="ghost" size="md" labelSize={15} onPress={onDecline} loading={declining} disabled={accepting} block={false} style={[layout.fill, styles.cta]} />
        <Button label={acceptLabel} variant="accent" size="md" labelSize={15} onPress={onAccept} loading={accepting} disabled={declining} block={false} style={[layout.fill, styles.cta]} />
      </View>
    </EncounterFrame>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8 },
  cta: { height: 44 },
});
