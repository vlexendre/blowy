import { type ComponentRef, forwardRef, type ReactNode, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { Panel } from '../atoms/Panel';
import { hasOutfit } from '../assets/fit';
import type { PetPose } from '../assets/pets';
import { DressedPet } from '../atoms/DressedPet';
import { PetImage } from '../atoms/PetImage';
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
  compat: string;
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
  title: TitleContent;
  text?: string;
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

const PET = 196;

/** Pet de la scène : habillé (pose debout) quand il porte une tenue, sinon dans sa pose détourée. */
function StagePet({ pet, pose, delay }: { pet: PetLook; pose: PetPose; delay?: number }) {
  if (hasOutfit(pet.outfit)) return <DressedPet species={pet.species} outfit={pet.outfit} size={PET * 0.92} animated delay={delay} />;
  return <PetImage species={pet.species} mood={pose} size={PET} outline animation="breathe" delay={delay} />;
}

/**
 * Un pet de la scène : entre par son côté en sautillant (ressort de peluche) ; fait signe quand on salue (balancement
 * et petit saut), ou sautille en réponse. Fondu seul si animations réduites.
 */
const Actor = forwardRef<ComponentRef<typeof View>, { side: -1 | 1; delay: number; waveKey: number; answer?: boolean; hidden: { value: number }; children: ReactNode }>(
  function Actor({ side, delay, waveKey, answer, hidden, children }, ref) {
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
      if (!answer) rot.value = withSequence(w(-9 * side), w(8 * side), w(-6 * side), w(4 * side), withSpring(0, springs.plush));
      hop.value = withDelay(later, withSequence(withTiming(1, { duration: 160, easing: ease.out }), withSpring(0, springs.plush)));
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
  },
);

/** Panneau violet du détail d'une rencontre : les deux pets face à face, ce qu'ils se sont dit, « rien sans ton tap ». */
export const EncounterStage = forwardRef<EncounterStageHandle, EncounterStageProps>(function EncounterStage(
  { onBack, backLabel, via, compat, compatLabel, onMore, moreLabel, me, them, saysLabel, children, title, text, waveKey = 0 },
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
    <Panel gradient="violet" radius={32} padding="none" style={styles.panel}>
      <View style={layout.rowBetween}>
        <IconButton glyph="back" label={backLabel} onPress={onBack} size={40} />
        {via ? (
          <Chip label={via.label} left={via.pet ? <Avatar size={18} pet={via.pet} hidden /> : undefined} style={[styles.chip, styles.via]} />
        ) : null}
        <View style={[layout.row, styles.right]}>
          <PopIn delay={420}>
            <Chip label={compat} tone="accent" accessibilityLabel={compatLabel} style={styles.chip} />
          </PopIn>
          {onMore ? <IconButton glyph="more" label={moreLabel ?? ''} onPress={onMore} size={32} /> : null}
        </View>
      </View>
      <View style={styles.stage}>
        {me ? (
          <View style={styles.mine} pointerEvents="none">
            <Actor ref={mine} side={-1} delay={80} waveKey={waveKey} hidden={hidden}>
              <StagePet pet={me.pet} pose={waveKey ? 'salut' : 'cote'} />
            </Actor>
          </View>
        ) : null}
        <View style={styles.theirs} pointerEvents="none">
          <Actor ref={theirs} side={1} delay={200} waveKey={waveKey} answer hidden={hidden}>
            <StagePet pet={them.pet} pose="salut" delay={500} />
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
      <Appear delay={300}>
        <Text variant="bodyHeavy" size={11} style={styles.says}>
          {saysLabel}
        </Text>
      </Appear>
      <View style={styles.thread}>{children}</View>
      <Appear delay={360} style={styles.bottom}>
        <Title text={title} size={46} />
        {text ? (
          <Text size={14} style={styles.text}>
            {text}
          </Text>
        ) : null}
      </Appear>
    </Panel>
  );
});

const styles = StyleSheet.create({
  panel: { flexGrow: 1, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 },
  chip: { height: 26, paddingHorizontal: 11 },
  via: { backgroundColor: alpha(color.white, 0.16), flexShrink: 1 },
  right: { gap: 6 },
  stage: { height: 158, marginHorizontal: -16 },
  mine: { position: 'absolute', left: 16, bottom: -22 },
  theirs: { position: 'absolute', right: 12, bottom: -22 },
  actor: { transformOrigin: '50% 100%' },
  tag: { position: 'absolute' },
  meTag: { left: 34, top: 8 },
  themTag: { right: 30, top: 4 },
  meTilt: { transform: [{ rotate: '-6deg' }] },
  themTilt: { transform: [{ rotate: '5deg' }] },
  says: { opacity: 0.85, marginTop: 30, marginBottom: 8, letterSpacing: 1.32, textTransform: 'uppercase' },
  thread: { gap: 8 },
  bottom: { marginTop: 'auto', paddingTop: 10 },
  text: { marginTop: 6, lineHeight: 19 },
});
