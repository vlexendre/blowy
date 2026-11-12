import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { layout } from '../lib/styles';
import { speciesColor } from '../theme';
import { EncounterFrame, EncounterHead, lighten, PetSays } from './EncounterParts';
import type { IncomingLook } from '../types';

export interface IncomingCardProps {
  /** La demande reçue (objet `Incoming` du contrat accepté tel quel). */
  incoming: IncomingLook;
  /** « Sasha veut te rencontrer ». */
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
  /** Lien discret vers le détail (« voir de plus près »). */
  openLabel?: string;
  onOpen?: () => void;
}

/** Quelqu'un a salué ton pet : accepter (le lien se crée) ou décliner. */
export function IncomingCard({ incoming, title, ownerLabel, compatLabel, acceptLabel, declineLabel, onAccept, onDecline, accepting, declining, openLabel, onOpen }: IncomingCardProps) {
  const { from, compatibility, intro } = incoming;
  const tint = speciesColor[from.pet.species];
  return (
    <EncounterFrame tint={tint}>
      <EncounterHead person={from} name={title} nameStyle="text" owner={ownerLabel} compatibility={compatibility} compatLabel={compatLabel} />
      {intro ? <PetSays text={intro} labelColor={lighten(tint, 0.3)} /> : null}
      {openLabel && onOpen ? <Button label={openLabel} variant="ghost" size="sm" iconRight="chevron" onPress={onOpen} style={styles.open} /> : null}
      <View style={[layout.row, styles.actions]}>
        <Button label={declineLabel} variant="ghost" size="md" labelSize={15} onPress={onDecline} loading={declining} disabled={accepting} block={false} style={[layout.fill, styles.cta]} />
        <Button label={acceptLabel} variant="accent" size="md" labelSize={15} onPress={onAccept} loading={accepting} disabled={declining} block={false} style={[layout.fill, styles.cta]} />
      </View>
    </EncounterFrame>
  );
}

const styles = StyleSheet.create({
  open: { alignSelf: 'flex-start' },
  actions: { gap: 8 },
  cta: { height: 44 },
});
