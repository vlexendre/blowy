import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { hapticFor } from '../lib/haptics';
import { InkProvider } from '../lib/ink';
import { fadeTo, springs, useReducedMotion } from '../lib/motion';
import { DrawnCheck } from '../motion/DrawnCheck';
import { color, motion, veil } from '../theme';

export interface HoldButtonProps {
  label: string;
  /** Libellé une fois l'anneau plein. */
  doneLabel: string;
  /** Appelé une fois, quand l'anneau est plein. */
  onDone: () => void;
  /** Une fois plein, toucher le bouton appelle ceci (« continuer » sans attendre) ; sans lui, il est désactivé. */
  onPressDone?: () => void;
  /** Libellé lu une fois plein, avec `onPressDone`. Défaut `doneLabel`. */
  doneA11yLabel?: string;
  /** Déjà fait (retour sur l'écran) : anneau plein, coche. */
  done?: boolean;
  /** Durée d'un appui maintenu jusqu'au bout (ms). Défaut 1100. */
  holdMs?: number;
  /** Diamètre (pt). Défaut 132. */
  size?: number;
  accessibilityHint?: string;
}

const RING = 8;
/** Un simple tap finit l'anneau tout seul, vite (accessibilité : rien n'oblige à maintenir). */
const FINISH_MS = 280;

/**
 * Bouton rond à maintenir (la promesse de l'inscription) : un anneau jaune se remplit autour pendant l'appui, le
 * bouton s'enfonce doucement ; plein, il vibre et affiche une coche. Un simple tap (ou le lecteur d'écran) marche
 * aussi : l'anneau se termine seul en 0,28 s. Relâcher en cours de route termine aussi l'anneau, vite.
 * L'anneau est fait de deux demi-disques qui tournent dans deux moitiés rognées (rotations seulement).
 * Animations réduites : pas d'anneau qui tourne, l'état plein arrive en fondu.
 */
export function HoldButton({ label, doneLabel, onDone, onPressDone, doneA11yLabel, done = false, holdMs = 1100, size = 132, accessibilityHint }: HoldButtonProps) {
  const reduced = useReducedMotion();
  const [full, setFull] = useState(done);
  const fired = useRef(done);
  // L'appui qui a rempli l'anneau ne doit pas aussi « continuer » en relâchant.
  const pressing = useRef(false);
  const swallow = useRef(false);
  const p = useSharedValue(done ? 1 : 0);
  const press = useSharedValue(0);
  const shown = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      p.value = 1;
      setFull(true);
    }
  }, [done, p]);

  const complete = () => {
    if (fired.current) return;
    fired.current = true;
    swallow.current = pressing.current;
    setFull(true);
    hapticFor('celebrate');
    shown.value = reduced ? fadeTo(1, motion.fast) : withTiming(1, { duration: motion.fast });
    press.value = reduced ? 0 : withSequence(withTiming(-0.06, { duration: 120 }), withSpring(0, springs.pop));
    onDone();
  };

  const fillTo = (ms: number) => {
    if (fired.current) return;
    if (reduced) {
      p.value = 1;
      complete();
      return;
    }
    cancelAnimation(p);
    const left = Math.max(1, ms * (1 - p.value));
    p.value = withTiming(1, { duration: left, easing: Easing.linear }, (finished) => {
      if (finished) scheduleOnRN(complete);
    });
  };

  const onPressIn = () => {
    pressing.current = true;
    if (fired.current) return;
    hapticFor('select');
    if (!reduced) press.value = withTiming(1, { duration: holdMs, easing: Easing.out(Easing.quad) });
    fillTo(holdMs);
  };
  const onPressOut = () => {
    pressing.current = false;
    if (fired.current) return;
    if (!reduced) press.value = withSpring(0, springs.pop);
    fillTo(FINISH_MS);
  };

  const half = size / 2;
  // Moitié droite : 0 → 50 %, moitié gauche : 50 → 100 % (sens des aiguilles d'une montre, depuis midi).
  const right = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.min(1, p.value * 2) * 180}deg` }] }));
  const left = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.max(0, p.value * 2 - 1) * 180}deg` }] }));
  const core = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.07 * press.value }] }));
  const ring = useAnimatedStyle(() => ({ opacity: reduced ? p.value : 1 }));
  const check = useAnimatedStyle(() => ({ opacity: shown.value }));
  const idle = useAnimatedStyle(() => ({ opacity: 1 - shown.value }));
  const disc = { width: size, height: size, borderRadius: half };
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => {
        if (swallow.current) {
          swallow.current = false;
          return;
        }
        if (full) onPressDone?.();
        else fillTo(FINISH_MS);
      }}
      disabled={full && !onPressDone}
      scaleTo={1}
      haptic={false}
      accessibilityLabel={full ? (doneA11yLabel ?? doneLabel) : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: full && !onPressDone, checked: full }}
      style={[styles.wrap, disc]}
    >
      <View style={[styles.track, disc]} />
      <Animated.View style={[StyleSheet.absoluteFill, ring]}>
        {/* Moitié droite rognée : le demi-disque gauche y entre en tournant. */}
        <View style={[styles.clip, { left: half, width: half, height: size }]}>
          <Animated.View style={[styles.rotor, { left: -half, ...disc }, right]}>
            <View style={[styles.halfFill, { width: half, height: size, borderTopLeftRadius: half, borderBottomLeftRadius: half }]} />
          </Animated.View>
        </View>
        <View style={[styles.clip, { left: 0, width: half, height: size }]}>
          <Animated.View style={[styles.rotor, disc, left]}>
            <View style={[styles.halfFill, { left: half, width: half, height: size, borderTopRightRadius: half, borderBottomRightRadius: half }]} />
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.View style={[styles.core, { width: size - RING * 2, height: size - RING * 2, borderRadius: half - RING }, core]}>
        <InkProvider value={color.white}>
          <Animated.View style={[styles.face, idle]}>
            <Text variant="bodyHeavy" size={20} center>
              {label}
            </Text>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.face, check]}>
            {full ? <DrawnCheck size={34} color={color.accent} strokeWidth={4} /> : null}
            <Text variant="bodyHeavy" size={15} center>
              {doneLabel}
            </Text>
          </Animated.View>
        </InkProvider>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  track: { position: 'absolute', left: 0, top: 0, backgroundColor: veil.track },
  clip: { position: 'absolute', top: 0, overflow: 'hidden' },
  rotor: { position: 'absolute', top: 0 },
  halfFill: { position: 'absolute', top: 0, backgroundColor: color.accent },
  core: { alignItems: 'center', justifyContent: 'center', backgroundColor: color.card, overflow: 'hidden' },
  face: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
});
