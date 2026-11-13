import { StyleSheet } from 'react-native';

import { countWords, Title } from '../atoms/Title';
import { Appear } from '../motion/Appear';
import { useReveal } from '../motion/reveal';
import type { TitleContent } from '../types';

export interface StageLineProps {
  /** Grande ligne centrée (titre Anton, partie estompée possible). */
  text: TitleContent;
  /** Corps. Défaut 46. */
  size?: number;
  /** Mot à mot (verdict) plutôt qu'en un bloc. Défaut faux. */
  wordByWord?: boolean;
  /** Attente avant l'entrée (ms). */
  delay?: number;
}

/**
 * Une grande ligne centrée des temps forts de l'inscription (« psst. salut. ») : elle monte en fondu, ou s'écrit mot
 * à mot (`wordByWord`). Changer de ligne : changer la `key` du composant. Animations réduites : fondu, tout est là.
 */
export function StageLine({ text, size = 46, wordByWord, delay = 0 }: StageLineProps) {
  const words = countWords(text);
  const shown = useReveal(words, { enabled: !!wordByWord, step: 110, delay: delay + 120 });
  return (
    <Appear delay={wordByWord ? 0 : delay} distance={18} scale={0.96} style={styles.wrap}>
      <Title text={text} size={size} center reveal={wordByWord ? shown : undefined} />
    </Appear>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
});
