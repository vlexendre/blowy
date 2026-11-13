import { StyleSheet, View } from 'react-native';

import { Chip } from '../atoms/Chip';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import { space } from '../theme';

export interface StageEchoProps {
  /** Ce que la personne vient de répondre, renvoyé en puces (« plutôt joueur »). */
  chips: readonly string[];
  /** Petite ligne sous les puces. */
  text?: string;
  /** Attente avant la 1re puce (ms) : après le verdict. */
  delay?: number;
}

/**
 * L'écho d'une réponse dans un temps fort : les puces font « pop » une à une sous la grande ligne, puis une petite
 * phrase. Animations réduites : fondus.
 */
export function StageEcho({ chips, text, delay = 0 }: StageEchoProps) {
  return (
    <View style={styles.wrap}>
      <View style={[layout.row, styles.chips]}>
        {chips.map((c, i) => (
          <PopIn key={c} delay={delay + i * 140}>
            <Chip label={c} tone={i ? 'light' : 'accent'} size="lg" />
          </PopIn>
        ))}
      </View>
      {text ? (
        <Appear delay={delay + chips.length * 140 + 120} distance={6}>
          <Text variant="bodyBold" size={16} muted center style={styles.text}>
            {text}
          </Text>
        </Appear>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: space.xl },
  chips: { flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  text: { marginTop: space.md },
});
