import type { Mood, Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Card } from '../atoms/Card';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import type { PetPose } from '../assets/pets';
import { space } from '../theme';
import type { TitleContent } from '../types';

export interface PetTipProps {
  text: string;
  species: Species;
  /** Pose du pet ; défaut `salut` (panneau jaune) ou `neutre` (carte). */
  mood?: Mood | PetPose;
  /** `accent` : panneau jaune, texte gras (notifications) ; `card` : carte sombre, texte discret (bloqués) ; `wine` : panneau vin avec titre (supprimer). */
  tone?: 'accent' | 'card' | 'wine';
  /** Titre Anton (ton `wine`). */
  title?: TitleContent;
}

/** Petit conseil du pet : le pet déborde à gauche, une phrase à droite. */
export function PetTip({ text, species, mood, tone = 'accent', title }: PetTipProps) {
  if (tone === 'wine') {
    return (
      <Panel gradient="wine" radius={28} padding="lg" style={[styles.row, styles.wine]}>
        <PetImage species={species} mood={mood ?? 'triste'} size={110} style={styles.winePet} />
        <View style={styles.texts}>
          {title ? <Title text={title} size={30} /> : null}
          <Text variant="body" size={13} style={styles.wineText}>
            {text}
          </Text>
        </View>
      </Panel>
    );
  }
  if (tone === 'card') {
    return (
      <Card padding="none" style={[styles.row, styles.card]}>
        <PetImage species={species} mood={mood ?? 'neutre'} size={64} style={styles.cardPet} />
        <View style={styles.texts}>
          <Text variant="small" muted>
            {text}
          </Text>
        </View>
      </Card>
    );
  }
  return (
    <Panel gradient="accent" radius={26} padding="none" style={[styles.row, styles.panel]}>
      <PetImage species={species} mood={mood ?? 'salut'} size={70} style={styles.panelPet} />
      <View style={styles.texts}>
        <Text variant="bodyBold" size={14}>
          {text}
        </Text>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  texts: { flex: 1, minWidth: 0 },
  panel: { gap: space.sm + 2, paddingVertical: space.md + 2, paddingHorizontal: space.lg },
  panelPet: { marginTop: -8, marginBottom: -14, marginLeft: -6 },
  card: { borderRadius: 24, padding: space.md + 2, gap: space.md, marginTop: space.xs },
  cardPet: { marginTop: -6, marginBottom: -10 },
  wine: { gap: 6 },
  winePet: { marginTop: -6, marginBottom: -18, marginLeft: -10 },
  wineText: { opacity: 0.9, marginTop: space.xs },
});
