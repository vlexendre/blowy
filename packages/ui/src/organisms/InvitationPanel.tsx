import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Chip } from '../atoms/Chip';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { type GradientName, speciesGradient } from '../theme';
import type { TitleContent } from '../types';

export interface InvitationPanelProps {
  /** Puce sombre au-dessus du titre (« invitation »). */
  kicker: string;
  /** « LÉA VEUT / TE PRÉSENTER SUZIE. » */
  title: TitleContent;
  /** Pet de la personne qui invite (à gauche). */
  theirs: Species;
  /** Ton pet (à droite), s'il est connu. */
  mine?: Species;
  gradient?: GradientName;
  /** Encadré sous le panneau : texte avec un passage en gras (« 7 vies »). */
  note?: { before: string; bold?: string; after?: string };
  accessibilityLabel?: string;
}

/** Invitation reçue : les deux pets côte à côte sur le panneau de l'espèce qui invite, puis ce que ça ouvre. */
export function InvitationPanel({ kicker, title, theirs, mine, gradient, note, accessibilityLabel }: InvitationPanelProps) {
  return (
    <View style={styles.wrap}>
      <Panel gradient={gradient ?? speciesGradient[theirs]} radius={32} padding="none" style={styles.panel}>
        <View style={styles.stage} accessible={!!accessibilityLabel} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <View style={[styles.pet, mine ? styles.left : styles.solo]}>
            <PetImage species={theirs} mood="debout" size={190} animation="breathe" />
          </View>
          {mine ? (
            <View style={[styles.pet, styles.right]}>
              <PetImage species={mine} mood="debout" size={190} animation="breathe" delay={600} />
            </View>
          ) : null}
        </View>
        <Chip label={kicker} tone="dark" style={styles.kicker} />
        <Title text={title} size={50} center />
      </Panel>
      {note ? (
        <Card padding="none" style={styles.note}>
          <Text size={14} style={styles.noteText}>
            {note.before}
            {note.bold ? (
              <Text variant="bodyBold" size={14} style={styles.noteText}>
                {note.bold}
              </Text>
            ) : null}
            {note.after}
          </Text>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, gap: 12 },
  panel: { flexGrow: 1, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  stage: { height: 250, alignSelf: 'stretch', marginHorizontal: -20 },
  pet: { position: 'absolute', bottom: 0 },
  left: { left: 14 },
  right: { right: 14 },
  solo: { alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  kicker: { alignSelf: 'center', height: 26, paddingHorizontal: 11, marginBottom: 8 },
  note: { padding: 14, borderRadius: 24 },
  noteText: { lineHeight: 19 },
});
