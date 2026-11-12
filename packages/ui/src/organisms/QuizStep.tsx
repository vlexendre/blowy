import { GAUGE_KEYS, GAUGE_MAX, type GaugeKey, type Gauges } from '@blowy/domain';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import type { IconName, PetPose } from '../assets/pets';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { ChoiceCard } from '../molecules/ChoiceCard';
import { ease, fadeTo, springs, useAnimatedNumber, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { PillSpan } from '../motion/PillSpan';
import { alpha, color, craft, gradient, motion, radius, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface QuizChoice<K extends string = string> {
  key: K;
  title: string;
  caption?: string;
  icon?: IconName | ReactNode;
  emoji?: string;
}

export interface QuizPreviewProps {
  pet: PetLook;
  gauges: Gauges;
  labels: Record<GaugeKey, { low: string; high: string }>;
  /** Question en cours (0 à 3) : la tête du pet réagit aux réponses. */
  step?: number;
}

export interface QuizStepProps<K extends string = string> {
  /** Petite ligne jaune (« sociabilité »). */
  kicker?: string;
  title: TitleContent;
  text?: string;
  choices: readonly QuizChoice<K>[];
  selectedKey?: K | null;
  onChoose: (key: K) => void;
  /** Question en cours (0 à 3) : couleurs des deux réponses. */
  step?: number;
  /** Aperçu en haut : le pet et ses jauges qui bougent avec les réponses. */
  preview?: QuizPreviewProps;
}

/** Couleurs des deux réponses de chaque question (V6-Caractere). */
const ANSWER_LOOKS: readonly (readonly [{ colors: readonly [string, string]; ink: string }, { colors: readonly [string, string]; ink: string }])[] = [
  [
    { colors: craft.suzie.gradient, ink: color.dark },
    { colors: gradient.accent, ink: color.dark },
  ],
  [
    { colors: gradient.violet, ink: color.white },
    { colors: gradient.orange, ink: color.dark },
  ],
  [
    { colors: gradient.coral, ink: color.white },
    { colors: craft.suzie.gradient, ink: color.dark },
  ],
  [
    { colors: gradient.violet, ink: color.white },
    { colors: gradient.accent, ink: color.dark },
  ],
];

/** Tête du pet selon les réponses (maquette : joueur → joie, posé → smug, tendre → amour, bavard → surpris). */
function quizMood(g: Gauges, step: number): PetPose {
  let mood: PetPose = 'neutre';
  if (g.play > 0) mood = 'joie';
  else if (g.play < 0) mood = 'smug';
  if (step === 3 && g.tender < 0) mood = 'smug';
  if (step === 3 && g.tender > 0) mood = 'amour';
  if (g.talk > 0) mood = 'surpris';
  return mood;
}

/** Carte du caractère en direct : le pet et ses quatre jauges. */
export function QuizPreview({ pet, gauges, labels, step = 0 }: QuizPreviewProps) {
  const mood = quizMood(gauges, step);
  return (
    <View style={[layout.row, styles.card]}>
      <MoodHop mood={mood}>
        <PetImage species={pet.species} mood={mood} size={92} animation="breathe" style={styles.cardPet} />
      </MoodHop>
      <View style={[layout.grow, styles.gauges]}>
        {GAUGE_KEYS.map((k) => (
          <MiniGauge key={k} value={gauges[k]} low={labels[k].low} high={labels[k].high} />
        ))}
      </View>
    </View>
  );
}

const toPct = (v: number): number => 50 + (Math.max(-GAUGE_MAX, Math.min(GAUGE_MAX, v)) / GAUGE_MAX) * 50;

/** Le petit pet de l'aperçu sautille quand son humeur change (une réponse vient de le faire réagir). */
function MoodHop({ mood, children }: { mood: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const sy = useSharedValue(1);
  const last = useRef(mood);
  useEffect(() => {
    if (mood === last.current) return;
    last.current = mood;
    if (reduced) return;
    y.value = withSequence(withTiming(-10, { duration: 140, easing: ease.out }), withSpring(0, springs.plush));
    sy.value = withSequence(withTiming(1.06, { duration: 140, easing: ease.out }), withTiming(0.92, { duration: 120 }), withSpring(1, springs.plush));
  }, [mood, reduced, y, sy]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scaleY: sy.value }] }));
  return <Animated.View style={[styles.hop, style]}>{children}</Animated.View>;
}

const TRACK = 7;
const KNOB = 14;

/**
 * Jauge serrée de la carte du quiz : pôles en gras (le pôle atteint à 100 %, l'autre à 45 %), barre de 7 pt.
 * La pastille glisse avec un léger dépassement ; le remplissage part du milieu (transformations seulement).
 */
function MiniGauge({ value, low, high }: { value: number; low: string; high: string }) {
  const [width, setWidth] = useState(0);
  const x = useAnimatedNumber(toPct(value), { duration: motion.slow, overshoot: 0.14 });
  const mid = useDerivedValue(() => width / 2);
  const end = useDerivedValue(() => (x.value / 100) * width);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: (x.value / 100) * width - KNOB / 2 }] }));
  return (
    <View accessible accessibilityRole="adjustable" accessibilityLabel={`${low} ${high}`} accessibilityValue={{ min: -100, max: 100, now: Math.round(value) }}>
      <View style={[layout.rowBetween, styles.poles]}>
        <Text variant="bodyHeavy" size={11} style={[styles.pole, value < 0 ? null : styles.poleOff]}>
          {low}
        </Text>
        <Text variant="bodyHeavy" size={11} style={[styles.pole, value > 0 ? null : styles.poleOff]}>
          {high}
        </Text>
      </View>
      <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.zero} />
        {width ? (
          <>
            <PillSpan from={mid} to={end} height={TRACK} color={value < 0 ? color.rose : color.accent} span={width / 2} />
            <Animated.View style={[styles.knob, knob]} />
          </>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Une réponse : choisie, elle s'incline (ChoiceCard) puis part du côté où elle penche ; l'autre s'efface.
 * Animations réduites : la choisie reste, l'autre s'estompe.
 */
function ChoiceSlot({ state, dir, children }: { state: 'idle' | 'picked' | 'other'; dir: 1 | -1; children: ReactNode }) {
  const reduced = useReducedMotion();
  const away = useSharedValue(0);
  const dim = useSharedValue(0);
  useEffect(() => {
    if (state === 'idle') {
      away.value = withTiming(0, { duration: motion.fast });
      dim.value = withTiming(0, { duration: motion.fast });
      return;
    }
    if (state === 'other') {
      dim.value = reduced ? fadeTo(1, motion.fast) : withTiming(1, { duration: motion.fast, easing: ease.out });
      return;
    }
    if (!reduced) away.value = withDelay(170, withTiming(1, { duration: 250, easing: ease.in }));
  }, [state, reduced, away, dim]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - 0.6 * dim.value - 0.3 * away.value,
    transform: [{ translateX: dir * 460 * away.value }, { translateY: 8 * dim.value - 18 * away.value }, { rotate: `${dir * 16 * away.value}deg` }, { scale: 1 - 0.03 * dim.value }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Une question du quiz de caractère : aperçu des jauges, question, deux grandes réponses. */
export function QuizStep<K extends string>({ kicker, title, text, choices, selectedKey, onChoose, step = 0, preview }: QuizStepProps<K>) {
  const looks = ANSWER_LOOKS[step % ANSWER_LOOKS.length] ?? ANSWER_LOOKS[0];
  // La question suivante arrive de la droite ; revenir en arrière la fait arriver de la gauche.
  const prevStep = useRef(step);
  const from = step < prevStep.current ? 'left' : 'right';
  useEffect(() => {
    prevStep.current = step;
  }, [step]);
  return (
    <View style={layout.fill}>
      {preview ? <QuizPreview {...preview} step={step} /> : null}
      <Appear key={`q${step}`} from={from} distance={28} delay={40} style={styles.heading}>
        {kicker ? (
          <Text variant="label" size={11} color={color.accent} style={styles.kicker}>
            {kicker}
          </Text>
        ) : null}
        <Title text={title} size={54} style={styles.title} />
        {text ? (
          <Text muted size={14} style={styles.text}>
            {text}
          </Text>
        ) : null}
      </Appear>
      <View key={`c${step}`} style={styles.choices} accessibilityRole="radiogroup">
        {choices.map((c, i) => (
          <Appear key={c.key} from={from} distance={40} delay={110 + i * 70}>
          <ChoiceSlot state={selectedKey == null ? 'idle' : selectedKey === c.key ? 'picked' : 'other'} dir={i ? 1 : -1}>
          <ChoiceCard
            title={c.title}
            caption={c.caption}
            icon={c.icon}
            emoji={c.emoji}
            colors={looks?.[i % 2]?.colors}
            ink={looks?.[i % 2]?.ink}
            selected={selectedKey === c.key}
            tilt={i ? 2 : -2}
            onPress={() => onChoose(c.key)}
          />
          </ChoiceSlot>
          </Appear>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, paddingTop: 10, paddingBottom: 10, paddingLeft: 6, paddingRight: 14, borderRadius: 26, borderWidth: 1, borderColor: veil.line, backgroundColor: color.panel },
  cardPet: { marginTop: -8, marginRight: -6, marginBottom: -10, marginLeft: -4 },
  gauges: { gap: 9 },
  poles: { marginBottom: space.xs },
  pole: { lineHeight: 15 },
  poleOff: { opacity: 0.45 },
  hop: { transformOrigin: '50% 90%' },
  track: { height: TRACK, borderRadius: radius.pill, backgroundColor: veil.track },
  zero: { position: 'absolute', left: '50%', top: -3, bottom: -3, width: 2, backgroundColor: alpha(color.white, 0.35) },
  knob: {
    position: 'absolute',
    left: 0,
    top: (TRACK - KNOB) / 2,
    width: KNOB,
    height: KNOB,
    borderRadius: radius.pill,
    backgroundColor: color.white,
    shadowColor: color.night,
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  heading: { paddingHorizontal: space.xs, paddingTop: 22 },
  kicker: { letterSpacing: 1.32 },
  title: { marginTop: 6 },
  text: { marginTop: 10 },
  choices: { marginTop: 'auto', paddingTop: space.lg, gap: space.md },
});
