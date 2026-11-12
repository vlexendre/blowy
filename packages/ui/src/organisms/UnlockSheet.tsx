import type { Outfit, Species } from '@blowy/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { ItemImage } from '../atoms/ItemImage';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { countWords, Title } from '../atoms/Title';
import { hapticFor } from '../lib/haptics';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { Burst } from '../motion/Burst';
import { PetActor, type PetActorHandle } from '../motion/pets/PetActor';
import { alpha, color, motion, shadow } from '../theme';
import type { TitleContent } from '../types';

export interface UnlockSheetProps {
  visible: boolean;
  /** L'objet débloqué (`PetView.newItems`). */
  itemId: string;
  /** Son nom (`itemLabel`), lu par le lecteur d'écran. */
  itemName: string;
  /** Le pet, déjà habillé avec l'objet (aperçu). */
  pet: { species: Species; outfit?: Outfit | null; name?: string };
  /** Puce en haut à gauche (« nouveau ! »). */
  kicker: string;
  /** « TACHES DE ROUSSEUR / POUR NINO. » */
  title: TitleContent;
  /** Ligne sous le titre (« 1 jour de soins. c'est mérité. »). */
  text?: string;
  /** Bouton jaune (« il le porte »). */
  wearLabel: string;
  onWear: () => void;
  wearing?: boolean;
  /** Bouton verre (« ranger dans la garde-robe »). */
  closeLabel: string;
  onClose: () => void;
}

const PET = 250;
/** Chorégraphie (ms depuis l'ouverture) : le panneau s'ouvre, l'objet tombe, se pose, confettis, titre mot à mot. */
const T = { drop: 260, fall: 440, words: 760, wordStep: 95 } as const;

/**
 * Fête d'un objet tout juste gagné (V6-Debloque), plein écran jaune : l'objet tombe du haut dans sa bulle, rebondit,
 * les confettis partent, il apparaît sur le pet qui saute de joie, puis le titre s'écrit mot à mot.
 * Un tap n'importe où saute directement à la fin. Animations réduites : tout apparaît en fondu, sans confettis.
 */
export function UnlockSheet({ visible, itemId, itemName, pet, kicker, title, text, wearLabel, onWear, wearing, closeLabel, onClose }: UnlockSheetProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const actor = useRef<PetActorHandle>(null);
  const words = countWords(title);
  const [shown, setShown] = useState(reduced ? words : 0);
  const [landed, setLanded] = useState(reduced);
  const [confetti, setConfetti] = useState(0);
  const panel = useSharedValue(0);
  const drop = useSharedValue(0);
  const squash = useSharedValue(0);
  const tail = useSharedValue(0);
  const act = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const land = useCallback(() => {
    setLanded(true);
    hapticFor('celebrate');
    setConfetti((n) => n + 1);
    actor.current?.react('joy');
  }, []);

  useEffect(() => {
    if (!visible) return;
    finished.current = false;
    clear();
    if (reduced) {
      setShown(words);
      setLanded(true);
      panel.value = fadeTo(1, motion.base);
      drop.value = 1;
      tail.value = fadeTo(1, motion.base);
      act.value = fadeTo(1, motion.base);
      hapticFor('celebrate');
      return;
    }
    setShown(0);
    setLanded(false);
    panel.value = 0;
    drop.value = 0;
    tail.value = 0;
    act.value = 0;
    panel.value = withSpring(1, springs.pop);
    // Les boutons arrivent dès que l'objet est posé (la fête ne retarde pas l'action).
    act.value = withDelay(T.drop + T.fall - 60, withTiming(1, { duration: motion.base, easing: ease.out }));
    // L'objet tombe (accélère), touche, s'écrase et rebondit deux fois (ressort `plush`).
    drop.value = withDelay(T.drop, withTiming(1, { duration: T.fall, easing: Easing.in(Easing.quad) }));
    squash.value = withDelay(T.drop + T.fall, withSequence(withTiming(1, { duration: 70, easing: ease.out }), withSpring(0, springs.plush)));
    timers.current.push(setTimeout(land, T.drop + T.fall));
    for (let i = 1; i <= words; i++) timers.current.push(setTimeout(() => setShown(i), T.words + i * T.wordStep));
    tail.value = withDelay(T.words + words * T.wordStep, withTiming(1, { duration: motion.base, easing: ease.out }));
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, itemId, reduced]);

  /** Tap n'importe où : fin immédiate de la fête (l'objet posé, le titre entier, les boutons). */
  const skip = () => {
    if (finished.current || reduced) return;
    finished.current = true;
    clear();
    panel.value = withTiming(1, { duration: motion.instant });
    drop.value = 1;
    squash.value = withTiming(0, { duration: motion.instant });
    tail.value = withTiming(1, { duration: motion.instant });
    act.value = withTiming(1, { duration: motion.instant });
    setShown(words);
    if (!landed) {
      setLanded(true);
      hapticFor('celebrate');
    }
  };

  const panelStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, panel.value * 1.5), transform: [{ scale: reduced ? 1 : 0.9 + 0.1 * panel.value }] }));
  const bubble = useAnimatedStyle(() => ({
    opacity: drop.value > 0 ? 1 : 0,
    transform: [
      { translateY: reduced ? 0 : -420 * (1 - drop.value) },
      { rotate: `${(1 - drop.value) * -40}deg` },
      { scaleX: 1 + 0.22 * squash.value },
      { scaleY: 1 - 0.26 * squash.value },
    ],
  }));
  const tailStyle = useAnimatedStyle(() => ({ opacity: tail.value, transform: [{ translateY: reduced ? 0 : 10 * (1 - tail.value) }] }));
  const actStyle = useAnimatedStyle(() => ({ opacity: act.value, transform: [{ translateY: reduced ? 0 : 16 * (1 - act.value) }] }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <GestureHandlerRootView style={layout.fill}>
          <View
            onTouchStart={skip}
            style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 18) + 8 }]}
            accessibilityViewIsModal
          >
            <Animated.View style={[styles.grow, panelStyle]}>
              <Panel gradient="accent" radius={32} padding="none" style={styles.grow}>
                <View style={styles.panel}>
                  <Chip label={kicker} tone="dark" ink={color.accent} style={styles.kicker} />
                  <View style={styles.stage}>
                    <PetActor
                      ref={actor}
                      species={pet.species}
                      outfit={pet.outfit}
                      size={PET}
                      hiddenItems={landed ? undefined : [itemId]}
                      sleepAfter={null}
                      accessibilityLabel={pet.name ? `${pet.name}, ${itemName}` : itemName}
                    />
                    <Animated.View style={[styles.item, shadow.soft, bubble]}>
                      <ItemImage id={itemId} size={58} />
                    </Animated.View>
                    <Burst kind="confetti" trigger={confetti} count={16} size={12} spread={190} seed={itemId} style={styles.burst} />
                  </View>
                  <Title text={title} size={52} center style={styles.title} reveal={shown >= words ? undefined : shown} />
                  {text ? (
                    <Animated.View style={tailStyle}>
                      <Text variant="bodyBold" size={15} center style={styles.text}>
                        {text}
                      </Text>
                    </Animated.View>
                  ) : null}
                </View>
              </Panel>
            </Animated.View>
            <Animated.View style={[styles.actions, actStyle]}>
              <Button label={wearLabel} onPress={onWear} loading={wearing} />
              <Button label={closeLabel} variant="ghost" onPress={onClose} disabled={wearing} />
            </Animated.View>
          </View>
        </GestureHandlerRootView>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // `.wrap` : padding 0 14, écart 12, fond nuit.
  root: { flex: 1, paddingHorizontal: 14, gap: 12, backgroundColor: color.night },
  grow: { flex: 1 },
  // `.panel` jaune : contenu calé en bas, centré, padding bas 20.
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  kicker: { position: 'absolute', top: 18, left: 18 },
  stage: { width: PET * 1.12, alignItems: 'center', marginBottom: -4 },
  item: {
    position: 'absolute',
    top: 6,
    right: 0,
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(color.white, 0.85),
    borderWidth: 3,
    borderColor: color.white,
    transformOrigin: '50% 100%',
  },
  burst: { position: 'absolute', top: 44, right: 38 },
  title: { marginTop: 8 },
  text: { marginTop: 6 },
  // Boutons : écart 8, 26 au-dessus du bas.
  actions: { gap: 8 },
});
