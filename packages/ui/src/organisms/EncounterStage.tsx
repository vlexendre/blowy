import { type ComponentRef, forwardRef, type ReactNode, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { Panel } from '../atoms/Panel';
import type { BodyPose } from '../assets/pets';
import { DressedPet } from '../atoms/DressedPet';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { measureInWindow, type Rect } from '../motion/MotionHost';
import { PopIn } from '../motion/PopIn';
import { alpha, color, motion } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface EncounterStageProps {
  onBack: () => void;
  backLabel: string;
  /** Puce centrale (« par Malo · pote de pote »), avec le visage du pet de l'intermédiaire. */
  via?: { label: string; pet?: PetLook };
  /** Puce jaune à droite (« 91 % »). */
  /** Absent : pas de puce (compatibilité inconnue). */
  compat?: string;
  compatLabel?: string;
  /** Bouton « … » (signaler / bloquer). */
  onMore?: () => void;
  moreLabel?: string;
  me?: { pet: PetLook; label: string };
  them: { pet: PetLook; label: string };
  /** « ce qu'ils se sont dit, hier soir ». */
  saysLabel: string;
  /** Les bulles des pets. */
  children?: ReactNode;
  /** Grand titre en bas du panneau (facultatif : une ligne de `text` suffit souvent). */
  title?: TitleContent;
  text?: string;
  /**
   * Grand titre en haut (« SASHA & PIA », V6-GRencontre) et sa ligne (« Près de chez toi ») : le panneau prend alors
   * 290 de haut, les deux minimoas en bas, sans fil de bulles (la phrase du minimoa passe sous le panneau).
   */
  heading?: TitleContent;
  subtitle?: string;
  /** À incrémenter quand tu salues : ton pet fait signe, le sien sautille en réponse. */
  waveKey?: number;
}

/** Commandes de la scène (rencontre acceptée : les pets partent de leur place pour se cogner au centre). */
export interface EncounterStageHandle {
  /** Place des deux pets dans la fenêtre. */
  petRects: () => Promise<{ me: Rect | null; them: Rect | null }>;
  /** Cache les pets de la scène (leurs doubles jouent la suite au-dessus de l'écran). */
  hidePets: () => void;
}

const PET = 172;

/**
 * Minimoa de la scène, en pied et habillé : `pose` au repos, `then` une fois qu'on a salué (fondu-enchaîné court,
 * le rebond est joué par `Actor`). Animations réduites : fondu seul.
 */
function StagePet({
  pet,
  pose,
  then,
  waveKey,
  delay,
}: {
  pet: PetLook;
  pose: BodyPose;
  then: BodyPose;
  waveKey: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const after = useSharedValue(waveKey ? 1 : 0);
  useEffect(() => {
    if (!waveKey) return;
    after.value = reduced ? fadeTo(1, motion.fast) : withTiming(1, { duration: 140, easing: ease.inOut });
  }, [waveKey, reduced, after]);
  const a = useAnimatedStyle(() => ({ opacity: 1 - after.value }));
  const b = useAnimatedStyle(() => ({ opacity: after.value }));
  return (
    <View style={{ width: PET, height: Math.round(PET / 0.9) }}>
      <Animated.View style={[StyleSheet.absoluteFill, a]}>
        <DressedPet species={pet.species} outfit={pet.outfit} size={PET} pose={pose} animated delay={delay} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, b]}>
        <DressedPet species={pet.species} outfit={pet.outfit} size={PET} pose={then} animated delay={delay} />
      </Animated.View>
    </View>
  );
}

/**
 * Un pet de la scène : entre par son côté en sautillant (ressort de peluche) ; fait signe quand on salue (balancement
 * et petit saut), ou sautille en réponse. Fondu seul si animations réduites.
 */
const Actor = forwardRef<
  ComponentRef<typeof View>,
  {
    side: -1 | 1;
    delay: number;
    waveKey: number;
    answer?: boolean;
    hidden: { value: number };
    children: ReactNode;
  }
>(function Actor({ side, delay, waveKey, answer, hidden, children }, ref) {
  const reduced = useReducedMotion();
  const enter = useSharedValue(0);
  const o = useSharedValue(0);
  const rot = useSharedValue(0);
  const hop = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      o.value = withDelay(Math.min(delay, motion.fast), fadeTo(1, motion.fast));
      return;
    }
    o.value = withDelay(delay, withTiming(1, { duration: motion.fast }));
    enter.value = withDelay(delay, withSpring(1, springs.plush));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!waveKey || reduced) return;
    const later = answer ? 420 : 0;
    const w = (to: number) => withTiming(to, { duration: 200, easing: ease.inOut });
    if (!answer)
      rot.value = withSequence(
        w(-9 * side),
        w(8 * side),
        w(-6 * side),
        w(4 * side),
        withSpring(0, springs.plush),
      );
    hop.value = withDelay(
      later,
      withSequence(withTiming(1, { duration: 160, easing: ease.out }), withSpring(0, springs.plush)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveKey]);
  const style = useAnimatedStyle(() => {
    const k = 1 - enter.value;
    return {
      opacity: o.value * (1 - hidden.value),
      transform: [
        { translateX: side * 90 * k },
        { translateY: -Math.abs(Math.sin(k * Math.PI)) * 26 - hop.value * (answer ? 22 : 14) },
        { rotate: `${rot.value - side * 10 * k}deg` },
      ],
    };
  });
  return (
    <Animated.View ref={ref} collapsable={false} style={[styles.actor, style]}>
      {children}
    </Animated.View>
  );
});

/** Panneau violet du détail d'une rencontre : les deux pets face à face, ce qu'ils se sont dit, « rien sans ton tap ». */
export const EncounterStage = forwardRef<EncounterStageHandle, EncounterStageProps>(function EncounterStage(
  {
    onBack,
    backLabel,
    via,
    compat,
    compatLabel,
    onMore,
    moreLabel,
    me,
    them,
    saysLabel,
    children,
    title,
    text,
    heading,
    subtitle,
    waveKey = 0,
  },
  ref,
) {
  const mine = useRef<ComponentRef<typeof View>>(null);
  const theirs = useRef<ComponentRef<typeof View>>(null);
  const hidden = useSharedValue(0);
  useImperativeHandle(ref, () => ({
    petRects: async () => {
      const [a, b] = await Promise.all([measureInWindow(mine), measureInWindow(theirs)]);
      return { me: a, them: b };
    },
    hidePets: () => {
      hidden.value = withTiming(1, { duration: motion.instant });
    },
  }));
  useEffect(() => {
    if (waveKey) hapticFor('press');
  }, [waveKey]);
  return (
    <Panel
      gradient="violet"
      radius={32}
      padding="none"
      style={[styles.panel, heading ? styles.headed : null]}
    >
      {/* Au-dessus des minimoas : leurs têtes dépassent de la scène, les puces restent lisibles et touchables. */}
      <View style={[layout.rowBetween, styles.top]}>
        <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} />
        {via ? (
          <Chip
            label={via.label}
            left={via.pet ? <Avatar size={18} pet={via.pet} hidden /> : undefined}
            style={[styles.chip, styles.via]}
          />
        ) : null}
        <View style={[layout.row, styles.right]}>
          {compat ? (
            <PopIn delay={420}>
              <Chip label={compat} tone="accent" accessibilityLabel={compatLabel} style={styles.chip} />
            </PopIn>
          ) : null}
          {onMore ? <IconButton glyph="more" label={moreLabel ?? ''} onPress={onMore} size={32} /> : null}
        </View>
      </View>
      {heading ? (
        <View style={styles.heading}>
          <Title text={heading} size={46} numberOfLines={2} />
          {subtitle ? (
            <Text variant="bodyHeavy" size={15}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.stage, heading ? styles.stageLow : null]}>
        {me ? (
          <View style={styles.mine} pointerEvents="none">
            <Actor ref={mine} side={-1} delay={80} waveKey={waveKey} hidden={hidden}>
              {/* Il arrive de profil vers l'autre ; quand tu salues, il lève la main pour un check. */}
              <StagePet pet={me.pet} pose="marche" then="check" waveKey={waveKey} />
            </Actor>
          </View>
        ) : null}
        <View style={styles.theirs} pointerEvents="none">
          <Actor ref={theirs} side={1} delay={200} waveKey={waveKey} answer hidden={hidden}>
            {/* Première rencontre : il est un peu timide, puis répond d'un coucou quand tu salues. */}
            <StagePet pet={them.pet} pose="timide" then="coucou" waveKey={waveKey} delay={500} />
          </Actor>
        </View>
        {me ? (
          <PopIn delay={520} style={[styles.tag, styles.meTag]}>
            <Chip label={me.label} tone="accent" style={[styles.chip, styles.meTilt]} />
          </PopIn>
        ) : null}
        <PopIn delay={600} style={[styles.tag, styles.themTag]}>
          <Chip label={them.label} tone="light" style={[styles.chip, styles.themTilt]} />
        </PopIn>
      </View>
      {heading ? null : (
        <>
          <Appear delay={300}>
            <Text variant="bodyHeavy" size={13} style={styles.says}>
              {saysLabel}
            </Text>
          </Appear>
          <View style={styles.thread}>{children}</View>
          <Appear delay={360} style={styles.bottom}>
            {title ? <Title text={title} size={40} /> : null}
            {text ? (
              <Text size={15} style={styles.text}>
                {text}
              </Text>
            ) : null}
          </Appear>
        </>
      )}
    </Panel>
  );
});

const styles = StyleSheet.create({
  panel: { flexGrow: 1, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 },
  top: { zIndex: 3 },
  chip: { height: 26, paddingHorizontal: 11 },
  // Fond sombre et opaque : la puce passe devant la houppe des minimoas et doit rester lisible.
  via: { backgroundColor: alpha(color.dark, 0.72), flexShrink: 1 },
  right: { gap: 6 },
  stage: { height: 138, marginHorizontal: -16 },
  // Avec un grand titre : 290 de haut, les minimoas posés en bas du panneau.
  headed: { flexGrow: 0, height: 290 },
  heading: { marginTop: 10, zIndex: 3 },
  stageLow: { position: 'absolute', left: 16, right: 16, bottom: 0 },
  mine: { position: 'absolute', left: 16, bottom: -22 },
  theirs: { position: 'absolute', right: 12, bottom: -22 },
  actor: { transformOrigin: '50% 100%' },
  tag: { position: 'absolute' },
  meTag: { left: 34, top: 8 },
  themTag: { right: 30, top: 4 },
  meTilt: { transform: [{ rotate: '-6deg' }] },
  themTilt: { transform: [{ rotate: '5deg' }] },
  says: { opacity: 0.85, marginTop: 24, marginBottom: 6, letterSpacing: 1.04, textTransform: 'uppercase' },
  thread: { gap: 8 },
  bottom: { marginTop: 'auto', paddingTop: 10 },
  text: { marginTop: 4, lineHeight: 20, opacity: 0.85 },
});
