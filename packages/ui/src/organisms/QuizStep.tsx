import { GAUGE_KEYS, GAUGE_MAX, type GaugeKey, type Gauges } from '@blowy/domain';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import type { IconName, PetPose } from '../assets/pets';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { ChoiceCard } from '../molecules/ChoiceCard';
import { ease, fadeTo, springs, useAnimatedNumber, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { useFirstTime } from '../motion/once';
import { PillSpan } from '../motion/PillSpan';
import { alpha, color, craft, gradient, motion, radius, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface QuizChoice<K extends string = string> {
  key: K;
  title: string;
  caption?: string;
  /** Phrase en casse normale sous le titre (test de vision). */
  subtitle?: string;
  icon?: IconName | ReactNode;
  emoji?: string;
}

export interface QuizPreviewProps {
  /** Le pet à gauche des jauges ; sans lui (l'hôte est déjà à l'écran), les jauges seules. */
  pet?: PetLook;
  gauges: Gauges;
  labels: Record<GaugeKey, { low: string; high: string }>;
  /** Question en cours (0 à 3) : la tête du pet réagit aux réponses. */
  step?: number;
  /** Jauge que règle la question en cours : mise en avant, les autres estompées. */
  focus?: GaugeKey;
  /** Petite ligne au-dessus des jauges (« son caractère »). */
  title?: string;
}

export interface QuizStepProps<K extends string = string> {
  /** Petite ligne jaune (« sociabilité »). */
  kicker?: string;
  /** Sans titre (ni kicker, ni texte) : la question est posée par l'hôte (`OnboardingTemplate` → `host`). */
  title?: TitleContent;
  text?: string;
  choices: readonly QuizChoice<K>[];
  selectedKey?: K | null;
  onChoose: (key: K) => void;
  /** Question en cours (0 à 3) : couleurs des deux réponses. */
  step?: number;
  /** Aperçu en haut : le pet et ses jauges qui bougent avec les réponses. */
  preview?: QuizPreviewProps;
  /** Consigne juste au-dessus des cartes (« touche une carte… »). */
  hint?: string;
  /**
   * Première question : si rien n'est touché, les deux cartes se soulèvent l'une après l'autre (deux fois),
   * pour montrer qu'elles se touchent. Une seule fois par session (clé), jamais avec « réduire les animations ».
   */
  nudgeKey?: string;
  /**
   * `colors` (défaut) : chaque réponse a son dégradé (quiz de caractère). `plain` : cartes sombres, la choisie passe au
   * jaune (test de vision, maquette V6-GVision).
   */
  look?: 'colors' | 'plain';
  /** Au-dessus des cartes, posé sur la première (le minimoa qui regarde les réponses). */
  peek?: ReactNode;
  /** Sous les cartes (la barre de vision que la réponse fait bouger). */
  below?: ReactNode;
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

/** Carte du caractère en direct : (le pet et) ses quatre jauges ; celle de la question en cours mise en avant. */
export function QuizPreview({ pet, gauges, labels, step = 0, focus, title }: QuizPreviewProps) {
  const mood = quizMood(gauges, step);
  const meters = (
    <View style={[layout.grow, styles.gauges]}>
      {title ? (
        <Text variant="label" size={10} muted style={styles.previewTitle}>
          {title}
        </Text>
      ) : null}
      {GAUGE_KEYS.map((k) => (
        <MiniGauge key={k} value={gauges[k]} low={labels[k].low} high={labels[k].high} dimmed={!!focus && focus !== k} />
      ))}
    </View>
  );
  if (!pet) return <View style={[styles.card, styles.cardBare]}>{meters}</View>;
  return (
    <View style={[layout.row, styles.card]}>
      <MoodHop mood={mood}>
        <PetImage species={pet.species} mood={mood} size={92} animation="breathe" style={styles.cardPet} />
      </MoodHop>
      {meters}
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

/**
 * Jauge serrée de la carte du quiz : pôles en gras (le pôle atteint à 100 %, l'autre à 45 %), barre de 7 pt qui se
 * remplit du milieu vers un pôle. Pas de curseur : c'est un compteur, rien ne se tire. Quand une réponse la fait
 * bouger, le remplissage file avec un léger dépassement et la ligne s'éclaire un instant (transformations et opacité).
 */
function MiniGauge({ value, low, high, dimmed }: { value: number; low: string; high: string; dimmed?: boolean }) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useAnimatedNumber(toPct(value), { duration: motion.slow, overshoot: 0.14 });
  const mid = useDerivedValue(() => width / 2);
  const end = useDerivedValue(() => (x.value / 100) * width);
  const flash = useSharedValue(0);
  const pop = useSharedValue(1);
  const last = useRef(value);
  useEffect(() => {
    if (value === last.current) return;
    last.current = value;
    flash.value = withSequence(withTiming(1, { duration: motion.instant }), withTiming(0, { duration: motion.slow, easing: ease.out }));
    if (!reduced) pop.value = withSequence(withTiming(1.035, { duration: motion.instant, easing: ease.out }), withSpring(1, springs.pop));
  }, [value, reduced, flash, pop]);
  const glow = useAnimatedStyle(() => ({ opacity: flash.value }));
  const lift = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const pole = value < 0 ? low : value > 0 ? high : undefined;
  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${low} ${high}`}
      accessibilityValue={{ text: pole }}
      style={[styles.mini, dimmed && styles.miniDim, lift]}
    >
      <View style={[layout.rowBetween, styles.poles]}>
        <Text variant="bodyHeavy" size={11} style={[styles.pole, value < 0 ? null : styles.poleOff]}>
          {low}
        </Text>
        <Text variant="bodyHeavy" size={11} style={[styles.pole, value > 0 ? null : styles.poleOff]}>
          {high}
        </Text>
      </View>
      <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View pointerEvents="none" style={[styles.glow, glow]} />
        <View style={styles.zero} />
        {width ? <PillSpan from={mid} to={end} height={TRACK} color={value < 0 ? color.rose : color.accent} span={width / 2} /> : null}
      </View>
    </Animated.View>
  );
}

/**
 * Une réponse : choisie, elle s'incline (ChoiceCard) puis part du côté où elle penche ; l'autre s'efface.
 * Animations réduites : la choisie reste, l'autre s'estompe.
 */
function ChoiceSlot({ state, dir, nudgeAt, children }: { state: 'idle' | 'picked' | 'other'; dir: 1 | -1; nudgeAt?: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const away = useSharedValue(0);
  const dim = useSharedValue(0);
  const nudge = useSharedValue(0);
  // « Touche-moi » : la carte se soulève et revient, deux fois (l'autre carte fait de même, décalée).
  useEffect(() => {
    if (nudgeAt === undefined || reduced || state !== 'idle') {
      cancelAnimation(nudge);
      nudge.value = withTiming(0, { duration: motion.instant });
      return;
    }
    const lift = () => withSequence(withTiming(1, { duration: 170, easing: ease.out }), withSpring(0, springs.pop));
    nudge.value = withDelay(nudgeAt, withSequence(lift(), withDelay(1100, lift())));
    return () => cancelAnimation(nudge);
  }, [nudgeAt, reduced, state, nudge]);
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
    transform: [
      { translateX: dir * 460 * away.value },
      { translateY: 8 * dim.value - 18 * away.value - 8 * nudge.value },
      { rotate: `${dir * 16 * away.value - dir * 1.2 * nudge.value}deg` },
      { scale: 1 - 0.03 * dim.value + 0.025 * nudge.value },
    ],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Une question du quiz de caractère : aperçu des jauges, question, deux grandes réponses. */
export function QuizStep<K extends string>({ kicker, title, text, choices, selectedKey, onChoose, step = 0, preview, hint, nudgeKey, look = 'colors', peek, below }: QuizStepProps<K>) {
  const firstNudge = useFirstTime(nudgeKey);
  // Le coup de pouce s'arrête pour de bon au premier choix.
  const [answered, setAnswered] = useState(false);
  const nudging = !!nudgeKey && firstNudge && !answered && selectedKey == null;
  const choose = (key: K) => {
    setAnswered(true);
    onChoose(key);
  };
  const looks = ANSWER_LOOKS[step % ANSWER_LOOKS.length] ?? ANSWER_LOOKS[0];
  // La question suivante arrive de la droite ; revenir en arrière la fait arriver de la gauche.
  const prevStep = useRef(step);
  const from = step < prevStep.current ? 'left' : 'right';
  useEffect(() => {
    prevStep.current = step;
  }, [step]);
  return (
    <View style={layout.fill}>
      {preview && (title || kicker || text) ? <QuizPreview {...preview} step={step} /> : null}
      {title || kicker || text ? (
      <Appear key={`q${step}`} from={from} distance={28} delay={40} style={styles.heading}>
        {kicker ? (
          <Text variant="label" size={11} color={color.accent} style={styles.kicker}>
            {kicker}
          </Text>
        ) : null}
        {title ? <Title text={title} size={54} style={styles.title} /> : null}
        {text ? (
          <Text muted size={14} style={styles.text}>
            {text}
          </Text>
        ) : null}
      </Appear>
      ) : null}
      {/* Sans titre (l'hôte pose la question), les jauges descendent juste au-dessus des cartes : on voit ce que le
          choix fait bouger, là où on vient de toucher. */}
      {preview && !(title || kicker || text) ? (
        <View style={styles.previewLow}>
          <QuizPreview {...preview} step={step} />
        </View>
      ) : null}
      <View key={`c${step}`} style={[styles.choices, preview && !(title || kicker || text) && styles.choicesAfterPreview]} accessibilityRole="radiogroup" accessibilityLabel={hint}>
        {hint && look === 'colors' ? (
          <Appear from="none" delay={60}>
            <Text variant="label" size={11} muted center style={styles.hint}>
              {hint}
            </Text>
          </Appear>
        ) : null}
        {peek ? <View style={styles.peek} pointerEvents="none">{peek}</View> : null}
        {choices.map((c, i) => (
          <Appear key={c.key} from={from} distance={40} delay={110 + i * 70}>
          <ChoiceSlot state={selectedKey == null ? 'idle' : selectedKey === c.key ? 'picked' : 'other'} dir={i ? 1 : -1} nudgeAt={nudging ? 1400 + i * 520 : undefined}>
          <ChoiceCard
            title={c.title}
            caption={c.caption}
            subtitle={c.subtitle}
            icon={c.icon}
            emoji={c.emoji}
            plain={look === 'plain'}
            colors={looks?.[i % 2]?.colors}
            ink={looks?.[i % 2]?.ink}
            marker
            selected={selectedKey === c.key}
            tilt={i ? 2 : -2}
            onPress={() => choose(c.key)}
          />
          </ChoiceSlot>
          </Appear>
        ))}
        {hint && look === 'plain' ? (
          <Appear from="none" delay={220}>
            <Text size={13} muted center>
              {hint}
            </Text>
          </Appear>
        ) : null}
      </View>
      {below ? <View style={styles.below}>{below}</View> : null}
    </View>
  );
}


const styles = StyleSheet.create({
  card: { gap: 10, paddingTop: 10, paddingBottom: 10, paddingLeft: 6, paddingRight: 14, borderRadius: 26, borderWidth: 1, borderColor: veil.line, backgroundColor: color.panel },
  cardPet: { marginTop: -8, marginRight: -6, marginBottom: -10, marginLeft: -4 },
  cardBare: { paddingLeft: 14, paddingTop: 12, paddingBottom: 12 },
  gauges: { gap: 9 },
  previewTitle: { letterSpacing: 1.2, marginBottom: -2 },
  mini: { transformOrigin: '50% 50%' },
  miniDim: { opacity: 0.42 },
  glow: { position: 'absolute', left: -4, right: -4, top: -4, bottom: -4, borderRadius: radius.pill, backgroundColor: alpha(color.accent, 0.28) },
  hint: { letterSpacing: 1.1, marginBottom: -4 },
  poles: { marginBottom: space.xs },
  pole: { lineHeight: 15 },
  poleOff: { opacity: 0.45 },
  hop: { transformOrigin: '50% 90%' },
  track: { height: TRACK, borderRadius: radius.pill, backgroundColor: veil.track },
  zero: { position: 'absolute', left: '50%', top: -3, bottom: -3, width: 2, backgroundColor: alpha(color.white, 0.35) },
  heading: { paddingHorizontal: space.xs, paddingTop: 22 },
  kicker: { letterSpacing: 1.32 },
  title: { marginTop: 6 },
  text: { marginTop: 10 },
  choices: { marginTop: 'auto', paddingTop: space.lg, gap: space.md },
  previewLow: { marginTop: 'auto', paddingTop: space.md },
  choicesAfterPreview: { marginTop: 0, paddingTop: space.lg },
  peek: { alignItems: 'center', marginBottom: -40 },
  below: { paddingTop: space.lg },
});
