import type { Species } from '@blowy/domain';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import type { BodyPose } from '../assets/pets';
import { DressedPet } from '../atoms/DressedPet';
import { ProgressBar } from '../atoms/ProgressBar';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { ease, useReducedMotion } from '../lib/motion';
import { useUiStrings } from '../lib/strings';
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
 * « On prépare son arrivée » : l'œuf du minimoa qui éclot au fil de la préparation (œuf, fêlé, éclosion, bébé), un pourcentage qui défile, une barre, et une liste qui se coche
 * ligne à ligne (coche dessinée ; la ligne en cours a ses « … »). Rien ici ne décide du rythme : l'écran passe
 * `percent` et l'état de chaque ligne. Animations réduites : les coches et le compteur arrivent sans mouvement.
 */
export function PrepChecklist({ species, title, percent, items, stalled, percentLabel }: PrepChecklistProps) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const uiStrings = useUiStrings();
  return (
    <View style={styles.wrap}>
      <Appear scale={0.9} distance={20}>
        <Hatch species={species} step={hatchStep(p)} stalled={!!stalled} />
      </Appear>
      <Title text={title} size={40} center style={styles.title} />
      <CountUp value={p} from={0} variant="bodyHeavy" size={34} suffix={uiStrings.percentSuffix} accessibilityLabel={percentLabel?.(p)} style={styles.count} />
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

/** L'éclosion suit la préparation : l'œuf, l'œuf fêlé, l'éclosion, puis le bébé à 100 %. */
const HATCH: readonly BodyPose[] = ['oeuf', 'oeuf_fele', 'eclosion', 'bebe'];
const hatchStep = (p: number): number => (p >= 100 ? 3 : p >= 66 ? 2 : p >= 33 ? 1 : 0);
const HATCH_SIZE = 150;

function HatchFrame({ species, pose, index, step }: { species: Species; pose: BodyPose; index: number; step: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - Math.abs(step.value - index)) }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <DressedPet species={species} pose={pose} size={HATCH_SIZE} animated={pose === 'bebe'} />
    </Animated.View>
  );
}

/**
 * L'œuf qui éclot au fil de la préparation : fondu-enchaîné d'une étape à l'autre, et l'œuf qui tremble avant de se
 * fêler. Animations réduites : le fondu seul. Arrêté sur une erreur : l'œuf attend, immobile.
 */
function Hatch({ species, step, stalled }: { species: Species; step: number; stalled: boolean }) {
  const reduced = useReducedMotion();
  const at = useSharedValue(step);
  const wobble = useSharedValue(0);
  useEffect(() => {
    at.value = withTiming(step, { duration: reduced ? 200 : 420, easing: ease.inOut });
    if (reduced || stalled || step === 0 || step === 3) return;
    const w = (v: number) => withTiming(v, { duration: 70, easing: ease.inOut });
    wobble.value = withSequence(w(-6), w(6), w(-4), w(4), w(0));
  }, [step, reduced, stalled, at, wobble]);
  const shake = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));
  return (
    <Animated.View style={[{ width: HATCH_SIZE, height: Math.round(HATCH_SIZE / 0.9) }, styles.hatch, shake]}>
      {HATCH.map((pose, i) => (
        <HatchFrame key={pose} species={species} pose={pose} index={i} step={at} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center' },
  hatch: { transformOrigin: '50% 95%' },
  title: { marginTop: space.md },
  count: { marginTop: space.md },
  bar: { alignSelf: 'stretch', marginTop: space.md },
  list: { alignSelf: 'stretch', marginTop: space.xl, gap: space.md },
  row: { gap: space.md, alignItems: 'center' },
  todo: { opacity: 0.45 },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill, borderWidth: 2, borderColor: veil.off, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: color.accent, borderColor: color.accent },
});
