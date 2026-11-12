import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { space } from '../theme';
import type { TitleContent } from '../types';

export interface AgeGateProps {
  species: Species;
  title: TitleContent;
  text: string;
  /** Ligne sous le panneau (« ton pet n'a pas été créé… »). */
  note: string;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
}

/** Moins de 18 ans (V6-TropJeune) : panneau violet, pet endormi, puis « fermer ». */
export function AgeGate({ species, title, text, note, actionLabel, onAction, loading }: AgeGateProps) {
  return (
    <View style={styles.root}>
      <Panel gradient="violet" radius={32} padding="none" style={styles.panel}>
        <PetImage species={species} mood="dodo" size={220} animation="bob" style={styles.pet} />
        <Title text={title} size={56} center style={styles.title} />
        <Text size={15} center style={styles.text}>
          {text}
        </Text>
      </Panel>
      <Text size={13} muted center style={styles.note}>
        {note}
      </Text>
      <Button label={actionLabel} variant="ghost" onPress={onAction} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.md, paddingTop: space.md },
  panel: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20 },
  pet: { marginBottom: -10 },
  title: { marginTop: space.sm },
  text: { maxWidth: 270, lineHeight: 20 },
  note: { paddingHorizontal: space.md },
});
