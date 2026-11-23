import type { Species } from '@blowy/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { IconButton } from '../atoms/IconButton';
import { DressedPet } from '../atoms/DressedPet';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Banner } from '../molecules/Banner';
import { LinkMoodIcon } from '../molecules/LinkMoodIcon';
import { InkProvider } from '../lib/ink';
import { ease, fadeTo, springs, useLoop, useReducedMotion } from '../lib/motion';
import { Appear } from '../motion/Appear';
import { Shake, type ShakeHandle } from '../motion/PopIn';
import { layout } from '../lib/styles';
import { color, extra, motion, space, veil } from '../theme';
import type { PetLook, TitleContent } from '../types';
import { useUiStrings } from '../lib/strings';

export interface SleepPanelProps {
  /** Ton minimoa, qui fait la sieste. */
  pet: PetLook;
  /** « UNE PETITE / PAUSE. » */
  title: TitleContent;
  text?: string;
  /** Ce que dit ton minimoa, et le nom au-dessus (« Nino, en pleine sieste »). */
  speech?: string;
  speakerLabel?: string;
  /** « Le réveiller » : ton minimoa fait un petit coucou à l'autre. */
  wakeLabel: string;
  /** « Le laisser partir », en texte sous « Le réveiller » ; l'écran demande confirmation (alerte du système) avant d'agir. */
  leaveLabel?: string;
  onWake?: () => void;
  onLeave?: () => void;
  waking?: boolean;
  leaving?: boolean;
  /** Erreur de la dernière action (réveiller, laisser partir). */
  error?: string | null;
  /** Retour aux chats (en-tête de l'écran). */
  onBack?: () => void;
  backLabel?: string;
  /** Puce de l'en-tête (« Tom · lien endormi »). */
  badge?: string;
}

/**
 * Lien endormi en plein écran (ADA-2027 item 27, ancien écran « fantôme ») : nuit violette, grand titre doux, ton
 * minimoa qui dort et qui parle, « Le réveiller » ou « Le laisser partir ». Rien n'est perdu ni compté.
 */
export function SleepPanel({
  pet,
  title,
  text,
  speech,
  speakerLabel,
  wakeLabel,
  leaveLabel,
  onWake,
  onLeave,
  waking,
  leaving,
  error,
  onBack,
  backLabel,
  badge,
}: SleepPanelProps) {
  const uiStrings = useUiStrings();
  const insets = useSafeAreaInsets();
  // Chaque nouvelle erreur secoue le bandeau (et vibre).
  const failures = useFailures(error);
  const shake = useRef<ShakeHandle>(null);
  useEffect(() => {
    if (failures) shake.current?.shake();
  }, [failures]);
  return (
    <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 26) }]}>
      <LinearGradient colors={extra.sleep} style={StyleSheet.absoluteFill} />
      <InkProvider value={color.white}>
        <View style={[layout.row, styles.head]}>
          {onBack ? <IconButton glyph="back" label={backLabel ?? uiStrings.back} onPress={onBack} size={40} style={styles.back} /> : null}
          {badge ? <Chip label={badge} tone="glass" /> : null}
          <LinkMoodIcon warmth="endormi" size={20} style={styles.moon} />
        </View>
        <Appear delay={60}>
          <Title text={title} size={76} style={styles.title} />
        </Appear>
        {text ? (
          <Appear delay={120}>
            <Text variant="bodyBold" size={16} style={styles.text}>
              {text}
            </Text>
          </Appear>
        ) : null}
        <View style={styles.stage}>
          <SleepingPet species={pet.species} waking={!!waking} />
          {speech ? (
            <Appear delay={240} from="left" style={[layout.row, styles.speech]}>
              <View style={styles.avatar}>
                <Avatar size={30} pet={pet} hidden pose="dodo" bg={extra.sleepDisc} />
              </View>
              <View style={layout.shrink}>
                {speakerLabel ? (
                  <Text variant="bodyHeavy" size={11} color={extra.sleepInk} style={styles.who}>
                    {speakerLabel}
                  </Text>
                ) : null}
                <View style={styles.bubble}>
                  <Text variant="body" size={14} style={styles.bubbleText}>
                    {speech}
                  </Text>
                </View>
              </View>
            </Appear>
          ) : null}
        </View>
        <Appear delay={320} style={styles.actions}>
          {error ? (
            <Shake ref={shake}>
              <Banner tone="error" text={error} />
            </Shake>
          ) : null}
          <Button label={wakeLabel} variant="white" onPress={onWake} loading={waking} />
          {leaveLabel && onLeave ? <Button label={leaveLabel} variant="link" onPress={onLeave} loading={leaving} /> : null}
        </Appear>
      </InkProvider>
    </View>
  );
}

function useFailures(error: string | null | undefined): number {
  const count = useRef(0);
  const last = useRef(error);
  if (error && error !== last.current) count.current += 1;
  last.current = error;
  return count.current;
}

const PET = 290;

/**
 * Ton minimoa qui dort : il respire doucement (léger gonflement). Pendant « Le réveiller », il se lève et sourit ;
 * si ça échoue, il se rendort. Animations réduites : fondus seuls, pas de respiration.
 */
function SleepingPet({ species, waking }: { species: Species; waking: boolean }) {
  const reduced = useReducedMotion();
  const awake = useSharedValue(0);
  const hop = useSharedValue(0);
  const t = useLoop(2600);
  useEffect(() => {
    if (reduced) {
      awake.value = fadeTo(waking ? 1 : 0, motion.base);
      return;
    }
    awake.value = withTiming(waking ? 1 : 0, { duration: waking ? motion.slow : motion.scene, easing: ease.inOut });
    if (waking) hop.value = withSequence(withTiming(1, { duration: 180, easing: ease.out }), withSpring(0, springs.plush));
  }, [waking, reduced, awake, hop]);
  const breathe = useAnimatedStyle(() => ({
    transform: [{ translateY: -hop.value * 26 }, { scale: 1 + (reduced ? 0 : 0.015 * t.value * (1 - awake.value)) + 0.03 * hop.value }],
  }));
  const asleep = useAnimatedStyle(() => ({ opacity: 1 - awake.value }));
  const happy = useAnimatedStyle(() => ({ opacity: awake.value }));
  return (
    <Animated.View pointerEvents="none" style={[styles.pet, breathe]}>
      <Animated.View style={[StyleSheet.absoluteFill, asleep]}>
        <DressedPet species={species} pose="dodo" size={PET} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, happy]}>
        <DressedPet species={species} pose="joie" size={PET} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 640, paddingHorizontal: 18 },
  head: { gap: 10 },
  back: { backgroundColor: veil.track },
  moon: { marginLeft: 'auto' },
  title: { marginTop: 22 },
  text: { marginTop: 10, maxWidth: 300 },
  stage: { height: 270, marginTop: 2, alignItems: 'center' },
  pet: { marginTop: -24, width: PET, height: Math.round(PET / 0.9) },
  speech: { position: 'absolute', left: 0, top: 4, maxWidth: 210, gap: space.sm, alignItems: 'flex-end' },
  avatar: { alignSelf: 'flex-end' },
  who: { marginLeft: space.xs, marginBottom: 3 },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: veil.glass,
  },
  bubbleText: { lineHeight: 18 },
  actions: { marginTop: 'auto', gap: 10 },
});
