import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { layout } from '../lib/styles';
import { space } from '../theme';
import { StepProgress } from './StepProgress';

export interface SeanceBarProps {
  /** Réponses données (la barre avance d'un cran à chaque « Valider »). */
  step: number;
  total: number;
  onClose: () => void;
  closeLabel: string;
  /** « Question 2 sur 5 ». */
  accessibilityLabel: string;
}

/** Haut de la séance (V6-GSeance) : fermer, puis la barre « x/5 ». */
export function SeanceBar({ step, total, onClose, closeLabel, accessibilityLabel }: SeanceBarProps) {
  return (
    <View style={[layout.row, styles.row]}>
      <IconButton glyph="close" label={closeLabel} onPress={onClose} />
      <StepProgress step={step} total={total} showCount accessibilityLabel={accessibilityLabel} style={layout.grow} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { gap: space.md, paddingTop: space.xs } });
