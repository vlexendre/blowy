import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Text } from '../atoms/Text';
import { PopIn } from '../motion/PopIn';
import { layout } from '../lib/styles';
import { color, space } from '../theme';
import { StepProgress } from './StepProgress';

export interface SeanceBarProps {
  /** Réponses données (la barre avance d'un cran à chaque « Valider »). */
  step: number;
  total: number;
  onClose: () => void;
  closeLabel: string;
  /** « Question 2 sur 5 ». */
  accessibilityLabel: string;
  /** Réponses rapides d'affilée : à partir de 3, la barre s'illumine et le compte s'affiche (« 3 d'affilée »). */
  combo?: number;
  comboLabel?: (n: number) => string;
}

/** Haut de la séance (V6-GSeance) : fermer, puis la barre « x/5 ». */
export function SeanceBar({ step, total, onClose, closeLabel, accessibilityLabel, combo = 0, comboLabel }: SeanceBarProps) {
  const hot = combo >= 3;
  return (
    <View>
      <View style={[layout.row, styles.row]}>
        <IconButton glyph="close" label={closeLabel} onPress={onClose} />
        <StepProgress step={step} total={total} showCount glow={hot} accessibilityLabel={accessibilityLabel} style={layout.grow} />
      </View>
      {hot && comboLabel ? (
        <PopIn key={combo} from={0.6} style={styles.combo}>
          <Text variant="label" size={13} color={color.orange}>
            {comboLabel(combo)}
          </Text>
        </PopIn>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { gap: space.md, paddingTop: space.xs }, combo: { alignSelf: 'center', marginTop: 4 } });
