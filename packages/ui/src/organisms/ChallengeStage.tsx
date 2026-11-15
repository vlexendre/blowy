import type { Outfit, Species } from '@blowy/domain';
import { type ReactNode, useEffect, useRef } from 'react';
import { Pressable as RNPressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Skeleton } from '../atoms/Skeleton';
import { Sticker } from '../atoms/Sticker';
import { MIN_TEXT_SIZE, Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { useOverlay } from '../lib/overlay';
import { layout } from '../lib/styles';
import { Banner } from '../molecules/Banner';
import { Burst } from '../motion/Burst';
import { PopIn } from '../motion/PopIn';
import { PetActor, type PetActorHandle } from '../motion/pets/PetActor';
import { StreakFlame } from '../motion/pets/StreakFlame';
import { alpha, color, motion, radius, space } from '../theme';
import type { TitleContent } from '../types';

export interface ChallengeReward {
  /** Visuel (flamme, image de l'objet, picto de la vision). */
  icon: ReactNode;
  /** « Série 13 », « La cape ». */
  title: string;
  /** « Un jour de plus », « Plus que 2 jours ». */
  text: string;
}

export interface ChallengeStageProps {
  pet: { species: Species; outfit?: Outfit | null; name: string; id?: string };
  /** Série en cours : la mèche du minimoa brûle à cette taille. */
  streak: number;
  /** Puce inclinée sur le haut de la carte (« Défi du jour · dimanche 15 novembre »). */
  kicker: string;
  /** Grand titre (type de défi, dernier mot estompé). */
  title: TitleContent;
  /** Ce que le minimoa propose (servi par l'API). */
  text: string;
  /** Ce que le défi rapporte (trois tuiles au plus). */
  rewards?: readonly ChallengeReward[];
  /** Zone d'action : boutons, deux réponses, état « fait ». */
  children?: ReactNode;
  /** Action secondaire sous la zone d'action (« Plus tard »), en texte à l'encre de la carte. */
  secondary?: { label: string; onPress: () => void; accessibilityLabel?: string } | null;
  /** Petite ligne tout en bas (« Il t'attend en haut de l'accueil jusqu'à minuit. »). */
  note?: string;
  /** Toucher le voile autour de la carte (= « plus tard »). */
  onDismiss: () => void;
  dismissLabel: string;
  /** À incrémenter pour fêter (défi fait) : la mèche se rallume, confettis, le minimoa saute de joie. */
  celebrateKey?: number;
  petLabel?: string;
}

const PET = 176;

/**
 * La carte du défi du jour (V6-GDefi) : elle monte du bas en plein écran, le minimoa jaillit derrière son bord haut
 * (sa mèche allumée), puis la puce, le titre et ce que le défi rapporte arrivent en cascade. La zone d'action est
 * libre (accepter, répondre, fait). Rien n'attend l'animation ; animations réduites : fondus seulement.
 * À présenter dans une route en modale transparente (le fond voilé laisse voir l'accueil).
 */
/** Lettres au-delà desquelles un mot de titre de récompense ne tient plus à 15 pt dans une tuile (« Sociabilité » : 11). */
const LONG_REWARD_WORD = 11;

export function ChallengeStage({ pet, streak, kicker, title, text, rewards = [], children, secondary, note, onDismiss, dismissLabel, celebrateKey = 0, petLabel }: ChallengeStageProps) {
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const reduced = useReducedMotion();
  // Un nom de récompense ne se coupe pas au milieu (« Sociabilidade ») : au-delà de 11 lettres, les trois titres passent
  // au plancher de 13 pt et les tuiles gagnent un peu de largeur utile (français et anglais restent à 15).
  const longReward = rewards.slice(0, 3).some((r) => r.title.split(/\s+/).some((w) => w.length > LONG_REWARD_WORD));
  const actor = useRef<PetActorHandle>(null);
  useOverlay(true);
  const veilO = useSharedValue(0);
  const rise = useSharedValue(0);
  const petUp = useSharedValue(0);

  useEffect(() => {
    hapticFor('land');
    if (reduced) {
      veilO.value = fadeTo(1, motion.base);
      rise.value = fadeTo(1, motion.base);
      petUp.value = fadeTo(1, motion.base);
      return;
    }
    veilO.value = withTiming(1, { duration: motion.base, easing: ease.out });
    rise.value = withSpring(1, { ...springs.soft, stiffness: 170, damping: 19 });
    petUp.value = withDelay(260, withSpring(1, springs.plush));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Défi fait : il saute de joie (la mèche se rallume via `igniteKey`).
  useEffect(() => {
    if (celebrateKey > 0) {
      hapticFor('celebrate');
      actor.current?.react('joy');
    }
  }, [celebrateKey]);

  const veilStyle = useAnimatedStyle(() => ({ opacity: veilO.value }));
  const card = useAnimatedStyle(() => ({
    opacity: reduced ? rise.value : Math.min(1, rise.value * 2),
    transform: [{ translateY: reduced ? 0 : (1 - rise.value) * win.height * 0.7 }],
  }));
  const petStyle = useAnimatedStyle(() => ({
    opacity: reduced ? petUp.value : petUp.value > 0 ? 1 : 0,
    transform: [{ translateY: reduced ? 0 : (1 - petUp.value) * PET * 0.75 }],
  }));

  const petH = Math.round(PET / 0.9);
  // Le minimoa dépasse du haut de la carte : sa mèche, sa tête et le haut du corps (les deux tiers de sa toile).
  const peek = Math.round(petH * 0.7);

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, styles.veil, veilStyle]}>
        <RNPressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityRole="button" accessibilityLabel={dismissLabel} />
      </Animated.View>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.sheet, { marginTop: insets.top + 8, paddingTop: peek - 14, marginBottom: Math.max(insets.bottom, 12) }, card]}
      >
        <Panel gradient="orange" radius={34} padding="none" overflow style={styles.panel}>
          {/* Le minimoa : caché derrière le bord haut de la carte, il jaillit et fait signe. */}
          <View pointerEvents="box-none" style={[styles.petSlot, { top: -peek, height: peek, width: PET + 40 }]}>
            <View style={styles.petClip}>
              <Animated.View style={[{ width: PET, height: petH }, petStyle]}>
                <PetActor
                  ref={actor}
                  species={pet.species}
                  outfit={pet.outfit}
                  size={PET}
                  seed={pet.id ?? pet.name}
                  shadow={false}
                  sleepAfter={null}
                  crest={<StreakFlame streak={streak} size={Math.round(PET * 0.3)} igniteKey={celebrateKey || null} />}
                  crestSize={Math.round(PET * 0.3)}
                  accessibilityLabel={petLabel ?? pet.name}
                />
              </Animated.View>
            </View>
          </View>
          <View pointerEvents="none" style={styles.kickerSlot}>
            <PopIn delay={reduced ? 0 : 420} from={0.6}>
              <Sticker label={kicker} tone="dark" font="body" rotate={-3} />
            </PopIn>
          </View>
          <ScrollView contentContainerStyle={styles.content} bounces={false} showsVerticalScrollIndicator={false}>
            <Title text={title} size={52} center style={styles.title} />
            <Text variant="bodyBold" size={17} center style={styles.text}>
              {text}
            </Text>
            {rewards.length ? (
              <View style={[layout.row, styles.rewards]}>
                {rewards.slice(0, 3).map((r, i) => (
                  <PopIn key={r.title} delay={reduced ? 0 : 560 + i * motion.stagger * 2} from={0.7} style={styles.rewardSlot}>
                    <View style={[styles.reward, longReward && styles.rewardTight]} accessible accessibilityLabel={`${r.title}, ${r.text}`}>
                      <View style={styles.rewardIcon}>{r.icon}</View>
                      <Text variant="bodyHeavy" size={longReward ? MIN_TEXT_SIZE : 15} center numberOfLines={2}>
                        {r.title}
                      </Text>
                      <Text variant="bodyBold" size={13} center style={styles.rewardText} numberOfLines={3}>
                        {r.text}
                      </Text>
                    </View>
                  </PopIn>
                ))}
              </View>
            ) : null}
            <View style={styles.actions}>{children}</View>
            {secondary ? (
              <Pressable onPress={secondary.onPress} accessibilityRole="button" accessibilityLabel={secondary.accessibilityLabel ?? secondary.label} style={styles.secondary}>
                <Text variant="bodyHeavy" size={17} center>
                  {secondary.label}
                </Text>
              </Pressable>
            ) : null}
            {note ? (
              <Text variant="bodyBold" size={13} center style={styles.note}>
                {note}
              </Text>
            ) : null}
          </ScrollView>
          <Burst kind="confetti" trigger={celebrateKey} count={18} size={12} spread={200} seed={`defi:${celebrateKey}`} style={styles.burst} />
        </Panel>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  veil: { backgroundColor: alpha(color.night, 0.78) },
  // V6-GDefi : carte orange à 14 des bords, le minimoa dépasse du haut.
  sheet: { flex: 1, marginHorizontal: 14, justifyContent: 'flex-end' },
  panel: { flexShrink: 1, maxHeight: '100%' },
  petSlot: { position: 'absolute', alignSelf: 'center', alignItems: 'center', overflow: 'hidden' },
  petClip: { flex: 1, justifyContent: 'flex-start', alignItems: 'center' },
  content: { paddingHorizontal: space.lg + 2, paddingTop: space.xl + 6, paddingBottom: space.lg, alignItems: 'stretch' },
  // La puce chevauche le bord haut de la carte, au pied du minimoa.
  kickerSlot: { position: 'absolute', top: -18, left: 0, right: 0, alignItems: 'center', zIndex: 3 },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: space.xs },
  title: { marginBottom: space.sm },
  text: { marginBottom: space.lg },
  rewards: { gap: space.sm, alignItems: 'stretch', marginBottom: space.lg },
  rewardSlot: { flex: 1 },
  reward: { flex: 1, minHeight: 124, borderRadius: radius.md + 4, paddingHorizontal: space.sm, paddingVertical: space.md, alignItems: 'center', gap: 2, backgroundColor: alpha(color.white, 0.32) },
  rewardIcon: { height: 46, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  rewardText: { opacity: 0.72 },
  rewardTight: { paddingHorizontal: space.xs },
  actions: { gap: space.sm },
  note: { marginTop: space.md, opacity: 0.72 },
  burst: { position: 'absolute', left: '50%', top: 40 },
  placeholder: { padding: space.lg + 2, gap: space.md },
  center: { alignSelf: 'center' },
});

export interface ChallengeStagePlaceholderProps {
  /** Le défi n'a pas chargé : message et « réessayer » à la place des squelettes. */
  error?: { title: string; actionLabel: string; onAction: () => void } | null;
  onDismiss: () => void;
  dismissLabel: string;
}

/** La carte du défi en attendant ses données (squelettes à sa forme), ou son erreur. Touchez le voile pour fermer. */
export function ChallengeStagePlaceholder({ error, onDismiss, dismissLabel }: ChallengeStagePlaceholderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root} accessibilityViewIsModal>
      <View style={[StyleSheet.absoluteFill, styles.veil]}>
        <RNPressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityRole="button" accessibilityLabel={dismissLabel} />
      </View>
      <View pointerEvents="box-none" style={[styles.sheet, { marginTop: insets.top + 120, marginBottom: Math.max(insets.bottom, 12) }]}>
        <Panel gradient="orange" radius={34} padding="none" style={styles.placeholder}>
          {error ? (
            <Banner tone="error" text="" title={error.title} actionLabel={error.actionLabel} onAction={error.onAction} onClose={onDismiss} closeLabel={dismissLabel} />
          ) : (
            <>
              <Skeleton height={56} width="70%" radius="md" style={styles.center} />
              <Skeleton height={20} width="85%" style={styles.center} delay={80} />
              <View style={[layout.row, styles.rewards]}>
                <Skeleton height={120} radius="md" style={layout.fill} delay={120} />
                <Skeleton height={120} radius="md" style={layout.fill} delay={160} />
                <Skeleton height={120} radius="md" style={layout.fill} delay={200} />
              </View>
              <Skeleton height={56} radius="pill" delay={240} />
            </>
          )}
        </Panel>
      </View>
    </View>
  );
}
