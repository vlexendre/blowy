import { GAUGE_KEYS, GAUGE_MAX, type GaugeKey, type Gauges } from '@blowy/domain';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { IconName, PetPose } from '../assets/pets';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { ChoiceCard } from '../molecules/ChoiceCard';
import { useAnimatedNumber } from '../lib/motion';
import { layout } from '../lib/styles';
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
  return (
    <View style={[layout.row, styles.card]}>
      <PetImage species={pet.species} mood={quizMood(gauges, step)} size={92} animation="breathe" style={styles.cardPet} />
      <View style={[layout.grow, styles.gauges]}>
        {GAUGE_KEYS.map((k) => (
          <MiniGauge key={k} value={gauges[k]} low={labels[k].low} high={labels[k].high} />
        ))}
      </View>
    </View>
  );
}

const toPct = (v: number): number => 50 + (Math.max(-GAUGE_MAX, Math.min(GAUGE_MAX, v)) / GAUGE_MAX) * 50;

/** Jauge serrée de la carte du quiz : pôles en gras (le pôle atteint à 100 %, l'autre à 45 %), barre de 7 pt. */
function MiniGauge({ value, low, high }: { value: number; low: string; high: string }) {
  const x = useAnimatedNumber(toPct(value), motion.base);
  const fill = useAnimatedStyle(() => ({ left: `${Math.min(50, x.value)}%`, right: `${100 - Math.max(50, x.value)}%` }));
  const knob = useAnimatedStyle(() => ({ left: `${x.value}%` }));
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
      <View style={styles.track}>
        <View style={styles.zero} />
        <Animated.View style={[styles.fill, { backgroundColor: value < 0 ? color.rose : color.accent }, fill]} />
        <Animated.View style={[styles.knob, knob]} />
      </View>
    </View>
  );
}

/** Une question du quiz de caractère : aperçu des jauges, question, deux grandes réponses. */
export function QuizStep<K extends string>({ kicker, title, text, choices, selectedKey, onChoose, step = 0, preview }: QuizStepProps<K>) {
  const looks = ANSWER_LOOKS[step % ANSWER_LOOKS.length] ?? ANSWER_LOOKS[0];
  return (
    <View style={layout.fill}>
      {preview ? <QuizPreview {...preview} step={step} /> : null}
      <View style={styles.heading}>
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
      </View>
      <View style={styles.choices} accessibilityRole="radiogroup">
        {choices.map((c, i) => (
          <ChoiceCard
            key={c.key}
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
  track: { height: 7, borderRadius: radius.pill, backgroundColor: veil.track },
  zero: { position: 'absolute', left: '50%', top: -3, bottom: -3, width: 2, backgroundColor: alpha(color.white, 0.35) },
  fill: { position: 'absolute', top: 0, bottom: 0, borderRadius: radius.pill },
  knob: {
    position: 'absolute',
    top: -3.5,
    width: 14,
    height: 14,
    marginLeft: -7,
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
