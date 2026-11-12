import type { Species } from '@blowy/domain';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { ease, fadeTo, springs, useReducedMotion } from '../lib/motion';
import { Appear } from '../motion/Appear';
import { motion, space } from '../theme';
import type { TitleContent } from '../types';

export interface AgeGateProps {
  species: Species;
  title: TitleContent;
  text: string;
  /** Ligne sous le panneau (« ton pet n'a pas été créé… »). */
  note: string;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
}

/** Le pet regarde, triste, puis se retourne (ms après l'arrivée). */
const TURN_AT = 1300;
const TURN = 140;

/**
 * Moins de 18 ans (V6-TropJeune) : panneau violet, pet triste qui se détourne, puis « fermer ».
 * Le pet arrive, baisse la tête, soupire et se retourne lentement (de dos, il flotte). Animations réduites : fondus.
 */
export function AgeGate({ species, title, text, note, actionLabel, onAction, loading }: AgeGateProps) {
  const reduced = useReducedMotion();
  const [turned, setTurned] = useState(false);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) {
      const id = setTimeout(() => {
        o.value = 0;
        setTurned(true);
        o.value = fadeTo(1, motion.base);
      }, TURN_AT);
      return () => clearTimeout(id);
    }
    // Soupir : il gonfle un peu, s'affaisse…
    sy.value = withDelay(500, withSequence(withTiming(1.05, { duration: 380, easing: ease.inOut }), withTiming(0.95, { duration: 420, easing: ease.inOut })));
    y.value = withDelay(900, withTiming(6, { duration: 400, easing: ease.inOut }));
    // …puis se retourne : il s'amincit (de profil), change de côté, et revient de dos.
    sx.value = withDelay(TURN_AT, withSequence(withTiming(0.04, { duration: TURN, easing: ease.in }), withSpring(1, springs.soft)));
    sy.value = withDelay(TURN_AT + TURN, withSpring(1, springs.soft));
    y.value = withDelay(TURN_AT + TURN, withSpring(0, springs.soft));
    const id = setTimeout(() => setTurned(true), TURN_AT + TURN);
    return () => clearTimeout(id);
  }, [reduced, sx, sy, y, o]);
  const turn = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { scaleX: sx.value }, { scaleY: sy.value }] }));
  return (
    <View style={styles.root}>
      <Appear scale={0.96} distance={14} style={styles.grow}>
        <Panel gradient="violet" radius={32} padding="none" style={styles.panel}>
          <Animated.View style={[styles.feet, turn]}>
            <PetImage
              species={species}
              mood={turned ? 'dos' : 'triste'}
              size={220}
              animation={turned ? 'bob' : 'none'}
              style={styles.pet}
            />
          </Animated.View>
          <Appear delay={160} distance={10}>
            <Title text={title} size={56} center style={styles.title} />
          </Appear>
          <Appear delay={260} distance={8}>
            <Text size={15} center style={styles.text}>
              {text}
            </Text>
          </Appear>
        </Panel>
      </Appear>
      <Appear delay={380} distance={6}>
        <Text size={13} muted center style={styles.note}>
          {note}
        </Text>
      </Appear>
      <Appear delay={440} distance={6}>
        <Button label={actionLabel} variant="ghost" onPress={onAction} loading={loading} />
      </Appear>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.md, paddingTop: space.md },
  grow: { flex: 1 },
  feet: { transformOrigin: '50% 90%' },
  panel: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20 },
  pet: { marginBottom: -10 },
  title: { marginTop: space.sm },
  text: { maxWidth: 270, lineHeight: 20 },
  note: { paddingHorizontal: space.md },
});
