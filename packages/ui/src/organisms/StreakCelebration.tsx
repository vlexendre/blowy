import type { Outfit, Species } from '@blowy/domain';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable as RNPressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { PROP_RATIO, propImage } from '../assets/misc';
import { Panel } from '../atoms/Panel';
import { Sticker } from '../atoms/Sticker';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { useOverlay } from '../lib/overlay';
import { layout } from '../lib/styles';
import { Burst } from '../motion/Burst';
import { CountUp } from '../motion/CountUp';
import { PetActor, type PetActorHandle } from '../motion/pets/PetActor';
import { StreakFlame } from '../motion/pets/StreakFlame';
import { color, motion, space } from '../theme';
import type { TitleContent } from '../types';

export interface StreakCelebrationProps {
  visible: boolean;
  pet: { species: Species; outfit?: Outfit | null; name: string; id?: string };
  /** Série après le défi fait. */
  streak: number;
  /** Puce en haut (« Défi relevé »). */
  kicker: string;
  /** Sous le chiffre (« JOURS / DE SÉRIE. »). */
  title: TitleContent;
  /** Ce que dit le minimoa (servi par l'API), sinon une phrase de l'app. */
  line?: string | null;
  /** Puce « record battu » quand la série devient le record. */
  record?: string | null;
  /** « Touche pour continuer ». */
  tapLabel: string;
  /**
   * Palier de série (3, 7, 14, 30, 60, 100 jours) : le minimoa bombe le torse puis saute dans les confettis (`proud`),
   * le coffre du palier s'ouvre à côté de lui et la médaille rejoint les puces.
   */
  milestone?: boolean;
  onClose: () => void;
}


/**
 * La fête d'un défi relevé : plein écran nuit, le minimoa saute de joie et sa mèche se rallume plus grande, le
 * chiffre de la série défile d'un cran, confettis. Un tap n'importe où ferme. Animations réduites : fondus.
 */
export function StreakCelebration({ visible, pet, streak, kicker, title, line, record, tapLabel, milestone = false, onClose }: StreakCelebrationProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Petit écran (375 × 667) : le minimoa rapetisse pour que rien ne déborde.
  const PET = height < 740 ? 170 : 230;
  const reduced = useReducedMotion();
  const actor = useRef<PetActorHandle>(null);
  const [ignite, setIgnite] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const panel = useSharedValue(0);
  const tail = useSharedValue(0);
  const chest = useSharedValue(0);
  const [chestBurst, setChestBurst] = useState(0);
  useOverlay(visible);

  useEffect(() => {
    if (!visible) return;
    if (reduced) {
      panel.value = fadeTo(1, motion.base);
      tail.value = fadeTo(1, motion.base);
      setIgnite((n) => n + 1);
      hapticFor('celebrate');
      chest.value = fadeTo(1, motion.base);
      if (milestone) actor.current?.react('proud');
      return;
    }
    chest.value = 0;
    panel.value = 0;
    tail.value = 0;
    panel.value = withSpring(1, springs.pop);
    tail.value = withDelay(700, withTiming(1, { duration: motion.base, easing: ease.out }));
    const t1 = setTimeout(() => {
      setIgnite((n) => n + 1);
      setConfetti((n) => n + 1);
      hapticFor('celebrate');
      actor.current?.react(milestone ? 'proud' : 'joy');
    }, 380);
    // Palier : le coffre saute (il s'ouvre) quand le minimoa retombe de son saut, et lâche des étincelles.
    const t2 = milestone
      ? setTimeout(() => {
          chest.value = withSequence(withTiming(1.18, { duration: 180, easing: ease.out }), withSpring(1, springs.pop));
          setChestBurst((n) => n + 1);
        }, 1750)
      : undefined;
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduced]);

  const panelStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, panel.value * 1.4), transform: [{ scale: reduced ? 1 : 0.92 + 0.08 * panel.value }] }));
  const chestStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, chest.value), transform: [{ scale: chest.value }] }));
  const tailStyle = useAnimatedStyle(() => ({ opacity: tail.value, transform: [{ translateY: reduced ? 0 : 10 * (1 - tail.value) }] }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <GestureHandlerRootView style={layout.fill}>
          <RNPressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${streak}. ${line ?? ''} ${tapLabel}`}
            style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 18) + 8 }]}
          >
            <Animated.View style={[layout.fill, panelStyle]}>
              <Panel gradient="wine" radius={32} padding="none" style={layout.fill}>
                <View style={styles.panel}>
                  <View style={[layout.row, styles.chips]}>
                    <Sticker label={kicker} tone="accent" font="body" rotate={-3} />
                    {record ? <Sticker label={record} tone="white" font="body" rotate={3} /> : null}
                    {milestone ? <Image source={propImage('medaille')} contentFit="contain" style={styles.medal} accessibilityIgnoresInvertColors /> : null}
                  </View>
                  <View style={styles.count}>
                    <CountUp value={streak} from={Math.max(0, streak - 1)} variant="hero" size={128} duration={700} color={color.white} />
                  </View>
                  <Title text={title} size={44} center style={styles.title} />
                  <View style={styles.stage}>
                    <PetActor
                      ref={actor}
                      species={pet.species}
                      outfit={pet.outfit}
                      size={PET}
                      seed={pet.id ?? pet.name}
                      sleepAfter={null}
                      touch={false}
                      crest={<StreakFlame streak={streak} size={Math.round(PET * 0.42)} igniteKey={ignite || null} haptic={false} />}
                      crestSize={Math.round(PET * 0.42)}
                      accessibilityLabel={pet.name}
                    />
                    {milestone ? (
                      <Animated.View style={[styles.chest, { width: PET * 0.34, height: (PET * 0.34) / PROP_RATIO.coffre }, chestStyle]}>
                        <Image source={propImage('coffre')} contentFit="contain" style={layout.fill} />
                        <Burst kind="sparkles" trigger={chestBurst} seed={`coffre:${streak}`} spread={PET * 0.3} size={PET * 0.06} style={styles.chestBurst} />
                      </Animated.View>
                    ) : null}
                    <Burst kind="confetti" trigger={confetti} count={20} size={12} spread={210} seed={`serie:${streak}`} style={styles.burst} />
                  </View>
                  <Animated.View style={tailStyle}>
                    {line ? (
                      <Text variant="bodyBold" size={17} center style={styles.line}>
                        {line}
                      </Text>
                    ) : null}
                    <Text size={13} muted center>
                      {tapLabel}
                    </Text>
                  </Animated.View>
                </View>
              </Panel>
            </Animated.View>
          </RNPressable>
        </GestureHandlerRootView>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 14, backgroundColor: color.night },
  panel: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xl, alignItems: 'center' },
  chips: { gap: space.sm, alignSelf: 'flex-start' },
  count: { alignItems: 'center', marginTop: space.sm },
  title: { marginTop: space.sm },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  burst: { position: 'absolute', left: '50%', top: 60 },
  medal: { width: 30, height: 42 },
  // Le coffre du palier, posé au sol à droite du minimoa.
  chest: { position: 'absolute', right: 0, bottom: 4 },
  chestBurst: { position: 'absolute', left: '50%', top: '30%' },
  line: { marginBottom: space.sm },
});
