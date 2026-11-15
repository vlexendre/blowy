import { type ComponentRef, type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Glyph } from '../atoms/Glyph';
import { Panel } from '../atoms/Panel';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { StreakPill } from '../molecules/StreakPill';
import { hapticFor } from '../lib/haptics';
import { ease, springs, useReducedMotion } from '../lib/motion';
import { layout } from '../lib/styles';
import { useBurst } from '../motion/MotionHost';
import { type GradientName, color, opacity, radius, space, veil } from '../theme';
import type { PersonLook, PetLook, TitleContent } from '../types';

export interface LinkTodaySide {
  /** « Toi », « Léa ». */
  label: string;
  /** A écrit aujourd'hui. */
  wrote: boolean;
}

export interface LinkTodayHeroProps {
  /** Série du lien (jours d'affilée où les deux se sont écrit). */
  streak: number;
  /** Unité sous le chiffre (« jours », « jour »). */
  streakUnit: string;
  /** Lu par les lecteurs d'écran (« 4 jours d'affilée »). */
  streakA11y?: string;
  /** L'état du jour, en grand (« À TOI / D'ÉCRIRE », « VOUS VOUS ÊTES / ÉCRIT »). */
  title: TitleContent;
  /** Une phrase sous le titre (« Léa t'a écrit. Avant minuit, la série passe à 5. »). */
  text: string;
  myPet: PetLook;
  other: PersonLook;
  me: LinkTodaySide;
  them: LinkTodaySide;
  /** « a écrit », « pas encore ». */
  wroteLabel: string;
  waitingLabel: string;
  /** Bouton qui mène au chat (« Écrire à Léa »). Absent : pas de bouton. */
  cta?: string;
  onCta?: () => void;
  gradient?: GradientName;
  /** Identifiant du lien : la flamme grandit et le chiffre défile depuis 0 à la première visite. */
  motionKey?: string;
}

/**
 * La journée d'un lien (onglet « Le lien ») : la série en vedette, qui a écrit aujourd'hui de chaque côté, et le bouton
 * vers le chat. Vedette : quand la série avance sous les yeux (le deuxième vient d'écrire), le chiffre défile d'un cran,
 * la flamme saute et des confettis partent d'elle ; animations réduites : le chiffre change seul.
 */
export function LinkTodayHero({
  streak,
  streakUnit,
  streakA11y,
  title,
  text,
  myPet,
  other,
  me,
  them,
  wroteLabel,
  waitingLabel,
  cta,
  onCta,
  gradient = 'orange',
  motionKey,
}: LinkTodayHeroProps) {
  const reduced = useReducedMotion();
  const burst = useBurst();
  const flame = useRef<ComponentRef<typeof View>>(null);
  const previous = useRef(streak);
  const pop = useSharedValue(1);
  useEffect(() => {
    const before = previous.current;
    previous.current = streak;
    if (streak <= before) return;
    hapticFor('celebrate');
    if (reduced) return;
    pop.value = withSequence(withTiming(1.22, { duration: 220, easing: ease.out }), withSpring(1, springs.plush));
    // Après le défilement du chiffre : confettis depuis la flamme.
    const timer = setTimeout(() => flame.current?.measureInWindow((x, y, w, h) => burst({ kind: 'confetti', x: x + w / 2, y: y + h / 3 })), 260);
    return () => clearTimeout(timer);
  }, [streak, reduced, burst, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Panel gradient={gradient} padding="none" style={styles.panel}>
      <View style={[layout.rowTop, styles.top]}>
        <View style={[layout.grow, styles.head]}>
          <Title text={title} size={38} />
          <Text variant="bodyBold" size={14} style={styles.text}>
            {text}
          </Text>
        </View>
        <Animated.View style={[styles.streak, popStyle]}>
          <View ref={flame} collapsable={false}>
            <StreakPill count={streak} label={streakUnit} variant="stack" growKey={motionKey} accessibilityLabel={streakA11y} />
          </View>
        </Animated.View>
      </View>
      <View style={[layout.row, styles.sides]}>
        <Side label={me.label} wrote={me.wrote} wroteLabel={wroteLabel} waitingLabel={waitingLabel} avatar={<Avatar size={30} pet={myPet} hidden />} />
        <Side
          label={them.label}
          wrote={them.wrote}
          wroteLabel={wroteLabel}
          waitingLabel={waitingLabel}
          avatar={<Avatar size={30} pet={other.pet} uri={other.avatarUrl} face={other.face} name={other.displayName} />}
        />
      </View>
      {cta && onCta ? <Button label={cta} variant="dark" icon="chat" onPress={onCta} style={styles.cta} /> : null}
    </Panel>
  );
}

function Side({ label, wrote, wroteLabel, waitingLabel, avatar }: { label: string; wrote: boolean; wroteLabel: string; waitingLabel: string; avatar: ReactNode }) {
  return (
    <View accessible accessibilityLabel={`${label}, ${wrote ? wroteLabel : waitingLabel}`} style={[layout.row, layout.grow, styles.side, wrote && styles.sideDone]}>
      {avatar}
      <View style={layout.shrink}>
        <Text variant="bodyHeavy" size={14} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="bodyBold" size={13} numberOfLines={1} style={!wrote && styles.waiting}>
          {wrote ? wroteLabel : waitingLabel}
        </Text>
      </View>
      {wrote ? (
        <View style={styles.tick}>
          <Glyph name="check" size={12} color={color.white} />
        </View>
      ) : null}
    </View>
  );
}

// Même famille que la carte du jour de V6-Aujourdhui : `.panel` rayon 32, 16 16 14.
const styles = StyleSheet.create({
  panel: { borderRadius: 32, paddingTop: space.lg, paddingHorizontal: space.lg, paddingBottom: space.md + 2 },
  top: { gap: space.sm },
  head: { gap: space.xs },
  text: { lineHeight: 18, marginTop: space.xs },
  streak: { marginTop: -space.xs, marginRight: -2, transformOrigin: '50% 70%' },
  sides: { gap: space.sm, marginTop: space.md + 2 },
  side: { gap: space.sm, paddingVertical: space.sm, paddingHorizontal: space.sm + 2, borderRadius: radius.lg, backgroundColor: veil.darkGlass },
  sideDone: { backgroundColor: veil.darkLabel },
  waiting: { opacity: opacity.mute },
  tick: { marginLeft: 'auto', width: 20, height: 20, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: color.dark },
  cta: { marginTop: space.md },
});
