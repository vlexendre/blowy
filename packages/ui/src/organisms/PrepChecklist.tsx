import type { Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { PetImage } from '../atoms/PetImage';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { Appear, Stagger } from '../motion/Appear';
import { CountUp } from '../motion/CountUp';
import { DrawnCheck } from '../motion/DrawnCheck';
import { TypingDots } from '../motion/TypingDots';
import { color, radius, space, veil } from '../theme';
import type { TitleContent } from '../types';

export type PrepItemState = 'todo' | 'doing' | 'done';

export interface PrepChecklistProps {
  species: Species;
  title: TitleContent;
  /** Pourcentage montré (0 à 100) : il défile comme un compteur à chaque changement. */
  percent: number;
  items: readonly { label: string; state: PrepItemState }[];
  /** Arrêté sur une erreur : le pet s'inquiète, la ligne en cours ne s'anime plus. */
  stalled?: boolean;
  /** Libellé lu du pourcentage (« préparation : 58 % »). */
  percentLabel?: (n: number) => string;
}

/**
 * « On prépare son arrivée » : le pet au milieu, un pourcentage qui défile, une barre, et une liste qui se coche
 * ligne à ligne (coche dessinée ; la ligne en cours a ses « … »). Rien ici ne décide du rythme : l'écran passe
 * `percent` et l'état de chaque ligne. Animations réduites : les coches et le compteur arrivent sans mouvement.
 */
export function PrepChecklist({ species, title, percent, items, stalled, percentLabel }: PrepChecklistProps) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <View style={styles.wrap}>
      <Appear scale={0.9} distance={20}>
        <PetImage species={species} mood={stalled ? 'triste' : p >= 100 ? 'joie' : 'neutre'} size={150} animation={stalled ? 'none' : 'breathe'} />
      </Appear>
      <Title text={title} size={40} center style={styles.title} />
      <CountUp value={p} from={0} variant="bodyHeavy" size={34} suffix=" %" accessibilityLabel={percentLabel?.(p)} style={styles.count} />
      <ProgressBar value={p / 100} height={10} color={stalled ? color.mute : color.accent} style={styles.bar} />
      <View style={styles.list}>
      <Stagger delay={200} step={70}>
        {items.map((it) => (
          <View key={it.label} style={[layout.row, styles.row, it.state === 'todo' && styles.todo]} accessible accessibilityLabel={it.label} accessibilityState={{ checked: it.state === 'done', busy: it.state === 'doing' }}>
            <View style={[styles.dot, it.state === 'done' && styles.dotDone]}>
              {it.state === 'done' ? <DrawnCheck size={18} color={color.dark} strokeWidth={3} /> : it.state === 'doing' && !stalled ? <TypingDots size={4} color={color.white} /> : null}
            </View>
            <Text variant="bodyBold" size={15} style={layout.grow}>
              {it.label}
            </Text>
          </View>
        ))}
      </Stagger>
      </View>
    </View>
  );
}

const DOT = 26;

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center' },
  title: { marginTop: space.md },
  count: { marginTop: space.md },
  bar: { alignSelf: 'stretch', marginTop: space.md },
  list: { alignSelf: 'stretch', marginTop: space.xl, gap: space.md },
  row: { gap: space.md, alignItems: 'center' },
  todo: { opacity: 0.45 },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, borderWidth: 2, borderColor: veil.off, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: color.accent, borderColor: color.accent },
});
