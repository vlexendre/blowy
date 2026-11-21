import { StyleSheet, View } from 'react-native';

import { DressedPet } from '../atoms/DressedPet';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import type { PetLook, TitleContent } from '../types';

export interface MemoryRecapProps {
  /** « VOUS DEUX, WRAPPED » (le second segment estompé). */
  title: TitleContent;
  /** « 12 jours sans en rater un. » */
  line?: string;
  /** Les deux minimoas, collés en sticker à droite. */
  pets: readonly [PetLook, PetLook];
  accessibilityLabel?: string;
}

/** Le résumé d'un lien en haut des souvenirs (V6-Souvenirs) : panneau corail, grand titre, une ligne, les deux minimoas. */
export function MemoryRecap({ title, line, pets, accessibilityLabel }: MemoryRecapProps) {
  return (
    <Panel gradient="coral" radius={32} padding="none" overflow style={styles.panel}>
      <View style={styles.text} accessible accessibilityLabel={accessibilityLabel}>
        <Title text={title} size={40} />
        {line ? (
          <Text variant="bodyHeavy" size={14} style={styles.line}>
            {line}
          </Text>
        ) : null}
      </View>
      <View
        pointerEvents="none"
        style={styles.pets}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.tiltA}>
          <DressedPet species={pets[0].species} outfit={pets[0].outfit} size={104} pose="debout" />
        </View>
        <View style={styles.tiltB}>
          <DressedPet species={pets[1].species} outfit={pets[1].outfit} size={104} pose="debout" />
        </View>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: 170, paddingVertical: 16, paddingHorizontal: 18 },
  text: { maxWidth: 190, zIndex: 1 },
  line: { marginTop: 6 },
  pets: { position: 'absolute', right: -6, bottom: -8, flexDirection: 'row' },
  tiltA: { transform: [{ rotate: '-6deg' }], marginRight: -26 },
  tiltB: { transform: [{ rotate: '6deg' }] },
});
